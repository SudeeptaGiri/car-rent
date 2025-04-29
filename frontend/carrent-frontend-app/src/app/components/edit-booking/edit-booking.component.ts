// src/app/components/edit-booking/edit-booking.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { CarService, LocationSuggestion } from '../../services/car.service';
import * as moment from 'moment';

@Component({
  selector: 'app-edit-booking',
  templateUrl: './edit-booking.component.html',
  styleUrls: ['./edit-booking.component.css'],
  standalone: false
})
export class EditBookingComponent implements OnInit, OnDestroy {
  bookingForm!: FormGroup;
  booking!: Booking;
  
  // Location search properties
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
  
  // Selected locations
  selectedPickupLocation: string | null = null;
  selectedPickupCoordinates: { lat: number; lon: number } | null = null;
  selectedDropoffLocation: string | null = null;
  selectedDropoffCoordinates: { lat: number; lon: number } | null = null;
  
  // Search subjects for debouncing
  private pickupSearchSubject = new Subject<string>();
  private dropoffSearchSubject = new Subject<string>();
  private searchSubscriptions: Subscription[] = [];
  
  // Booking properties
  totalPrice = 0;
  depositAmount = 2000;
  numberOfDays = 0;
  dateFrom!: Date;
  dateTo!: Date;
  isCalendarOpen = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService
  ) {}

  ngOnInit(): void {
    // Setup location search with debouncing
    this.setupLocationSearch();
    
    // Load booking data from route parameter
    this.route.params.subscribe(params => {
      const bookingId = params['id'];
      if (bookingId) {
        this.loadBooking(bookingId);
      } else {
        // If no booking ID, redirect to bookings list
        this.router.navigate(['/my-bookings']);
      }
    });
  }

  loadBooking(bookingId: string): void {
    this.carService.getBookingById(bookingId).subscribe({
      next: (booking) => {
        if (booking) {
          this.booking = booking;
          
          // Set initial locations from booking
          this.selectedPickupLocation = booking.pickupLocation;
          this.selectedDropoffLocation = booking.dropoffLocation;
          
          // Set initial dates from booking
          this.dateFrom = new Date(booking.pickupDate);
          this.dateTo = new Date(booking.dropoffDate);
          
          // Set initial price values
          this.numberOfDays = booking.numberOfDays;
          this.totalPrice = booking.totalPrice;
          
          // Initialize form with booking data
          this.initForm();
        } else {
          // Booking not found, redirect to bookings list
          this.router.navigate(['/my-bookings']);
        }
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.router.navigate(['/my-bookings']);
      }
    });
  }

  initForm(): void {
    if (!this.booking) return;

    // Get user info from localStorage
    const userInfo = this.carService.getUserInfo();

    // Initialize form with booking data
    this.bookingForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: [{value: userInfo.fullName, disabled: true}],
        email: [{value: userInfo.email, disabled: true}],
        phone: [{value: userInfo.phone, disabled: true}]
      }),
      location: this.fb.group({
        pickupLocation: [this.selectedPickupLocation || this.booking.pickupLocation, Validators.required],
        dropoffLocation: [this.selectedDropoffLocation || this.booking.dropoffLocation, Validators.required]
      }),
      dates: this.fb.group({
        dateFrom: [this.dateFrom.toISOString(), Validators.required],
        dateTo: [this.dateTo.toISOString(), Validators.required]
      })
    });

    // Subscribe to date changes to update price
    this.bookingForm.get('dates')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  // Setup location search with debouncing
  setupLocationSearch(): void {
    // Setup pickup location search
    this.searchSubscriptions.push(
      this.carService.setupLocationSearch(
        this.pickupSearchSubject,
        (results) => this.pickupSuggestions = results,
        (isLoading) => this.isLoadingPickupSuggestions = isLoading
      )
    );
    
    // Setup dropoff location search
    this.searchSubscriptions.push(
      this.carService.setupLocationSearch(
        this.dropoffSearchSubject,
        (results) => this.dropoffSuggestions = results,
        (isLoading) => this.isLoadingDropoffSuggestions = isLoading
      )
    );
  }

  // Location methods - delegating to service
  onPickupSearchInput(): void {
    this.showPickupSuggestions = true;
    this.pickupSearchSubject.next(this.pickupSearchQuery);
  }
  
  onDropoffSearchInput(): void {
    this.showDropoffSuggestions = true;
    this.dropoffSearchSubject.next(this.dropoffSearchQuery);
  }
  
  selectPickupLocation(suggestion: LocationSuggestion): void {
    this.carService.selectPickupLocation(suggestion, this);
  }
  
  selectDropoffLocation(suggestion: LocationSuggestion): void {
    this.carService.selectDropoffLocation(suggestion, this);
  }
  
  useCurrentLocation(forPickup: boolean): void {
    this.carService.useCurrentLocation(forPickup, this);
  }
  
  openLocationModal(forPickup: boolean): void {
    this.carService.openLocationModal(forPickup, this);
  }
  
  closeLocationModal(): void {
    this.carService.closeLocationModal(this);
  }

  toggleCalendar(): void {
    this.carService.toggleCalendar(this);
  }

  calculateTotalPrice(): void {
    const dateFromStr = this.bookingForm.get('dates.dateFrom')?.value;
    const dateToStr = this.bookingForm.get('dates.dateTo')?.value;
    
    if (dateFromStr && dateToStr && this.booking) {
      // Create dates
      this.dateFrom = new Date(dateFromStr);
      this.dateTo = new Date(dateToStr);
      
      // Calculate price based on daily rate
      const dailyRate = this.booking.totalPrice / this.booking.numberOfDays;
      
      // Use service to calculate price
      const result = this.carService.calculateTotalPrice(
        this.dateFrom, 
        this.dateTo, 
        dailyRate
      );
      
      this.numberOfDays = result.numberOfDays;
      this.totalPrice = result.totalPrice;
    }
  }

  onDateRangeSelected(event: {startDate: moment.Moment, endDate: moment.Moment}): void {
    this.carService.onDateRangeSelected(event, this);
  }

  saveBooking(): void {
    if (this.bookingForm.valid && this.booking) {
      // Get updated values from form
      const updatedPickupLocation = this.selectedPickupLocation || this.booking.pickupLocation;
      const updatedDropoffLocation = this.selectedDropoffLocation || this.booking.dropoffLocation;
      
      // Update booking object with new values
      this.booking.pickupDate = this.dateFrom;
      this.booking.dropoffDate = this.dateTo;
      this.booking.pickupLocation = updatedPickupLocation;
      this.booking.dropoffLocation = updatedDropoffLocation;
      this.booking.numberOfDays = this.numberOfDays;
      this.booking.totalPrice = this.totalPrice;
      
      // Call service to update booking
      this.carService.updateBooking(this.booking).subscribe({
        next: () => {
          // Navigate back to my-bookings page on success
          this.router.navigate(['/my-bookings']);
        },
        error: (error) => {
          console.error('Error updating booking:', error);
          alert('Failed to update booking. Please try again.');
        }
      });
    }
  }

  // Getter for formatted booked dates (for calendar component)
  get bookedDatesFormatted(): { startDate: string; endDate: string; }[] {
    // This would come from your booking service in a real app
    return [];
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.searchSubscriptions.forEach(sub => sub.unsubscribe());
  }
}