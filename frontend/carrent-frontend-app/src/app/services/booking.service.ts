import { Booking } from './../models/booking.model';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { BookingStatus, Feedback } from '../models/booking.model';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookings: Booking[] = [];
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  // private apiUrl = "https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api/bookings";
  private apiUrl = 'http://localhost:3000/api/bookings'; // Local development URL

  constructor(private http: HttpClient, private authService:AuthService) {
    this.loadBookingsForCurrentUser();
    // Check booking statuses periodically
    interval(60000).subscribe(() => this.updateBookingStatuses());
  }

  private getCurrentUserId(): string | null {
    try {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      return currentUser.id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Load bookings for current user
  loadBookingsForCurrentUser(): any {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.log('No user ID found, not loading bookings');
      this.bookingsSubject.next([]);
      return of([]);
    }
     const authToken = this.authService.getToken();
        
        
          const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          })
    return this.http.get<{content:any[]}>(this.apiUrl+"/"+userId,{headers})
      .pipe(
        tap(response => console.log('API response:', response.content )),
        map(response => response.content.map(apiBooking => this.transformApiBooking(apiBooking))),
        tap(response => console.log('API response:', response )),

      )
      // .subscribe(bookings => {
      //   this.bookings = bookings;
      //   this.updateBookingStatuses();
      //   this.bookingsSubject.next([...this.bookings]);
      //   console.log('Loaded user bookings:', this.bookings);
      // });
  }

  // Transform API booking to our Booking model
  private transformApiBooking(apiBooking: any): Booking {
    // Convert dates from strings to Date objects
    const pickupDate = new Date(apiBooking.pickupDateTime);
    const dropoffDate = new Date(apiBooking.dropOffDateTime);
    
    // Calculate number of days
    const diffTime = Math.abs(dropoffDate.getTime() - pickupDate.getTime());
    const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    // Map API status to our BookingStatus enum
    let status: BookingStatus;
    switch(apiBooking.status) {
      case 'RESERVED':
        status = BookingStatus.RESERVED;
        break;
      case 'CANCELLED':
        status = BookingStatus.CANCELLED;
        break;
      case 'SERVICE_STARTED':
        status = BookingStatus.SERVICE_STARTED;
        break;
      case 'SERVICE_PROVIDED':
        status = BookingStatus.SERVICE_PROVIDED;
        break;
      case 'BOOKING_FINISHED':
        status = BookingStatus.BOOKING_FINISHED;
        break;
      case 'COMPLETED':
        status = BookingStatus.BOOKING_FINISHED;
        break;
      default:
        status = BookingStatus.RESERVED;
    }
    console.log('API BOOKINGS:', apiBooking);
    return {
    id: apiBooking.bookingId,
    carId: apiBooking.carId,
    orderNumber: apiBooking.orderDetails,
    // Adapt these fields to match your Booking model structure
    carName: apiBooking.carModel,
    carImage: apiBooking.carImageUrl,
    // licensePlate: apiBooking.carNumber,
    pickupDate: apiBooking.pickupDateTime,
    dropoffDate: apiBooking.dropOffDateTime,
    pickupLocation: apiBooking.pickupLocation || 'Default Location',
    dropoffLocation: apiBooking.dropOffLocation || 'Default Location',
    numberOfDays: numberOfDays,
    totalPrice: apiBooking.totalPrice,
    status: status,
    feedback: apiBooking.feedback ? {
      rating: apiBooking.feedback.rating,
      comment: apiBooking.feedback.comment,
      submittedAt: new Date(apiBooking.feedback.submittedAt)
    } : undefined,
    // createdAt: new Date(apiBooking.createdAt)
  };
}
  
  // Get bookings for current user
  getBookings(): Observable<Booking[]> {
    return this.bookingsSubject.asObservable();
  }

  // Refresh bookings from API
  refreshBookings(): void {
    this.loadBookingsForCurrentUser();
  }

  // Add new booking
  addBooking(booking: Booking): Observable<Booking> {
    // Implementation would depend on your API
    return of(booking); // Placeholder
  }

  // Cancel booking
  cancelBooking(bookingId: string): Observable<any> {
    // Implementation would depend on your API
    const bookingIndex = this.bookings.findIndex(b => b.id=== bookingId);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].status = BookingStatus.CANCELLED;
      this.bookingsSubject.next([...this.bookings]);
      return of({ success: true });
    }
    return throwError(() => new Error('Booking not found'));
  }
  

  // Clear all bookings when logging out
  clearUserBookings(): void {
    this.bookings = [];
    this.bookingsSubject.next([]);
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
  
  submitFeedback(bookingId: string, rating: number, comment: string): Observable<any> {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].feedback = {
        rating,
        comment,
        submittedAt: new Date()
      };
      this.bookings[bookingIndex].status = BookingStatus.BOOKING_FINISHED;
      this.bookingsSubject.next([...this.bookings]);
      return of({ success: true });
    }
    return throwError(() => new Error('Booking not found'));
  }
  
  isWithin12Hours(booking: Booking): boolean {
    const now = new Date();
    const pickupDate = new Date(booking.pickupDate);
    const hoursRemaining = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursRemaining <= 12 && hoursRemaining > 0;
  }

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
      
      // Emit updated bookings
      this.bookingsSubject.next([...this.bookings]);
      
      return of({ success: true });
    }
    
    return throwError(() => new Error('Booking not found'));
  }
}