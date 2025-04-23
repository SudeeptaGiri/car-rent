// src/app/components/car-booking/car-booking.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { LocationDialogComponent } from '../../components/location-dialog/location-dialog.component';
import { CarBookingService } from '../../services/car-booking.service';
import { UserInfo, LocationInfo } from '../../models/booking.model';
import { CarDetails } from '../../models/car.interface';
import { CarReservedDialogComponent } from '../../components/car-reserved-dialog/car-reserved-dialog.component';
import { BookingSuccessDialogComponent } from '../../components/booking-success-dialog/booking-success-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { CarService } from '../../services/car.service';

@Component({
  selector: 'app-car-booking',
  templateUrl: './car-booking.component.html',
  styleUrls: ['./car-booking.component.css'], 
  standalone: false
})
export class CarBookingComponent implements OnInit {
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

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private carBookingService: CarBookingService,
    private carService: CarService,
    private route: ActivatedRoute,
  ) {}

 // In car-booking.component.ts
 ngOnInit(): void {
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

    // Get mock user and location info
    this.userInfo = this.carBookingService.getMockUserInfo();
    this.locationInfo = this.carBookingService.getMockLocationInfo();
    
    // First, initialize userInfo with default values to avoid null reference
    this.userInfo = this.carBookingService.getMockUserInfo();
    
    // Then get user data from localStorage
    this.getUserFromLocalStorage();
    
    // After user data is loaded, initialize form
    this.initForm();
  });
}
  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
  }
  getUserFromLocalStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userInfo = {
          fullName: user.firstName && user.lastName ? 
            `${user.firstName} ${user.lastName}` : 
            (user.fullName || user.name || 'User'),
          email: user.email || '',
          phone: user.phone || this.carBookingService.getMockUserInfo().phone
        };
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        // Fallback to mock data if there's an error
        this.userInfo = this.carBookingService.getMockUserInfo();
      }
    } else {
      // If no user in localStorage, use mock data
      this.userInfo = this.carBookingService.getMockUserInfo();
    }
  }

  initForm(): void {
    // Make sure userInfo is properly set before using it
    if (!this.userInfo) {
      this.userInfo = this.carBookingService.getMockUserInfo();
    }
  
    this.bookingForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: [this.userInfo.fullName, Validators.required],
        email: [this.userInfo.email, [Validators.required, Validators.email]],
        phone: [this.userInfo.phone, Validators.required]
      }),
      // Rest of the form initialization remains the same
      location: this.fb.group({
        pickupLocation: [this.locationInfo.pickupLocation, Validators.required],
        dropoffLocation: [this.locationInfo.dropoffLocation, Validators.required]
      }),
      dates: this.fb.group({
        dateFrom: ['2023-11-12T10:00', Validators.required],
        dateTo: ['2023-11-16T16:00', Validators.required]
      })
    });
  
    // Rest of the method remains the same
    this.dateFrom = new Date(this.bookingForm.get('dates.dateFrom')?.value);
    this.dateTo = new Date(this.bookingForm.get('dates.dateTo')?.value);
  
    this.bookingForm.get('dates')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  calculateTotalPrice(): void {
    const dateFromStr = this.bookingForm.get('dates.dateFrom')?.value;
    const dateToStr = this.bookingForm.get('dates.dateTo')?.value;
  
    if (dateFromStr && dateToStr && this.selectedCar) {
      // Create dates in IST timezone
      this.dateFrom = new Date(dateFromStr);
      this.dateTo = new Date(dateToStr);
  
      // Calculate difference in days (use UTC to avoid timezone issues)
      const diffTime = Math.abs(this.dateTo.getTime() - this.dateFrom.getTime());
      this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice = this.numberOfDays * this.selectedCar.price;
    }
  }

  confirmReservation(): void {
    if(this.isReserved) {
      this.dialog.open(CarReservedDialogComponent, {
        width: '400px',
        panelClass: 'car-reserved-dialog',
        position: { top: '0' },
        disableClose: true
      });
      return;
    }
    if (this.bookingForm.valid && this.selectedCar) {
      const bookingData = {
        dateFrom: this.dateFrom.toISOString(), // Convert Date to ISO string
        dateTo: this.dateTo.toISOString(),     // Convert Date to ISO string
        clientId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      };
      
      this.carBookingService.bookCar(bookingData).subscribe({
        next: (response) => {
          console.log('Booking confirmed:', response);
          this.showBookingSuccessDialog();
        },
        error: (error) => {
          console.error('Booking failed:', error);
          alert('Booking failed. Please try again.');
        }
      });
    }
}
  
showBookingSuccessDialog(): void {
  const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
  
  this.dialog.open(BookingSuccessDialogComponent, {
    width: '500px',
    maxWidth: '95vw',
    panelClass: 'success-dialog-container',
    data: {
      carName: `${this.selectedCar.brand} ${this.selectedCar.model}`,
      startDate: this.dateFrom,
      endDate: this.dateTo,
      orderNumber: orderNumber,
      bookingDate: new Date(),
      totalPrice: this.totalPrice,
      numberOfDays: this.numberOfDays
    }
  });
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

  // Update in car-booking.component.ts
// openDateChange(): void {
//   const dialogRef = this.dialog.open(CalendarComponent, {
//     width: '700px',
//     maxWidth: '95vw',
//     data: {
//       bookedDates: [] // Pass any booked dates here
//     },
//     panelClass: 'date-picker-dialog',
//     autoFocus: false // Add this to prevent focus stealing
//   });

//   // Set isOpen to true directly after dialog is opened
//   const calendarInstance = dialogRef.componentInstance;
//   calendarInstance.isOpen = true;
  
//   // Subscribe to dateRangeSelected event
//   const subscription = calendarInstance.dateRangeSelected.subscribe(result => {
//     if (result) {
//       // Convert moment objects to Date objects
//       this.dateFrom = result.startDate.toDate();
//       this.dateTo = result.endDate.toDate();

//       // Update the form with the new dates
//       this.bookingForm.patchValue({
//         dates: {
//           dateFrom: this.dateFrom.toISOString(),
//           dateTo: this.dateTo.toISOString()
//         }
//       });

//       // Recalculate total price
//       this.calculateTotalPrice();
      
//       // Close the dialog
//       dialogRef.close();
//     }
//   });

//   // Clean up subscription when dialog closes
//   dialogRef.afterClosed().subscribe(() => {
//     subscription.unsubscribe();
//   });
// }

  getDefaultEndDate(): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5); // Default to 5 days rental
    return endDate;
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', { 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  }
  
  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  }

  // In car-booking.component.ts
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

// Add a getter for formatted booked dates
get bookedDatesFormatted(): { startDate: string; endDate: string; }[] {
  // This would come from your car service in a real app
  return this.selectedCar?.bookedDates?.map(date => ({
    startDate: date.startDate,
    endDate: date.endDate
  })) || [];
}
}