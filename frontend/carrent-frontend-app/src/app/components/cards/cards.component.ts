import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarDetailsPopupComponent } from '../car-details-popup/car-details-popup.component';
import { MatDialog } from '@angular/material/dialog';

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
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 16; // Show 16 cars per page
  totalPages = 1;
  displayedCars: Car[] = [];

  constructor(private http: HttpClient, private dialog: MatDialog) {}

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
        
        // Calculate total pages
        this.totalPages = Math.ceil(this.cars.length / this.itemsPerPage);
        
        // Set initial displayed cars - show popular cars by default
        this.displayedCars = this.popularCars;
        
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
    this.displayedCars = this.popularCars;
    this.error = null;
  }

  bookCar(car: Car): void {
    // Empty function as requested
    console.log('Book car clicked:', car);
  }

  // seeMore(car: Car): void {
  //   // Empty function as requested
  //   console.log('See more details clicked:', car);
  // }
  openCarDetailsPopup(carId: string): void {
      const dialogRef = this.dialog.open(CarDetailsPopupComponent, {
        maxWidth: '90vw',
        maxHeight: '90vh',
        panelClass: 'custom-dialog-container',
        data: { carId },
        autoFocus: false,
        hasBackdrop: true
      });
    }

  toggleViewMode(): void {
    this.viewAllMode = !this.viewAllMode;
    
    if (this.viewAllMode) {
      // Switching to "View All" mode
      this.currentPage = 1;
      this.updateDisplayedCars();
    } else {
      // Switching back to "Popular Cars" mode
      this.displayedCars = this.popularCars;
    }
  }

  updateDisplayedCars(): void {
    if (!this.viewAllMode) {
      this.displayedCars = this.popularCars;
      return;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.cars.length);
    this.displayedCars = this.cars.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedCars();
      // Scroll to top of the component
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  formatPrice(price: number): string {
    return `$${price}`;
  }
}