import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { BookingService } from '../../services/booking.service';
import { Booking, BookingStatus } from '../../models/booking.model';
import { CancelBookingDialogComponent } from '../cancel-booking-dialog/cancel-booking-dialog.component';
import { FeedbackDialogComponent } from '../feedback-dialog/feedback-dialog.component';
import { ViewFeedbackDialogComponent } from '../view-feedback-dialog/view-feedback-dialog.component';
import { BookingCancelledDialogComponent } from '../booking-cancelled-dialog/booking-cancelled-dialog.component';

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css'],
  standalone: false
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  currentTab: BookingStatus | 'ALL' = 'ALL';
  
  BookingStatus = BookingStatus; // Make enum available to template
  
  private subscription: Subscription = new Subscription();
  
  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.bookingService.getBookings().subscribe(bookings => {
        this.bookings = bookings;
        this.filterBookings();
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  changeTab(status: BookingStatus | 'ALL'): void {
    this.currentTab = status;
    this.filterBookings();
  }
  
  private filterBookings(): void {
    if (this.currentTab === 'ALL') {
      this.filteredBookings = this.bookings;
    } else {
      this.filteredBookings = this.bookings.filter(b => b.status === this.currentTab);
    }
  }
  
  isWithin12Hours(booking: Booking): boolean {
    return this.bookingService.isWithin12Hours(booking);
  }
  
  openCancelDialog(booking: Booking): void {
    const dialogRef = this.dialog.open(CancelBookingDialogComponent, {
      width: '400px',
      data: { booking }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bookingService.cancelBooking(booking.id);
        this.dialog.open(BookingCancelledDialogComponent, {
          width: '400px'
        });
      }
    });
  }
  
  openFeedbackDialog(booking: Booking): void {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '400px',
      data: { booking }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bookingService.submitFeedback(booking.id, result.rating, result.comment);
      }
    });
  }
  
  openViewFeedbackDialog(booking: Booking): void {
    if (booking.feedback) {
      this.dialog.open(ViewFeedbackDialogComponent, {
        width: '400px',
        data: { feedback: booking.feedback }
      });
    }
  }
}