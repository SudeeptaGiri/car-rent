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
import { CarDetails } from '../../models/car.interface';
import { CarService } from '../../services/car.service';

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
  
  BookingStatus = BookingStatus; // Make enum available to template
  
  private subscription: Subscription = new Subscription();
  
  constructor(
    private carService: CarService,
    private dialog: MatDialog,
    private bookingService: BookingService, 
    private router: Router // Add this
  ) {
  }
  navigateToEditBooking(booking: Booking): void {
    this.router.navigate(['/edit-booking', booking.id]);
  }
  
  // In MyBookingsComponent
ngOnInit(): void {
  this.subscription.add(
      this.carService.bookings$.subscribe({
        next: (bookings) => {
          console.log('Raw bookings received:', bookings);
          if (bookings && bookings.length > 0) {
              this.bookings = [...bookings];
              console.log('Bookings array after assignment:', this.bookings);
              this.filteredBookings = [...bookings];
              console.log('FilteredBookings after assignment:', this.filteredBookings);
              this.filterBookings();
          } else {
              this.bookings = [];
              this.filteredBookings = [];
          }
      },
      error: (error) => {
          console.error('Error loading bookings:', error);
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
    console.log('Filtered bookings after filter:', this.filteredBookings);
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  changeTab(status: BookingStatus | 'ALL'): void {
    this.currentTab = status;
    this.filterBookings();
  }
  
  isWithin12Hours(booking: Booking): boolean {
    const now = new Date();
        const hoursRemaining = (booking.pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursRemaining <= 12 && hoursRemaining > 0;
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
    return tab;
  }
  
  openCancelDialog(booking: Booking): void {
    const dialogRef = this.dialog.open(CancelBookingDialogComponent, {
        width: '400px',
        position: { top: '40vh', right: '0px' },
        data: { booking }
    });
    
    dialogRef.afterClosed().subscribe(result => {
        if (result) {
            // Changed from bookingService to carService
            this.carService.cancelBooking(booking.id);
            this.dialog.open(BookingCancelledDialogComponent, {
                width: '400px',
                position: { top: '40vh', right: '0px' },
            });
        }
    });
}
  
  openFeedbackDialog(booking: Booking): void {
    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      width: '400px',
      position: { top: '40vh', right: '0px' },
      data: { booking }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.carService.submitFeedback(booking.id, result.rating, result.comment);
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