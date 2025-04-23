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
    engineType: 'Gasoline',
    priceMin: 50,
    priceMax: 2000
  };

  private filterSubject = new BehaviorSubject<FilterData>(this.defaultFilters);
  public filters$ = this.filterSubject.asObservable();

  constructor() { }

  updateFilters(filters: FilterData): void {
    this.filterSubject.next(filters);
  }

  resetFilters(): void {
    this.filterSubject.next(this.defaultFilters);
  }
}