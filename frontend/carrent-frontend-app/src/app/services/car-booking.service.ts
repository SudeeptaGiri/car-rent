import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Booking, BookingParams, CarDetails, UserInfo, LocationInfo } from '../models/booking.model';
import { BookingService } from './booking.service';

@Injectable({
  providedIn: 'root'
})
export class CarBookingService {
  // private apiUrl = 'https://api.example.com/bookings'; // Replace with your actual API URL
  private readonly STORAGE_KEY = 'bookings';
  private bookings: Booking[] = [];

  // ...existing code...

  
  constructor(
    private http: HttpClient,
    private bookingService: BookingService ) {
    this.loadBookings();
  }

  private loadBookings(): void {
    const storedBookings = localStorage.getItem(this.STORAGE_KEY);
    if (storedBookings) {
      this.bookings = JSON.parse(storedBookings);
    }
  }

  private saveBookings(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.bookings));
  }

  addBooking(booking: Booking): Observable<{success: boolean, booking: Booking}> {
    // Add the booking to the array
    this.bookings.push(booking);
    
    this.saveBookings();
    // In a real app, you would make an HTTP request here
    // For now, we'll simulate a successful response
    return this.bookingService.addBooking(booking);
  }

  getBookings(): Booking[] {
    return this.bookings;
  }

  // Add method to get bookings as Observable
  getBookingsObservable(): Observable<Booking[]> {
    return of(this.bookings);
  }

  // Mock data for development
  getMockCarDetails(): CarDetails {
    return {
      name: 'Audi A6 Quattro 2023',
      model: 'Audi A6 Quattro 2023',
      location: 'Ukraine, Kyiv',
      image: 'assets/audi-a6.png',
      pricePerDay: 180
    };
  }

  getMockUserInfo(): UserInfo {
    return {
      fullName: 'Anastasiya Dobrota',
      email: 'dobrota@gmail.com',
      phone: '+38 111 111 11 11'
    };
  }

  getMockLocationInfo(): LocationInfo {
    return {
      pickupLocation: 'Kyiv Hayatt Hotel',
      dropoffLocation: 'Kyiv Hayatt Hotel'
    };
  }

  // Actual API call would look like this
  bookCar(params: BookingParams): Observable<any> {
    // For development, return a mock response
    return of({ success: true, bookingId: '12345' });
    
    // In production, use this:
    // return this.http.post(this.apiUrl, params);
  }
}