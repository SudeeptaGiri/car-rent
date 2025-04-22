import { map } from 'rxjs/operators';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, of, Subject, Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CalendarComponent } from '../calendar/calendar.component';


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
  standalone:false,
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit, AfterViewInit {
  @ViewChild('rangeSlider') rangeSliderElement!: ElementRef;
  @ViewChild('calendarComponent') calendarComponent!: CalendarComponent;
  
  // Price slider properties
  minPrice: number = 50;
  maxPrice: number = 2000;
  currentMinPrice: number = 52;
  currentMaxPrice: number = 400;
  
  // Track slider state
  isDraggingMin = false;
  isDraggingMax = false;
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
  
  // Filter data object
  filterData: FilterData = {
    pickupLocation: null,
    pickupCoordinates: null,
    dropoffLocation: null,
    dropoffCoordinates: null,
    pickupDate: 'October 29',
    dropoffDate: 'October 31',
    carCategory: 'Passenger car',
    gearbox: 'Automatic',
    engineType: 'Gasoline',
    priceMin: 52,
    priceMax: 400
  };
  
  constructor(private http: HttpClient) { }

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
    this.initRangeSlider();
    
    window.addEventListener('resize', () => {
      this.updateSliderDimensions();
      this.updateSliderPositions();
    });
    
    // Close suggestion lists when clicking outside
    document.addEventListener('click', (event) => {
      if (!(event.target as HTMLElement).closest('.location-search-container')) {
        this.showPickupSuggestions = false;
        this.showDropoffSuggestions = false;
      }
    });
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
  
  updateTrackFill(): void {
    const slider = this.rangeSliderElement.nativeElement;
    const track = slider.querySelector('.slider-track');
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    const minPos = parseInt(minHandle.style.left || '0', 10);
    const maxPos = parseInt(maxHandle.style.left || '0', 10);
    
    const fillStart = (minPos / this.sliderWidth) * 100;
    const fillEnd = (maxPos / this.sliderWidth) * 100;
    
    track.style.background = `linear-gradient(
      to right, 
      #e5e5e5 0%, 
      #e5e5e5 ${fillStart}%, 
      #d32f2f ${fillStart}%, 
      #d32f2f ${fillEnd}%, 
      #e5e5e5 ${fillEnd}%, 
      #e5e5e5 100%
    )`;
  }
  
  updateSliderPositions(): void {
    const slider = this.rangeSliderElement.nativeElement;
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    const priceRange = this.maxPrice - this.minPrice;
    const minPercentage = (this.currentMinPrice - this.minPrice) / priceRange;
    const maxPercentage = (this.currentMaxPrice - this.minPrice) / priceRange;
    
    const minPosition = minPercentage * this.sliderWidth;
    const maxPosition = maxPercentage * this.sliderWidth;
    
    minHandle.style.left = `${minPosition}px`;
    maxHandle.style.left = `${maxPosition}px`;
    
    this.updateTrackFill();
  }
  
  // Form handling methods
  onSelectChange(field: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    
    switch(field) {
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
    // Reset all filter values
    this.filterData = {
      pickupLocation: null,
      pickupCoordinates: null,
      dropoffLocation: null,
      dropoffCoordinates: null,
      pickupDate: 'October 29',
      dropoffDate: 'October 31',
      carCategory: 'Passenger car',
      gearbox: 'Automatic',
      engineType: 'Gasoline',
      priceMin: 52,
      priceMax: 400
    };
    
    // Reset UI state
    this.selectedPickupLocation = null;
    this.selectedPickupCoordinates = null;
    this.selectedDropoffLocation = null;
    this.selectedDropoffCoordinates = null;
    this.pickupSearchQuery = '';
    this.dropoffSearchQuery = '';
    this.currentMinPrice = 52;
    this.currentMaxPrice = 400;
    
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
  }
  
  findCars(): void {
    console.log('Filter data:', this.filterData);
    // Implement your search logic here
  }
}

// Add the missing 'map' operator