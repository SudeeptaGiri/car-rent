// car.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CarDetails,
  CarListResponse,
  CarsResponse,
  BookedDate,
  ReviewsData,
  BookingRequest
} from '../models/car.interface';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private jsonUrl = 'assets/cars.json';

  constructor(private http: HttpClient) {}


  getCarDetailsWithNavigation(carId: string): Observable<{
    car: CarDetails | undefined,
    totalCars: number,
    currentIndex: number
  }> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        const currentIndex = allCars.findIndex(car => car.id === carId);
        const car = allCars[currentIndex];
        
        return {
          car,
          totalCars: allCars.length,
          currentIndex
        };
      })
    );
  }

  getNextCar(currentId: string): Observable<CarDetails | undefined> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        const currentIndex = allCars.findIndex(car => car.id === currentId);
        return allCars[currentIndex + 1];
      })
    );
  }

  getPreviousCar(currentId: string): Observable<CarDetails | undefined> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        const currentIndex = allCars.findIndex(car => car.id === currentId);
        return allCars[currentIndex - 1];
      })
    );
  }

  getCarBookedDates(carId: string): Observable<BookedDate[]> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const car = response.cars.find(c => c.id === carId);
        return car ? car.bookedDates : [];
      })
    );
  }

  getCarReviews(carId: string): Observable<ReviewsData> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const car = response.cars.find(c => c.id === carId);
        return car ? car.reviews : { content: [], totalPages: 0, currentPage: 0, totalElements: 0 };
      })
    );
  }

  createBooking(bookingRequest: BookingRequest): Observable<any> {
    // In a real application, this would be an HTTP POST request
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const car = response.cars.find(c => c.id === bookingRequest.carId);
        if (car) {
          // Add new booking to car's bookedDates
          car.bookedDates.push({
            startDate: bookingRequest.startDate,
            startTime: bookingRequest.startTime,
            endDate: bookingRequest.endDate,
            endTime: bookingRequest.endTime,
            bookingId: `booking${Date.now()}`,
            userId: bookingRequest.userId,
            status: 'pending'
          });
        }
        return bookingRequest;
      })
    );
  }
}