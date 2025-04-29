// src/app/components/car-booking/car-booking.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LocationDialogComponent } from '../../components/location-dialog/location-dialog.component';
import { CarBookingService } from '../../services/car-booking.service';
import { UserInfo, LocationInfo } from '../../models/booking.model';
import { CarDetails } from '../../models/car.interface';
import { Subject, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { CarService, LocationSuggestion } from '../../services/car.service';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'app-car-booking',
  templateUrl: './car-booking.component.html',
  styleUrls: ['./car-booking.component.css'], 
  standalone: false
})
export class CarBookingComponent implements OnInit, OnDestroy {
  CarDetails = [];
  bookingForm!: FormGroup;
  selectedCar!: CarDetails;
  userInfo!: UserInfo;
  locationInfo!: LocationInfo;
  isReserved = false;     // change this to display reserved dialog
  
  totalPrice = 0;
  depositAmount = 2000;
  numberOfDays = 0;
  dateFrom!: Date;
  dateTo!: Date;
  isCalendarOpen = false;

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

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private carBookingService: CarBookingService,
    private carService: CarService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user info
    this.userInfo = this.carService.getUserInfo();
    this.locationInfo = this.carService.getMockLocationInfo();
    
    // Initialize form
    this.initForm();
    
    // Setup search debouncing for locations
    this.setupLocationSearch();

    // Get car ID and dates from route parameters
    this.route.queryParams.subscribe(params => {
      if (params['carId']) {
        // Get car details using CarService
        this.carService.getCarDetails(params['carId']).subscribe({
          next: (car) => {
            if (car) {
              this.selectedCar = car;
              
              // If dates are provided in the URL, use them
              if (params['startDate'] && params['endDate']) {
                const startDate = new Date(`${params['startDate']} ${params['startTime']}`);
                const endDate = new Date(`${params['endDate']} ${params['endTime']}`);
                
                this.dateFrom = startDate;
                this.dateTo = endDate;
                
                // Update form with these dates
                this.bookingForm.patchValue({
                  dates: {
                    dateFrom: startDate.toISOString(),
                    dateTo: endDate.toISOString()
                  }
                });
                
                // Calculate total price
                this.calculateTotalPrice();
              }
            }
          },
          error: (error) => {
            console.error('Error loading car details:', error);
          }
        });
      }
    });
  }
  
  // Location validation methods
  isLocationInvalid(controlName: string): boolean {
    const location = controlName === 'pickupLocation' ? 
      this.selectedPickupLocation : this.selectedDropoffLocation;
    return this.carService.isLocationInvalid(location);
  }
  
  isDuplicateLocations(): boolean {
    return this.carService.isDuplicateLocations(this.selectedPickupLocation, this.selectedDropoffLocation);
  }

  isFormValid(): boolean {
    return this.carService.isFormValid(
      this.bookingForm.valid,
      this.selectedPickupLocation,
      this.selectedDropoffLocation
    );
  }

  // Location search methods - delegating to service
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

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.searchSubscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: [this.userInfo.fullName, Validators.required],
        email: [this.userInfo.email, [Validators.required, Validators.email]],
        phone: [this.userInfo.phone, Validators.required]
      }),
      location: this.fb.group({
        pickupLocation: [this.locationInfo.pickupLocation, Validators.required],
        dropoffLocation: [this.locationInfo.dropoffLocation, Validators.required]
      }),
      dates: this.fb.group({
        dateFrom: ['2023-11-12T10:00', Validators.required],
        dateTo: ['2023-11-16T16:00', Validators.required]
      })
    });
  
    // Initialize dates
    this.dateFrom = new Date(this.bookingForm.get('dates.dateFrom')?.value);
    this.dateTo = new Date(this.bookingForm.get('dates.dateTo')?.value);
  
    // Subscribe to date changes
    this.bookingForm.get('dates')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  calculateTotalPrice(): void {
    const dateFromStr = this.bookingForm.get('dates.dateFrom')?.value;
    const dateToStr = this.bookingForm.get('dates.dateTo')?.value;
  
    if (dateFromStr && dateToStr && this.selectedCar) {
      // Create dates
      this.dateFrom = new Date(dateFromStr);
      this.dateTo = new Date(dateToStr);
  
      // Use service to calculate price
      const result = this.carService.calculateTotalPrice(
        this.dateFrom, 
        this.dateTo, 
        this.selectedCar.price
      );
      
      this.numberOfDays = result.numberOfDays;
      this.totalPrice = result.totalPrice;
    }
  }

  confirmReservation(): void {
    this.carService.confirmReservation(
      this.isFormValid(),
      this.selectedCar,
      this.dateFrom,
      this.dateTo,
      this.totalPrice,
      this.numberOfDays,
      this.bookingForm.get('location.pickupLocation')?.value,
      this.bookingForm.get('location.dropoffLocation')?.value,
      // this.isReserved
    );
  }
  
  openLocationChange(): void {
    const dialogRef = this.dialog.open(LocationDialogComponent, {
      width: '500px',
      data: {
        pickupLocation: this.bookingForm.get('location.pickupLocation')?.value,
        dropoffLocation: this.bookingForm.get('location.dropoffLocation')?.value
      }
    });

    dialogRef.afterClosed().subscribe((result: {pickupLocation: string, dropoffLocation: string} | undefined) => {
      if (result) {
        this.bookingForm.get('location')?.patchValue({
          pickupLocation: result.pickupLocation,
          dropoffLocation: result.dropoffLocation
        });
      }
    });
  }

  onDateRangeSelected(event: {startDate: moment.Moment, endDate: moment.Moment}): void {
    this.carService.onDateRangeSelected(event, this);
  }

  // Add a getter for formatted booked dates
  get bookedDatesFormatted(): { startDate: string; endDate: string; }[] {
    return this.carService.formatBookedDates(this.selectedCar?.bookedDates);
  }
}