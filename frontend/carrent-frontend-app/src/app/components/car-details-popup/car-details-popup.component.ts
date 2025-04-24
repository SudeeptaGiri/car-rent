import { Component, HostListener, Inject } from '@angular/core';
import { CarService } from '../../services/car.service';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import {
  CarDetails,
  Review,
  BookedDate,
  SortOption,
  BookingRequest
} from '../../models/car.interface';
import moment from 'moment';

@Component({
  selector: 'app-car-details-popup',
  standalone: false,
  templateUrl: './car-details-popup.component.html',
  styleUrl: './car-details-popup.component.css',
})
export class CarDetailsPopupComponent {
  // Car Details
  carDetails: CarDetails | null = null;
  currentCarIndex = 0;
  totalCars = 0;

  // Reviews
  reviews: Review[] = [];
  currentReviewPage = 0;
  totalReviewPages = 0;

  // Date Range
  dateRange: { startDate: moment.Moment, endDate: moment.Moment } | null = null;
  minDate: Date = new Date();
  bookedDates: BookedDate[] = [];

  // Sorting
  isDropdownOpen = false;
  selectedSort = 'The newest';
  sortOptions: SortOption[] = [
    { label: 'The newest', value: 'newest' },
    { label: 'The latest', value: 'latest' },
    { label: 'Rating: low to high', value: 'low to high' },
    { label: 'Rating: high to low', value: 'high to low' }
  ];

  // State
  isLoading = false;
  error: string | null = null;

  isLoggedIn = false; // This should come from your auth service
  showLoginNotification = false;

  constructor(
    private carService: CarService,
    private dialogRef: MatDialogRef<CarDetailsPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { carId: string },
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.data.carId) {
      this.loadCarDetailsWithNavigation(this.data.carId);
    }
    this.isLoggedIn = this.authService.isAuthenticated(); 
  }

  private loadCarDetailsWithNavigation(carId: string): void {
    this.isLoading = true;
    this.carService.getCarDetailsWithNavigation(carId).subscribe({
      next: (response) => {
        if (response.car) {
          this.carDetails = response.car;
          this.currentCarIndex = response.currentIndex;
          this.totalCars = response.totalCars;
          this.reviews = response.car.reviews.content;
          this.bookedDates = response.car.bookedDates;
          this.applySorting(this.selectedSort);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load car details';
        this.isLoading = false;
        console.error('Error loading car details:', error);
      }
    });
  }

  onCarPageChange(pageIndex: number): void {
    if (pageIndex === this.currentCarIndex) return;

    this.isLoading = true;
    if (pageIndex > this.currentCarIndex) {
      this.carService.getNextCar(this.carDetails!.id).subscribe({
        next: (car) => {
          if (car) {
            this.carDetails = car;
            this.currentCarIndex = pageIndex;
            this.reviews = car.reviews.content;
            this.bookedDates = car.bookedDates;
            this.applySorting(this.selectedSort);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load next car';
          this.isLoading = false;
        }
      });
    } else {
      this.carService.getPreviousCar(this.carDetails!.id).subscribe({
        next: (car) => {
          if (car) {
            this.carDetails = car;
            this.currentCarIndex = pageIndex;
            this.reviews = car.reviews.content;
            this.bookedDates = car.bookedDates;
            this.applySorting(this.selectedSort);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load previous car';
          this.isLoading = false;
        }
      });
    }
  }


  isDateBooked(date: Date): boolean {
    return this.bookedDates.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return date >= bookingStart && date <= bookingEnd;
    });
  }

  // Sorting Methods
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectSort(value: string): void {
    this.selectedSort = value;
    this.isDropdownOpen = false;
    this.applySorting(value);
  }

  private applySorting(sortValue: string): void {
    if (!this.reviews) return;

    switch (sortValue) {
      case 'newest':
        this.reviews.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
      case 'latest':
        this.reviews.sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case 'low to high':
        this.reviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'high to low':
        this.reviews.sort((a, b) => b.rating - a.rating);
        break;
    }
  }

  // UI Helper Methods
  getFilledStars(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  selectImage(image: { id: string; url: string }): void {
    if (!this.carDetails) return;
    this.carDetails.images.forEach(img => img.isPrimary = img.id === image.id);
  }

  getPrimaryImageUrl(): string {
    return this.carDetails?.images.find(img => img.isPrimary)?.url || '';
  }

  // Actions
  bookCar(): void {
    if (!this.dateRange || !this.carDetails) return;

    if (!this.isLoggedIn) {
      this.showLoginNotification = true;
      return;
    }

    // Create booking request with dates and times
    const bookingRequest: BookingRequest = {
      carId: this.carDetails.id,
      startDate: this.dateRange.startDate.format('YYYY-MM-DD'),
      startTime: this.dateRange.startDate.format('HH:mm'),
      endDate: this.dateRange.endDate.format('YYYY-MM-DD'),
      endTime: this.dateRange.endDate.format('HH:mm'),
      userId: 'current-user-id', // Replace with actual user ID
      totalPrice: this.calculateTotalPrice(this.dateRange, this.carDetails.price)
    };

    // Close dialog with booking data
    this.dialogRef.close({
      action: 'book',
      data: bookingRequest
    });
  }

  private calculateTotalPrice(dateRange: { startDate: moment.Moment, endDate: moment.Moment }, pricePerDay: number): number {
    const days = dateRange.endDate.diff(dateRange.startDate, 'days') + 1;
    return days * pricePerDay;
  }


  handleLogin(): void {
    if (this.dateRange && this.carDetails) {
      localStorage.setItem('bookingIntent', JSON.stringify({
        carId: this.carDetails.id,
        startDate: this.dateRange.startDate.format('YYYY-MM-DD'),
        startTime: this.dateRange.startDate.format('HH:mm'),
        endDate: this.dateRange.endDate.format('YYYY-MM-DD'),
        endTime: this.dateRange.endDate.format('HH:mm'),
        price: this.carDetails.price
      }));
    }
    this.dialogRef.close('login');
  }

  hideLoginNotification(): void {
    this.showLoginNotification = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  // Click Outside Handler
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const dropdown = (event.target as HTMLElement).closest('.relative');
    if (!dropdown) {
      this.isDropdownOpen = false;
    }
  }

  get formattedBookedRanges(): { startDate: string; endDate: string; }[] {
    return this.bookedDates.map(date => ({
      startDate: date.startDate,
      endDate: date.endDate
    }));
  }
  onDateRangeSelected(event: { startDate: moment.Moment, endDate: moment.Moment }): void {
    // Just update the date range without checking login
    this.dateRange = event;
  }
}
