import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BookingParams, CarDetails, UserInfo, LocationInfo } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class CarBookingService {
  // private apiUrl = 'https://api.example.com/bookings'; // Replace with your actual API URL

  constructor(private http: HttpClient) {}

  // Mock data for development
  getMockCarDetails(): CarDetails {
    return {
      name: 'Audi A6 Quattro 2023',
      model: 'Audi A6 Quattro 2023',
      location: 'Ukraine, Kyiv',
      image: 'audi-a6.png',
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