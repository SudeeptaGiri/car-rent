import { map } from 'rxjs/operators';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, of, Subject, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CalendarComponent } from '../calendar/calendar.component';
import { FilterService } from '../../services/filter.service';



interface LocationSuggestion {
  displayName: string;
  lat: number;
  lon: number;
}

interface FilterData {
  pickupLocation: string | null;
  pickupCoordinates: { lat: number; lon: number } | null;
  dropoffLocation: string | null;
  dropoffCoordinates: { lat: number; lon: number } | null;
  pickupDate: string;
  dropoffDate: string;
  carCategory: string;
  gearbox: string;
  engineType: string;
  priceMin: number;
  priceMax: number;
}

@Component({
  selector: 'app-filter',
  standalone: false,
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit, AfterViewInit {
  @ViewChild('rangeSlider') rangeSliderElement!: ElementRef;
  @ViewChild('calendarComponent') calendarComponent!: CalendarComponent;

  // Price slider properties
  minPrice: number = 50;
  maxPrice: number = 2000;
  currentMinPrice: number = 50; // Changed from 52
  currentMaxPrice: number = 2000; // Changed from 400


  // Track slider state
  private isDraggingMin = false;
  private isDraggingMax = false;
  sliderWidth = 0;
  sliderLeft = 0;

  // Location search properties
  pickupSearchQuery = '';
  dropoffSearchQuery = '';
  pickupSuggestions: LocationSuggestion[] = [];
  dropoffSuggestions: LocationSuggestion[] = [];
  showPickupSuggestions = false;
  showDropoffSuggestions = false;
  isLoadingPickupSuggestions = false;
  isLoadingDropoffSuggestions = false;

  // Location modal state
  showPickupModal = false;
  showDropoffModal = false;

  // Search subjects for debouncing
  private pickupSearchSubject = new Subject<string>();
  private dropoffSearchSubject = new Subject<string>();
  private searchSubscriptions: Subscription[] = [];

  // Selected locations
  selectedPickupLocation: string | null = null;
  selectedPickupCoordinates: { lat: number; lon: number } | null = null;
  selectedDropoffLocation: string | null = null;
  selectedDropoffCoordinates: { lat: number; lon: number } | null = null;

  filterData: FilterData = {
    pickupLocation: null,
    pickupCoordinates: null,
    dropoffLocation: null,
    dropoffCoordinates: null,
    pickupDate: 'October 29',
    dropoffDate: 'October 31',
    carCategory: '',
    gearbox: '',
    engineType: '',
    priceMin: 50,
    priceMax: 2000
  };
  
  // Filter data object
  private defaultFilters: FilterData = {
    pickupLocation: null,
    pickupCoordinates: null,
    dropoffLocation: null,
    dropoffCoordinates: null,
    pickupDate: 'October 29',
    dropoffDate: 'October 31',
    carCategory: '', // Changed from 'Passenger car' to empty string
    gearbox: '',     // Changed from 'Automatic' to empty string
    engineType: '',  // Changed from 'Gasoline' to empty string
    priceMin: 50,
    priceMax: 2000
  };

  constructor(private http: HttpClient, private filterService: FilterService) { }
  ngOnInit(): void {
    // Setup search debouncing for pickup location
    this.searchSubscriptions.push(
      this.pickupSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.trim().length < 2) {
            this.pickupSuggestions = [];
            this.isLoadingPickupSuggestions = false;
            return of([]);
          }

          this.isLoadingPickupSuggestions = true;
          return this.searchLocations(query).pipe(
            catchError(() => {
              this.isLoadingPickupSuggestions = false;
              return of([]);
            })
          );
        })
      ).subscribe(results => {
        this.pickupSuggestions = results;
        this.isLoadingPickupSuggestions = false;
      })
    );

    // Setup search debouncing for dropoff location
    this.searchSubscriptions.push(
      this.dropoffSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.trim().length < 2) {
            this.dropoffSuggestions = [];
            this.isLoadingDropoffSuggestions = false;
            return of([]);
          }

          this.isLoadingDropoffSuggestions = true;
          return this.searchLocations(query).pipe(
            catchError(() => {
              this.isLoadingDropoffSuggestions = false;
              return of([]);
            })
          );
        })
      ).subscribe(results => {
        this.dropoffSuggestions = results;
        this.isLoadingDropoffSuggestions = false;
      })
    );
  }

  ngAfterViewInit(): void {
    if (this.rangeSliderElement) {
      const sliderElement = this.rangeSliderElement.nativeElement;
      const minHandle = sliderElement.querySelector('.min-handle');
      const maxHandle = sliderElement.querySelector('.max-handle');

      if (minHandle && maxHandle) {
        // Initialize handle positions
        this.updateSliderPositions();

        // Add mouse events
        minHandle.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          this.isDraggingMin = true;
        });

        maxHandle.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          this.isDraggingMax = true;
        });

        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));

        // Add touch events
        minHandle.addEventListener('touchstart', (e: TouchEvent) => {
          e.preventDefault();
          this.isDraggingMin = true;
        }, { passive: false });

        maxHandle.addEventListener('touchstart', (e: TouchEvent) => {
          e.preventDefault();
          this.isDraggingMax = true;
        }, { passive: false });

        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
      }
    }
  }


  private onTouchMove(e: TouchEvent): void {
    if (!this.isDraggingMin && !this.isDraggingMax) return;
    
    const touch = e.touches[0];
    const sliderRect = this.rangeSliderElement.nativeElement.getBoundingClientRect();
    const sliderWidth = sliderRect.width;
    
    // Calculate position as percentage within slider
    let position = (touch.clientX - sliderRect.left) / sliderWidth;
    position = Math.max(0, Math.min(1, position)); // Clamp to [0,1]
    
    // Same logic as onMouseMove
    const minBasePrice = this.minPrice;
    const maxBasePrice = this.maxPrice;
    const priceSpan = maxBasePrice - minBasePrice;
    
    if (this.isDraggingMin) {
      // Ensure min handle doesn't exceed max handle
      const maxPerc = (this.currentMaxPrice - minBasePrice) / priceSpan;
      if (position > maxPerc - 0.05) {
        position = maxPerc - 0.05;
      }
      
      const newPrice = Math.round(minBasePrice + (position * priceSpan));
      this.currentMinPrice = newPrice;
      this.filterData.priceMin = newPrice;
    } else if (this.isDraggingMax) {
      // Ensure max handle doesn't go below min handle
      const minPerc = (this.currentMinPrice - minBasePrice) / priceSpan;
      if (position < minPerc + 0.05) {
        position = minPerc + 0.05;
      }
      
      const newPrice = Math.round(minBasePrice + (position * priceSpan));
      this.currentMaxPrice = newPrice;
      this.filterData.priceMax = newPrice;
    }
    
    this.updateSliderPositions();
  }

  private onTouchEnd(e: TouchEvent): void {
    if (this.isDraggingMin || this.isDraggingMax) {
      this.isDraggingMin = false;
      this.isDraggingMax = false;

      // Important: Update filter service with price changes
      this.filterService.updateFilters({ ...this.filterData });
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.isDraggingMin || this.isDraggingMax) {
      this.isDraggingMin = false;
      this.isDraggingMax = false;

      // Important: Update filter service with price changes
      this.filterService.updateFilters({ ...this.filterData });
    }
  }

  // Fix the price calculation in the onMouseMove method

  private onMouseMove(e: MouseEvent): void {
  if (!this.isDraggingMin && !this.isDraggingMax) return;
  
  const sliderRect = this.rangeSliderElement.nativeElement.getBoundingClientRect();
  const sliderWidth = sliderRect.width;
  
  // Calculate position as percentage within slider
  let position = (e.clientX - sliderRect.left) / sliderWidth;
  position = Math.max(0, Math.min(1, position)); // Clamp to [0,1]
  
  const minBasePrice = this.minPrice;
  const maxBasePrice = this.maxPrice;
  const priceSpan = maxBasePrice - minBasePrice;
  
  if (this.isDraggingMin) {
    // Ensure min handle doesn't exceed max handle
    const maxPerc = (this.currentMaxPrice - minBasePrice) / priceSpan;
    if (position > maxPerc - 0.05) {
      position = maxPerc - 0.05;
    }
    
    const newPrice = Math.round(minBasePrice + (position * priceSpan));
    this.currentMinPrice = newPrice;
    this.filterData.priceMin = newPrice;
    
    console.log(`Min price set to: $${newPrice}`);
  } else if (this.isDraggingMax) {
    // Ensure max handle doesn't go below min handle
    const minPerc = (this.currentMinPrice - minBasePrice) / priceSpan;
    if (position < minPerc + 0.05) {
      position = minPerc + 0.05;
    }
    
    const newPrice = Math.round(minBasePrice + (position * priceSpan));
    this.currentMaxPrice = newPrice;
    this.filterData.priceMax = newPrice;
    
    console.log(`Max price set to: $${newPrice}`);
  }
  
  this.updateSliderPositions();
}

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.searchSubscriptions.forEach(sub => sub.unsubscribe());
  }

  // Location search methods
  searchLocations(query: string) {
    // Using OpenStreetMap's Nominatim API for geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

    return this.http.get<any[]>(url).pipe(
      map(results => results.map(item => ({
        displayName: item.display_name.split(',').slice(0, 2).join(','), // Simplify display name
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      })))
    );
  }

  onPickupSearchInput(): void {
    this.showPickupSuggestions = true;
    this.pickupSearchSubject.next(this.pickupSearchQuery);
  }

  onDropoffSearchInput(): void {
    this.showDropoffSuggestions = true;
    this.dropoffSearchSubject.next(this.dropoffSearchQuery);
  }

  selectPickupLocation(suggestion: LocationSuggestion): void {
    this.selectedPickupLocation = suggestion.displayName;
    this.selectedPickupCoordinates = { lat: suggestion.lat, lon: suggestion.lon };
    this.pickupSearchQuery = suggestion.displayName;
    this.showPickupSuggestions = false;
    this.showPickupModal = false;

    // Update filter data
    this.filterData.pickupLocation = suggestion.displayName;
    this.filterData.pickupCoordinates = { lat: suggestion.lat, lon: suggestion.lon };
  }

  selectDropoffLocation(suggestion: LocationSuggestion): void {
    this.selectedDropoffLocation = suggestion.displayName;
    this.selectedDropoffCoordinates = { lat: suggestion.lat, lon: suggestion.lon };
    this.dropoffSearchQuery = suggestion.displayName;
    this.showDropoffSuggestions = false;
    this.showDropoffModal = false;

    // Update filter data
    this.filterData.dropoffLocation = suggestion.displayName;
    this.filterData.dropoffCoordinates = { lat: suggestion.lat, lon: suggestion.lon };
  }

  useCurrentLocation(forPickup: boolean): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };

          // Reverse geocode to get address
          this.reverseGeocode(coords.lat, coords.lon).subscribe(
            (address) => {
              if (forPickup) {
                this.selectedPickupLocation = address;
                this.selectedPickupCoordinates = coords;
                this.pickupSearchQuery = address;
                this.showPickupModal = false;

                // Update filter data
                this.filterData.pickupLocation = address;
                this.filterData.pickupCoordinates = coords;
              } else {
                this.selectedDropoffLocation = address;
                this.selectedDropoffCoordinates = coords;
                this.dropoffSearchQuery = address;
                this.showDropoffModal = false;

                // Update filter data
                this.filterData.dropoffLocation = address;
                this.filterData.dropoffCoordinates = coords;
              }
            },
            (error) => {
              console.error('Error getting address:', error);
              alert('Could not determine your address. Please enter it manually.');
            }
          );
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Could not access your location. Please check your browser permissions and try again.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please enter your location manually.');
    }
  }

  reverseGeocode(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    return this.http.get<any>(url).pipe(
      map(result => {
        if (result && result.display_name) {
          return result.display_name.split(',').slice(0, 2).join(',');
        }
        return 'Current location';
      }),
      catchError(() => of('Current location'))
    );
  }

  openLocationModal(forPickup: boolean): void {
    if (forPickup) {
      this.showPickupModal = true;
      this.showDropoffModal = false;
    } else {
      this.showPickupModal = false;
      this.showDropoffModal = true;
    }
  }

  closeLocationModal(): void {
    this.showPickupModal = false;
    this.showDropoffModal = false;
  }

  // Price slider methods
  initRangeSlider(): void {
    this.updateSliderDimensions();
    this.updateSliderPositions();

    const slider = this.rangeSliderElement.nativeElement;
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');

    minHandle.addEventListener('mousedown', (e: MouseEvent) => {
      this.startDragMin(e);
    });

    maxHandle.addEventListener('mousedown', (e: MouseEvent) => {
      this.startDragMax(e);
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      this.onDrag(e);
    });

    document.addEventListener('mouseup', () => {
      this.stopDrag();
    });

    minHandle.addEventListener('touchstart', (e: TouchEvent) => {
      this.startDragMin(e.touches[0]);
      e.preventDefault();
    });

    maxHandle.addEventListener('touchstart', (e: TouchEvent) => {
      this.startDragMax(e.touches[0]);
      e.preventDefault();
    });

    document.addEventListener('touchmove', (e: TouchEvent) => {
      this.onDrag(e.touches[0]);
    }, { passive: false });

    document.addEventListener('touchend', () => {
      this.stopDrag();
    });
  }

  updateSliderDimensions(): void {
    const slider = this.rangeSliderElement.nativeElement;
    const rect = slider.getBoundingClientRect();
    this.sliderWidth = rect.width;
    this.sliderLeft = rect.left;
  }

  startDragMin(e: MouseEvent | Touch): void {
    this.isDraggingMin = true;
    this.updateMinPosition(e.clientX);
  }

  startDragMax(e: MouseEvent | Touch): void {
    this.isDraggingMax = true;
    this.updateMaxPosition(e.clientX);
  }

  onDrag(e: MouseEvent | Touch): void {
    if (this.isDraggingMin) {
      this.updateMinPosition(e.clientX);
    } else if (this.isDraggingMax) {
      this.updateMaxPosition(e.clientX);
    }
  }

  stopDrag(): void {
    this.isDraggingMin = false;
    this.isDraggingMax = false;
  }

  updateMinPosition(clientX: number): void {
    const slider = this.rangeSliderElement.nativeElement;
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');

    let position = clientX - this.sliderLeft;
    position = Math.max(0, Math.min(position, this.sliderWidth));

    const maxHandlePosition = parseInt(maxHandle.style.left || '0', 10);
    position = Math.min(position, maxHandlePosition);

    const priceRange = this.maxPrice - this.minPrice;
    const percentage = position / this.sliderWidth;
    this.currentMinPrice = Math.round(this.minPrice + (percentage * priceRange));

    // Update filter data
    this.filterData.priceMin = this.currentMinPrice;

    minHandle.style.left = `${position}px`;
    this.updateTrackFill();
  }

  updateMaxPosition(clientX: number): void {
    const slider = this.rangeSliderElement.nativeElement;
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');

    let position = clientX - this.sliderLeft;
    position = Math.max(0, Math.min(position, this.sliderWidth));

    const minHandlePosition = parseInt(minHandle.style.left || '0', 10);
    position = Math.max(position, minHandlePosition);

    const priceRange = this.maxPrice - this.minPrice;
    const percentage = position / this.sliderWidth;
    this.currentMaxPrice = Math.round(this.minPrice + (percentage * priceRange));

    // Update filter data
    this.filterData.priceMax = this.currentMaxPrice;

    maxHandle.style.left = `${position}px`;
    this.updateTrackFill();
  }

  private updateTrackFill(): void {
    if (!this.rangeSliderElement) return;
    
    const sliderTrack = this.rangeSliderElement.nativeElement.querySelector('.slider-track');
    if (!sliderTrack) return;
    
    const minBasePrice = this.minPrice;
    const maxBasePrice = this.maxPrice;
    
    const minPerc = ((this.currentMinPrice - minBasePrice) / (maxBasePrice - minBasePrice)) * 100;
    const maxPerc = ((this.currentMaxPrice - minBasePrice) / (maxBasePrice - minBasePrice)) * 100;
    
    sliderTrack.style.background = 
      `linear-gradient(to right, #e5e5e5 0%, #e5e5e5 ${minPerc}%, #d32f2f ${minPerc}%, #d32f2f ${maxPerc}%, #e5e5e5 ${maxPerc}%, #e5e5e5 100%)`;
  }

  // Method to programmatically update slider positions
  updateSliderPositions(): void {
    if (!this.rangeSliderElement) return;
    
    const sliderElement = this.rangeSliderElement.nativeElement;
    const minHandle = sliderElement.querySelector('.min-handle');
    const maxHandle = sliderElement.querySelector('.max-handle');
    
    if (!minHandle || !maxHandle) return;
    
    const sliderWidth = sliderElement.offsetWidth;
    
    const minBasePrice = this.minPrice;
    const maxBasePrice = this.maxPrice;
    const priceRange = maxBasePrice - minBasePrice;
    
    const minPercentage = (this.currentMinPrice - minBasePrice) / priceRange;
    const maxPercentage = (this.currentMaxPrice - minBasePrice) / priceRange;
    
    const minPosition = minPercentage * sliderWidth;
    const maxPosition = maxPercentage * sliderWidth;
    
    minHandle.style.left = `${minPosition}px`;
    maxHandle.style.left = `${maxPosition}px`;
    
    this.updateTrackFill();
  }

  // Form handling methods
  onSelectChange(field: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    switch (field) {
      case 'pickupDate':
        this.filterData.pickupDate = value;
        break;
      case 'dropoffDate':
        this.filterData.dropoffDate = value;
        break;
      case 'carCategory':
        this.filterData.carCategory = value;
        break;
      case 'gearbox':
        this.filterData.gearbox = value;
        break;
      case 'engineType':
        this.filterData.engineType = value;
        break;
    }
  }



  clearFilters(): void {
    // Reset filter values
    this.filterData = {
      pickupLocation: null,
      pickupCoordinates: null,
      dropoffLocation: null,
      dropoffCoordinates: null,
      pickupDate: 'October 29',
      dropoffDate: 'October 31',
      carCategory: '',  // Changed to empty string
      gearbox: '',      // Changed to empty string
      engineType: '',   // Changed to empty string
      priceMin: this.minPrice,
      priceMax: this.maxPrice
    };

    // Reset UI state
    this.selectedPickupLocation = null;
    this.selectedPickupCoordinates = null;
    this.selectedDropoffLocation = null;
    this.selectedDropoffCoordinates = null;
    this.pickupSearchQuery = '';
    this.dropoffSearchQuery = '';
    this.currentMinPrice = 50;
    this.currentMaxPrice = 2000;

    // Reset form controls
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      select.selectedIndex = 0;
    });

    if (this.calendarComponent) {
      this.calendarComponent.resetCalendar();
    }

    // Reset slider
    this.updateSliderPositions();
    this.filterService.resetFilters();
  }

  findCars(): void {
    console.log('Finding cars with filters:', this.filterData);
    
    // Make sure price range is correctly set
    this.filterData = {
      ...this.filterData,
      priceMin: this.currentMinPrice,
      priceMax: this.currentMaxPrice
    };
    
    // Update the filter service
    this.filterService.updateFilters({...this.filterData});
  }
}

// Add the missing 'map' operator