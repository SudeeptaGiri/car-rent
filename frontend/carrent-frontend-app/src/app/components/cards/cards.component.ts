import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export enum CarStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  UNAVAILABLE = 'Unavailable'
}

export enum CarCategory {
  PASSENGER = 'Passenger car',
  SPORTS = 'Sports car',
  CRUISE = 'Cruise car',
  LUXURY = 'Luxury car',
  OFFROAD = 'Off-road car'
}

export interface Car {
  id: number;
  name: string;
  modelYear: number;
  location: string;
  status: CarStatus;
  engineType: string;
  gearboxType: string;
  category: CarCategory;
  pricePerDay: number;
  rating: number;
  bookedFrom: string;
  bookedTill: string;
  imageUrl: string;
}

@Component({
  selector: 'app-cards',
  standalone: false,
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  cars: Car[] = [];
  popularCars: Car[] = [];
  loading = true;
  error: string | null = null;
  viewAllMode = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchCars();
  }

  fetchCars(): void {
    this.http.get<Car[]>('assets/data/cars.json').subscribe({
      next: (data) => {
        this.cars = data;
        // Get top rated cars for popular section
        this.popularCars = [...this.cars]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cars:', err);
        this.error = 'Failed to load cars. Please try again later.';
        this.loading = false;
        
        // Fallback data in case of error
        this.provideFallbackData();
      }
    });
  }

  provideFallbackData(): void {
    // Fallback data in case the JSON file can't be loaded
    this.cars = [
      {
        id: 1,
        name: "Nissan Z",
        modelYear: 2024,
        location: "Hyderabad, India",
        status: CarStatus.AVAILABLE,
        engineType: "Gasoline",
        gearboxType: "Automatic",
        category: CarCategory.SPORTS,
        pricePerDay: 550,
        rating: 4.8,
        bookedFrom: "2023-10-20",
        bookedTill: "2023-10-25",
        imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80"
      },
      {
        id: 2,
        name: "Audi A6",
        modelYear: 2023,
        location: "Hyderabad, India",
        status: CarStatus.AVAILABLE,
        engineType: "Hybrid",
        gearboxType: "Automatic",
        category: CarCategory.LUXURY,
        pricePerDay: 180,
        rating: 4.7,
        bookedFrom: "2023-10-20",
        bookedTill: "2023-10-27",
        imageUrl: "https://images.unsplash.com/photo-1541348263662-e068662d82af?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80"
      }
    ];
    this.popularCars = [...this.cars];
    this.error = null;
  }

  bookCar(car: Car): void {
    // Empty function as requested
    console.log('Book car clicked:', car);
  }

  seeMore(car: Car): void {
    // Empty function as requested
    console.log('See more details clicked:', car);
  }

  viewAllCars(): void {
    this.viewAllMode = true;
  }

  formatPrice(price: number): string {
    return `$${price}`;
  }
}