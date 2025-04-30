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
  private readonly BASE_STORAGE_KEY = 'bookings';

  constructor(private http: HttpClient) {
    this.loadBookingsForCurrentUser();
    this.loadSampleBookings(); // Load sample bookings for testing
    // Check booking statuses every second
    interval(1000).subscribe(() => this.updateBookingStatuses());
  }

  private getStorageKeyForUser(): string {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    const userEmail = currentUser.email;
    return userEmail ? `${this.BASE_STORAGE_KEY}_${userEmail}` : this.BASE_STORAGE_KEY;
  }

  // Load bookings for current user
  private loadBookingsForCurrentUser(): void {
    const storageKey = this.getStorageKeyForUser();
    const storedBookings = localStorage.getItem(storageKey);
    console.log('Loading bookings with key:', storageKey);
    console.log('Stored bookings raw:', storedBookings);
    
    if (storedBookings) {
      try{
      this.bookings = JSON.parse(storedBookings).map((booking: Booking) => ({
        ...booking,
        pickupDate: new Date(booking.pickupDate),
        dropoffDate: new Date(booking.dropoffDate),
        feedback: booking.feedback ? {
          ...booking.feedback,
          submittedAt: new Date(booking.feedback.submittedAt)
        } : undefined
      }));
       // Update booking statuses and emit
       this.updateBookingStatuses();
       this.bookingsSubject.next([...this.bookings]);

      //  console.log('Loaded bookings:', this.bookings);
    } catch (error) {
      console.error('Error parsing stored bookings:', error);
      this.bookings = []; // Reset bookings if parsing fails
    }
    } else {
      this.bookings = [];
    }
    
    this.bookingsSubject.next([...this.bookings]);
  }

  // Save bookings for current user
  private saveBookingsToStorage(): void {
    const storageKey = this.getStorageKeyForUser();
    localStorage.setItem(storageKey, JSON.stringify(this.bookings));
  }

  // Get bookings for current user
  getBookings(): Observable<Booking[]> {
    return this.bookingsSubject.asObservable();
  }

  // Add new booking
  addBooking(booking: Booking): Observable<Booking> {
    return new Observable<Booking>(observer => {
      try {
        const bookingsStr = localStorage.getItem('bookings');
        const bookings: Booking[] = bookingsStr ? JSON.parse(bookingsStr) : [];
        bookings.push(booking);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        observer.next(booking);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  // // Cancel booking
  // cancelBooking(bookingId: string): void {
  //   const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
  //   if (bookingIndex !== -1) {
  //     this.bookings[bookingIndex].status = BookingStatus.CANCELLED;
  //     this.saveBookingsToStorage();
  //     this.bookingsSubject.next([...this.bookings]);
  //   }
  // }

  // Clear all bookings for current user when logging out
  clearUserBookings(): void {
    const storageKey = this.getStorageKeyForUser();
    localStorage.removeItem(storageKey);
    this.bookings = [];
    this.bookingsSubject.next([]);
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