import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Booking, BookingStatus, Feedback } from '../models/booking.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookings: Booking[] = [];
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  private readonly STORAGE_KEY = 'bookings';

  constructor(private http: HttpClient) {
    // Initialize with sample data
    this.loadSampleBookings();
    this.loadBookingsFromStorage();
    
    // Check booking statuses every second to update status automatically
    interval(1000).subscribe(() => this.updateBookingStatuses());
  }

  // Add method to get current user id
  private getCurrentUserId(): string {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return currentUser.id || '';
  }

  // Modify getBookings to filter by current user
  getBookings(): Observable<Booking[]> {
    const currentUserId = this.getCurrentUserId();
    return this.bookingsSubject.pipe(
      map(bookings => bookings.filter(booking => booking.reservedBy === currentUserId))
    );
  }

  addBooking(booking: Booking): Observable<any> {
    const currentUserId = this.getCurrentUserId();
    const bookingWithUser = {
      ...booking,
      reservedBy: currentUserId
    };
    
    this.bookings.push(bookingWithUser);
    this.saveBookingsToStorage();
    this.bookingsSubject.next([...this.bookings]);
    
    return of({ success: true, booking: bookingWithUser });
  }

  cancelBooking(bookingId: string): void {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].status = BookingStatus.CANCELLED;
      // Save to localStorage after updating status
      this.saveBookingsToStorage();
      // Emit updated bookings
      this.bookingsSubject.next([...this.bookings]);
    }
  }

  private loadBookingsFromStorage(): void {
    const storedBookings = localStorage.getItem(this.STORAGE_KEY);
    if (storedBookings) {
      const allBookings = JSON.parse(storedBookings);
      this.bookings = allBookings.map((booking: Booking) => ({
        ...booking,
        pickupDate: new Date(booking.pickupDate),
        dropoffDate: new Date(booking.dropoffDate),
        feedback: booking.feedback ? {
          ...booking.feedback,
          submittedAt: new Date(booking.feedback.submittedAt)
        } : undefined
      }));
      this.bookingsSubject.next([...this.bookings]);
    }
  }

  private saveBookingsToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.bookings));
  }

  private loadSampleBookings(): void {
    // Set specific fixed dates for the bookings
    // Assuming today is April 22, 2023 for example
    
    // Booking 1: Reserved for future date
    const pickup1 = new Date('2025-04-24T10:00:00');
    const dropoff1 = new Date('2025-04-28T16:00:00');
    
    // Booking 2: Reserved for further future date
    const pickup2 = new Date('2025-04-26T10:00:00');
    const dropoff2 = new Date('2025-05-01T16:00:00');
    
    // Booking 3: Service started (pickup date in past, dropoff in future)
    const pickup3 = new Date('2025-04-21T10:00:00');
    const dropoff3 = new Date('2025-04-25T16:00:00');
    
    // Booking 4: Cancelled booking
    const pickup4 = new Date('2025-04-15T10:00:00');
    const dropoff4 = new Date('2025-04-20T16:00:00');
    
    // Booking 5: Service provided (both dates in past)
    const pickup5 = new Date('2025-04-12T10:00:00');
    const dropoff5 = new Date('2025-04-17T16:00:00');
    
    // Booking 6: Booking finished with feedback
    const pickup6 = new Date('2025-04-07T10:00:00');
    const dropoff6 = new Date('2025-04-12T16:00:00');
    const feedbackDate = new Date('2025-04-13T12:00:00');

    // Sample data
    this.bookings = [
      {
        id: '4',
        carId: '104',
        carName: 'Nissan Z 2024',
        carImage: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80",
        orderNumber: '#2440',
        pickupDate: pickup4,
        dropoffDate: dropoff4,
        status: BookingStatus.CANCELLED,
        totalPrice:900,
        numberOfDays:5,
        pickupLocation: 'Hyderabad',
        dropoffLocation: 'Chennai'
      },
      {
        id: '5',
        carId: '105',
        carName: 'Mercedes-Benz A class 2019',
        carImage: 'assets/Car7.svg',
        orderNumber: '#2452',
        pickupDate: pickup5,
        dropoffDate: dropoff5,
        status: BookingStatus.SERVICE_PROVIDED,
        totalPrice:900,
        numberOfDays:5,
        pickupLocation: 'Hyderabad',
        dropoffLocation: 'Chennai'
      },
      {
        id: '6',
        carId: '106',
        carName: 'BMW 330i 2020',
        carImage: "https://images.unsplash.com/photo-1551830820-330a71b99659?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80",
        orderNumber: '#2437',
        pickupDate: pickup6,
        dropoffDate: dropoff6,
        status: BookingStatus.BOOKING_FINISHED,
        feedback: {
          rating: 5,
          comment: 'Great car, excellent service!',
          submittedAt: feedbackDate
        },
        totalPrice:900,
        numberOfDays:5,
        pickupLocation: 'Hyderabad',
        dropoffLocation: 'Chennai'
      }
    ];
    
    // Initialize the status based on current date
    this.updateBookingStatuses();
    
    // Emit the initial bookings
    this.bookingsSubject.next([...this.bookings]);
  }
  
  private updateBookingStatuses(): void {
    const now = new Date();
    let updated = false;
    
    this.bookings.forEach(booking => {
      // Skip cancelled bookings - they stay cancelled
      if (booking.status === BookingStatus.CANCELLED) {
        return;
      }
      
      // If booking is in the future, it should be RESERVED
      if (now < booking.pickupDate) {
        if (booking.status !== BookingStatus.RESERVED) {
          booking.status = BookingStatus.RESERVED;
          updated = true;
        }
      }
      // If pickup date has passed but not dropoff, it's SERVICE_STARTED
      else if (now >= booking.pickupDate && now < booking.dropoffDate) {
        if (booking.status !== BookingStatus.SERVICE_STARTED) {
          booking.status = BookingStatus.SERVICE_STARTED;
          updated = true;
        }
      }
      // If dropoff date has passed, it's SERVICE_PROVIDED
      else if (now >= booking.dropoffDate) {
        // Only change to SERVICE_PROVIDED if not already in a later state
        if (booking.status !== BookingStatus.SERVICE_PROVIDED && 
            booking.status !== BookingStatus.BOOKING_FINISHED) {
          booking.status = BookingStatus.SERVICE_PROVIDED;
          updated = true;
        }
      }
      
      // If feedback is provided, move to booking finished
      if (booking.status === BookingStatus.SERVICE_PROVIDED && booking.feedback) {
        booking.status = BookingStatus.BOOKING_FINISHED;
        updated = true;
      }
    });
    
    if (updated) {
      this.bookingsSubject.next([...this.bookings]);
    }
  }
  
  
  getBookingsByStatus(status: BookingStatus | 'ALL'): Observable<Booking[]> {
    return this.getBookings().pipe(
      map(bookings => status === 'ALL' ? bookings : bookings.filter(b => b.status === status))
    );
  }
  
  
  submitFeedback(bookingId: string, rating: number, comment: string): void {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].feedback = {
        rating,
        comment,
        submittedAt: new Date()
      };
      this.bookings[bookingIndex].status = BookingStatus.BOOKING_FINISHED;
      this.bookingsSubject.next([...this.bookings]);
    }
  }
  
  isWithin12Hours(booking: Booking): boolean {
    const now = new Date();
    const hoursRemaining = (booking.pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining <= 12 && hoursRemaining > 0;
  }
  // Add this method to the BookingService class
  updateBookingDates(bookingId: string, pickupDate: Date, dropoffDate: Date): Observable<any> {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      // Calculate new number of days and total price
      const diffTime = Math.abs(dropoffDate.getTime() - pickupDate.getTime());
      const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const pricePerDay = this.bookings[bookingIndex].totalPrice / this.bookings[bookingIndex].numberOfDays;
      
      // Update the booking
      this.bookings[bookingIndex] = {
        ...this.bookings[bookingIndex],
        pickupDate: pickupDate,
        dropoffDate: dropoffDate,
        numberOfDays: numberOfDays,
        totalPrice: numberOfDays * pricePerDay
      };
      
      // Save to localStorage
      this.saveBookingsToStorage();
      
      // Emit updated bookings
      this.bookingsSubject.next([...this.bookings]);
      
      // Return an observable that completes immediately
      return of({ success: true });
    }
    
    // Return an error observable if booking not found
    return throwError(() => new Error('Booking not found'));
  }
}