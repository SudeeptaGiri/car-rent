// src/app/components/edit-booking/edit-booking.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { CalendarComponent } from '../calendar/calendar.component';
// import { LocationDialogComponent } from '../location-dialog/location-dialog.component';

interface LocationSuggestion {
  displayName: string;
  lat: number;
  lon: number;
}
@Component({
  selector: 'app-edit-booking',
  templateUrl: './edit-booking.component.html',
  styleUrls: ['./edit-booking.component.css'],
  standalone: false
})

export class EditBookingComponent implements OnInit {
  pickupSearchQuery = '';
  dropoffSearchQuery = '';
  pickupSuggestions: LocationSuggestion[] = [];
  dropoffSuggestions: LocationSuggestion[] = [];
  showPickupSuggestions = false;
  showDropoffSuggestions = false;
  isLoadingPickupSuggestions = false;
  isLoadingDropoffSuggestions = false;
  showPickupModal = false;
  showDropoffModal = false;
  selectedPickupLocation: string | null = null;
  selectedDropoffLocation: string | null = null;
  private pickupSearchSubject = new Subject<string>();
  private dropoffSearchSubject = new Subject<string>();
  private searchSubscriptions: Subscription[] = [];
  selectedPickupCoordinates: { lat: number; lon: number } | null = null;
  selectedDropoffCoordinates: { lat: number; lon: number } | null = null
  name!:string;
  email!:string;
  phone!:string;


  bookingForm!: FormGroup;
  booking!: Booking;
  totalPrice = 0;
  depositAmount = 2000;
  numberOfDays = 0;
  dateFrom!: Date;
  dateTo!: Date;

  isCalendarOpen = false;
  
  // Add this getter for formatted booked dates
  get bookedDatesFormatted(): { startDate: string; endDate: string; }[] {
    // You can get booked dates from your service or pass them as input
    return [];
  }
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private http: HttpClient
  ) {
    console.log('EditBookingComponent initialized'); // Debug log
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    console.log('Current user:', currentUser); // Debug log
    this.name = (currentUser?.firstName+" "+currentUser?.lastName) || 'Unable to retrieve name';
    this.email = currentUser?.email || 'Unable to retrieve email';
    this.phone = currentUser?.phone || '+38 111 111 11 11'; // Default phone number
  }

  private setupLocationSearch(): void {
    this.searchSubscriptions.push(
      this.pickupSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          this.isLoadingPickupSuggestions = true;
          return this.searchLocations(query);
        })
      ).subscribe(suggestions => {
        this.pickupSuggestions = suggestions;
        this.isLoadingPickupSuggestions = false;
      })
    );

    this.searchSubscriptions.push(
      this.dropoffSearchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          this.isLoadingDropoffSuggestions = true;
          return this.searchLocations(query);
        })
      ).subscribe(suggestions => {
        this.dropoffSuggestions = suggestions;
        this.isLoadingDropoffSuggestions = false;
      })
    );
  }

  private searchLocations(query: string) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    
    return this.http.get<any[]>(url).pipe(
      map(results => results.map(item => ({
        displayName: item.display_name.split(',').slice(0, 2).join(','),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      })))
    );
  }

  ngOnInit(): void {
    this.setupLocationSearch();
    this.route.params.subscribe(params => {
      const bookingId = params['id'];
      console.log('Booking ID from route:', bookingId); // Debug log
      if (bookingId) {
        this.loadBooking(bookingId);
      }
    });
  }

  carPricePerDay: number = 0;

loadBooking(bookingId: string): void {
  this.bookingService.getBookings().subscribe(bookings => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      this.booking = booking;
      this.selectedPickupLocation = booking.pickupLocation;
      this.selectedDropoffLocation = booking.dropoffLocation;
      this.dateFrom = new Date(booking.pickupDate);
      this.dateTo = new Date(booking.dropoffDate);
      
      // Get the car price per day by dividing total price by number of days
      this.carPricePerDay = booking.totalPrice / booking.numberOfDays;
      
      this.initForm();
      this.calculateTotalPrice();
    } else {
      this.router.navigate(['/my-bookings']);
    }
  });
}

  initForm(): void {
    if (!this.booking) return;

    // Initialize form with booking data
    this.bookingForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: [{value: this.name, disabled: true}],
        email: [{value: this.email, disabled: true}],
        phone: [{value: this.phone, disabled: true}]
      }),
      location: this.fb.group({
        pickupLocation: [this.selectedPickupLocation || this.booking.pickupLocation],
        dropoffLocation: [this.selectedDropoffLocation || this.booking.dropoffLocation]
      }),
      dates: this.fb.group({
        dateFrom: [this.dateFrom.toISOString()],
        dateTo: [this.dateTo.toISOString()]
      })
    });

    // Subscribe to date changes to update price
    this.bookingForm.get('dates')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
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
    
    this.bookingForm.get('location')?.patchValue({
      pickupLocation: suggestion.displayName
    });
  }

  selectDropoffLocation(suggestion: LocationSuggestion): void {
    this.selectedDropoffLocation = suggestion.displayName;
    this.selectedDropoffCoordinates = { lat: suggestion.lat, lon: suggestion.lon };
    this.dropoffSearchQuery = suggestion.displayName;
    this.showDropoffSuggestions = false;
    this.showDropoffModal = false;
    
    this.bookingForm.get('location')?.patchValue({
      dropoffLocation: suggestion.displayName
    });
  }

  useCurrentLocation(forPickup: boolean): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          this.reverseGeocode(coords.lat, coords.lon).subscribe(
            (address) => {
              if (forPickup) {
                this.selectedPickupLocation = address;
                this.selectedPickupCoordinates = coords;
                this.pickupSearchQuery = address;
                this.showPickupModal = false;
                
                this.bookingForm.get('location')?.patchValue({
                  pickupLocation: address
                });
              } else {
                this.selectedDropoffLocation = address;
                this.selectedDropoffCoordinates = coords;
                this.dropoffSearchQuery = address;
                this.showDropoffModal = false;
                
                this.bookingForm.get('location')?.patchValue({
                  dropoffLocation: address
                });
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
      this.pickupSearchQuery = this.selectedPickupLocation || '';
    } else {
      this.showPickupModal = false;
      this.showDropoffModal = true;
      this.dropoffSearchQuery = this.selectedDropoffLocation || '';
    }
  }

  closeLocationModal(): void {
    this.showPickupModal = false;
    this.showDropoffModal = false;
  }

  ngOnDestroy(): void {
    this.searchSubscriptions.forEach(sub => sub.unsubscribe());
  }  

  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
  }

  onDateRangeSelected(event: {startDate: moment.Moment, endDate: moment.Moment}): void {
    // Convert moment objects to Date objects
    this.dateFrom = event.startDate.toDate();
    this.dateTo = event.endDate.toDate();

    // Update the form with the new dates
    this.bookingForm.patchValue({
      dates: {
        dateFrom: this.dateFrom.toISOString(),
        dateTo: this.dateTo.toISOString()
      }
    });

    // Recalculate total price
    this.calculateTotalPrice();
  }

  calculateTotalPrice(): void {
    if (this.dateFrom && this.dateTo) {
      // Calculate difference in days
      const diffTime = Math.abs(this.dateTo.getTime() - this.dateFrom.getTime());
      this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice = this.numberOfDays * this.carPricePerDay; // Use actual car price instead of 180
    }
  }


  getDefaultEndDate(): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5); // Default to 5 days rental
    return endDate;
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric'
    });
  }
  
  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false
    });
  }

  saveBooking(): void {
    if (this.bookingForm.valid) {
      // Get the form values
      const formValues = this.bookingForm.value;
  
      // Update booking with new dates
      this.bookingService.updateBookingDates(
        this.booking.id,
        this.dateFrom,
        this.dateTo
      ).subscribe({
        next: () => {
          // Show success message (optional)
          // Navigate back to my-bookings page
          this.router.navigate(['/my-bookings']);
        },
        error: (error) => {
          console.error('Error updating booking:', error);
          alert('Failed to update booking. Please try again.');
        }
      });
    }
  }
}