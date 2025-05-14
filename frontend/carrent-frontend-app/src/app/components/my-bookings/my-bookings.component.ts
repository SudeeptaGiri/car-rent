// my-bookings.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { BookingService } from '../../services/booking.service';
import { Booking, BookingStatus } from '../../models/booking.model';
import { CancelBookingDialogComponent } from '../cancel-booking-dialog/cancel-booking-dialog.component';
import { FeedbackDialogComponent } from '../feedback-dialog/feedback-dialog.component';
import { ViewFeedbackDialogComponent } from '../view-feedback-dialog/view-feedback-dialog.component';
import { BookingCancelledDialogComponent } from '../booking-cancelled-dialog/booking-cancelled-dialog.component';
import { Router } from '@angular/router';
import { CarService } from '../../services/car.service';
import { FeedbackService } from '../../services/feedback.service';

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
  dropdownOpen = false;
  isLoading = true;
  
  BookingStatus = BookingStatus; // Make enum available to template
  
  private subscription: Subscription = new Subscription();
  
  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog,
    private router: Router,
    private feedbackService: FeedbackService,
  ) {}
  
  navigateToEditBooking(booking: Booking): void {
    this.router.navigate(['/edit-booking', booking.id]);
  }
  
  ngOnInit(): void {
    this.isLoading = true;
    // Refresh bookings to ensure we get the latest data
    this.bookingService.refreshBookings();
    
    this.subscription.add(
      this.bookingService.getBookings().subscribe({
        next: (bookings) => {
          console.log('Bookings received:', bookings);
          this.isLoading = false;
          this.bookings = [...bookings];
          console.log('All bookings:', this.bookings);
          this.filterBookings();
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.isLoading = false;
          this.bookings = [];
          this.filteredBookings = [];
        }
      })
    );
  }

  private filterBookings(): void {
    if (this.currentTab === 'ALL') {
      this.filteredBookings = this.bookings;
    } else {
      this.filteredBookings = this.bookings.filter(b => b.status === this.currentTab);
    }
    console.log('Filtered bookings:', this.filteredBookings);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  changeTab(status: BookingStatus | 'ALL'): void {
    this.currentTab = status;
    this.filterBookings();
  }
  
  isWithin12Hours(booking: Booking): boolean {
    return this.bookingService.isWithin12Hours(booking);
  }
  
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }
  
  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const dropdown = document.querySelector('.mobile-tabs-dropdown');
    if (dropdown && !dropdown.contains(event.target as Node) && this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }
  
  getTabDisplayName(tab: BookingStatus | 'ALL'): string {
    if (tab === 'ALL') return 'All bookings';
    return tab.replace('_', ' ');
  }
  
  openCancelDialog(booking: Booking): void {
    const dialogRef = this.dialog.open(CancelBookingDialogComponent, {
      width: '400px',
      position: { top: '40vh', right: '0px' },
      data: { booking }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bookingService.cancelBooking(booking.id).subscribe({
          next: () => {
            this.dialog.open(BookingCancelledDialogComponent, {
              width: '400px',
              position: { top: '40vh', right: '0px' },
            });
          },
          error: (error) => console.error('Error cancelling booking:', error)
        });
      }
    });
  }
  
openFeedbackDialog(booking: Booking): void {
    // Check if the booking is eligible for feedback
    if (booking.status !== BookingStatus.SERVICE_PROVIDED && 
        booking.status !== BookingStatus.COMPLETED) {
      // Show an error message
      
      return;
    }
    console.log('Opening feedback dialog for booking:', booking);
    // Show feedback dialog for eligible bookings
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '400px',
      position: { top: '40vh', right: '0px' },
      data: { booking }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Update the booking status to reflect feedback submission
        booking.status = BookingStatus.BOOKING_FINISHED;
        booking.feedback = {
          rating: result.rating,
          comment: result.comment,
          submittedAt: new Date()
        };
        
        // Refresh bookings to get the updated list
        this.bookingService.refreshBookings();
      }
    });
  }
  
  openViewFeedbackDialog(booking: Booking): void {
    if (booking.feedback) {
      this.dialog.open(ViewFeedbackDialogComponent, {
        width: '400px',
        position: { top: '40vh', right: '0px' },
        data: { feedback: booking.feedback }
      });
    }
  }
}