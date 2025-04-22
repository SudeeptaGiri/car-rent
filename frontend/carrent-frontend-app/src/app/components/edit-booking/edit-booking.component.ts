// src/app/components/edit-booking/edit-booking.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { CalendarComponent } from '../calendar/calendar.component';
import { LocationDialogComponent } from '../location-dialog/location-dialog.component';

@Component({
  selector: 'app-edit-booking',
  templateUrl: './edit-booking.component.html',
  styleUrls: ['./edit-booking.component.css'],
  standalone: false
})
export class EditBookingComponent implements OnInit {
  bookingForm!: FormGroup;
  booking!: Booking;
  totalPrice = 0;
  depositAmount = 2000;
  numberOfDays = 0;
  dateFrom!: Date;
  dateTo!: Date;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get booking ID from route params
    this.route.params.subscribe(params => {
      const bookingId = params['id'];
      if (bookingId) {
        this.loadBooking(bookingId);
      }
    });
  }

  loadBooking(bookingId: string): void {
    this.bookingService.getBookings().subscribe(bookings => {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        this.booking = booking;
        this.initForm();
        this.calculateTotalPrice();
      } else {
        // Handle booking not found
        this.router.navigate(['/my-bookings']);
      }
    });
  }

  initForm(): void {
    // Get user info from the booking
    const userInfo = {
      fullName: 'Anastasia Dubenko', // This would come from user service in a real app
      email: 'dubenko@gmail.com',
      phone: '+38 111 111 11 11'
    };
    
    // Initialize form with booking data
    this.bookingForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: [userInfo.fullName, Validators.required],
        email: [userInfo.email, [Validators.required, Validators.email]],
        phone: [userInfo.phone, Validators.required]
      }),
      location: this.fb.group({
        pickupLocation: ['Kyiv Hyatt Hotel', Validators.required],
        dropoffLocation: ['Kyiv Hyatt Hotel', Validators.required]
      }),
      dates: this.fb.group({
        dateFrom: [this.booking.pickupDate.toISOString(), Validators.required],
        dateTo: [this.booking.dropoffDate.toISOString(), Validators.required]
      })
    });

    // Set initial dateFrom and dateTo as Date objects
    this.dateFrom = new Date(this.booking.pickupDate);
    this.dateTo = new Date(this.booking.dropoffDate);

    // Calculate total price whenever dates change
    this.bookingForm.get('dates')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }

  calculateTotalPrice(): void {
    if (this.dateFrom && this.dateTo) {
      // Calculate difference in days
      const diffTime = Math.abs(this.dateTo.getTime() - this.dateFrom.getTime());
      this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.totalPrice = this.numberOfDays * 180; // Assuming $180 per day
    }
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

  openDateChange(): void {
    const dialogRef = this.dialog.open(CalendarComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        dateFrom: this.dateFrom?.toISOString() || new Date().toISOString(),
        dateTo: this.dateTo?.toISOString() || this.getDefaultEndDate().toISOString()
      },
      panelClass: 'date-picker-dialog'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Create new Date objects from the result
        this.dateFrom = new Date(result.dateFrom);
        this.dateTo = new Date(result.dateTo);
  
        // Update the form with the new dates
        this.bookingForm.patchValue({
          dates: {
            dateFrom: this.dateFrom.toISOString(),
            dateTo: this.dateTo.toISOString()
          }
        }, { emitEvent: true }); // Ensure the valueChanges event is triggered
  
        // Recalculate total price
        this.calculateTotalPrice();
      }
    });
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
      // Update booking with new dates
      this.bookingService.updateBookingDates(
        this.booking.id,
        this.dateFrom,
        this.dateTo
      ).subscribe({
        next: () => {
          // Navigate back to my-bookings page
          this.router.navigate(['/my-bookings']);
        },
        error: (error) => {
          console.error('Error updating booking:', error);
          // Handle error
        }
      });
    }
  }
}