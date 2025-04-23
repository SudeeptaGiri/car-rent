// src/app/components/car-booking/car-booking.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CalendarComponent } from '../calendar/calendar.component';
import { LocationDialogComponent } from '../../components/location-dialog/location-dialog.component';
import { CarBookingService } from '../../services/car-booking.service';
import { CarDetails, UserInfo, LocationInfo } from '../../models/booking.model';
import { CarReservedDialogComponent } from '../../components/car-reserved-dialog/car-reserved-dialog.component';
import { BookingSuccessDialogComponent } from '../../components/booking-success-dialog/booking-success-dialog.component';

@Component({
  selector: 'app-car-booking',
  templateUrl: './car-booking.component.html',
  styleUrls: ['./car-booking.component.css'], 
  standalone: false
})
export class CarBookingComponent implements OnInit {
  bookingForm!: FormGroup;
  selectedCar!: CarDetails;
  userInfo!: UserInfo;
  locationInfo!: LocationInfo;
  isReserved = true;
  
  totalPrice = 0;
  depositAmount = 2000;
  numberOfDays = 0;
  dateFrom!: Date;
  dateTo!: Date;
  isCalendarOpen = false;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private carBookingService: CarBookingService
  ) {}

  ngOnInit(): void {
    // Get mock data
    this.selectedCar = this.carBookingService.getMockCarDetails();
    this.locationInfo = this.carBookingService.getMockLocationInfo();
    
    // First, initialize userInfo with default values to avoid null reference
    this.userInfo = this.carBookingService.getMockUserInfo();
    
    // Then get user data from localStorage
    this.getUserFromLocalStorage();
    
    // After user data is loaded, initialize form
    this.initForm();
    
    // Calculate initial price
    this.calculateTotalPrice();
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
        dateFrom: ['2023-11-11T10:00', Validators.required],
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
  
    if (dateFromStr && dateToStr) {
      // Create dates in IST timezone
      this.dateFrom = new Date(dateFromStr);
      this.dateTo = new Date(dateToStr);
  
      // Calculate difference in days (use UTC to avoid timezone issues)
      const diffTime = Math.abs(this.dateTo.getTime() - this.dateFrom.getTime());
      this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice = this.numberOfDays * this.selectedCar.pricePerDay;
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
    if (this.bookingForm.valid) {
      const bookingData = {
        dateFrom: this.bookingForm.get('dates.dateFrom')?.value,
        dateTo: this.bookingForm.get('dates.dateTo')?.value,
        clientId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' // This would typically come from authentication
      };
      
      this.carBookingService.bookCar(bookingData).subscribe({
        next: (response) => {
          console.log('Booking confirmed:', response);
          
          // Show booking success dialog instead of alert
          this.showBookingSuccessDialog();
        },
        error: (error) => {
          console.error('Booking failed:', error);
          // Handle error
          alert('Booking failed. Please try again.');
        }
      });
    }
  }

  // New method to show booking success dialog
  showBookingSuccessDialog(): void {
    // Generate a random order number (in a real app, this would come from the backend)
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Open the success dialog
    this.dialog.open(BookingSuccessDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'success-dialog-container',
      data: {
        carName: this.selectedCar.name,
        startDate: this.dateFrom,
        endDate: this.dateTo,
        orderNumber: orderNumber,
        bookingDate: new Date() // Current date as booking date
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
}