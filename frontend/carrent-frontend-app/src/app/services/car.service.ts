// car.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CarDetails,
  CarListResponse,
  CarsResponse,
  CarFilters,
  BookedDate,
  ReviewsData
} from '../models/car.interface';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private jsonUrl = 'assets/cars.json';

  constructor(private http: HttpClient) {}

  getAllCars(page: number = 0): Observable<CarListResponse> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        return {
          content: allCars, // Return all cars for the list view
          totalPages: 1,
          currentPage: 0,
          totalElements: allCars.length
        };
      })
    );
  }

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
  getCarDetails(carId: string): Observable<CarDetails | undefined> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => response.cars.find(car => car.id === carId))
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

  getPopularCars(): Observable<CarDetails[]> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => response.cars.filter(car => car.popularity.isPopular))
    );
  }

  private filterCars(cars: CarDetails[], filters: CarFilters): CarDetails[] {
    return cars.filter(car => {
      let matches = true;
      
      if (filters.location) {
        matches = matches && car.location.toLowerCase().includes(filters.location.toLowerCase());
      }
      if (filters.category) {
        matches = matches && car.category === filters.category;
      }
      if (filters.transmission) {
        matches = matches && car.specifications.transmission === filters.transmission;
      }
      if (filters.fuelType) {
        matches = matches && car.specifications.fuelType === filters.fuelType;
      }
      if (filters.minPrice) {
        matches = matches && car.price >= filters.minPrice;
      }
      if (filters.maxPrice) {
        matches = matches && car.price <= filters.maxPrice;
      }

      return matches;
    });
  }
}