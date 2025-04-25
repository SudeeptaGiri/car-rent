import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FilterData } from '../models/filter.model';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private defaultFilters: FilterData = {
    pickupLocation: null,
    pickupCoordinates: null,
    dropoffLocation: null,
    dropoffCoordinates: null,
    pickupDate: 'October 29',
    dropoffDate: 'October 31',
    carCategory: 'Passenger car',
    gearbox: 'Automatic',
    engineType: '',
    priceMin: 50,
    priceMax: 2000
  };

  private filterSubject = new BehaviorSubject<any>(null);
  public filters$ = this.filterSubject.asObservable();

  constructor() { }

  filterCars(cars: any[], filters: any): any[] {
    return cars.filter(car => {
      // Price Filter
      const priceInRange = car.price >= filters.priceMin &&
        car.price <= filters.priceMax;

      // Category Filter
      const categoryMatch = !filters.carCategory ||
        car.category.toLowerCase() === filters.carCategory.toLowerCase();

      // Transmission/Gearbox Filter
      const transmissionMatch = !filters.gearbox ||
        car.specifications.transmission.toLowerCase() === filters.gearbox.toLowerCase();

      // Engine Type Filter
      const engineMatch = !filters.engineType ||
        car.specifications.engine.toLowerCase() === filters.engineType.toLowerCase();

      // Location Filter (if implemented)
      const locationMatch = !filters.pickupLocation ||
        car.location.includes(filters.pickupLocation);

      return priceInRange && categoryMatch && transmissionMatch &&
        engineMatch && locationMatch;
    });
  }

  updateFilters(filters: FilterData): void {
    this.filterSubject.next(filters);
  }

  resetFilters() {
    this.filterSubject.next(null);
  }
}