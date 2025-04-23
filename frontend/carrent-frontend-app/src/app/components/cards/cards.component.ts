import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarDetailsPopupComponent } from '../car-details-popup/car-details-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { CarDetails } from '../../models/car.interface';

// export enum CarStatus {
//   AVAILABLE = 'Available',
//   RESERVED = 'Reserved',
//   UNAVAILABLE = 'Unavailable'
// }

export enum CarCategory {
  PASSENGER = 'Passenger car',
  SPORTS = 'Sports car',
  CRUISE = 'Cruise car',
  LUXURY = 'Luxury car',
  OFFROAD = 'Off-road car'
}


@Component({
  selector: 'app-cards',
  standalone: false,
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  cars: CarDetails[] = [];
  popularCars: CarDetails[] = [];
  loading = true;
  error: string | null = null;
  viewAllMode = false;
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 16; // Show 16 cars per page
  totalPages = 1;
  displayedCars: CarDetails[] = [];

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchCars();
  }

  fetchCars(): void {
    this.http.get<{ cars: CarDetails[] }>('assets/cars.json').subscribe({
      next: (data) => {
        console.log('Cars data loaded successfully:',data );
        this.cars = data.cars;
        console.log(this.cars[0]);
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
        "id": "1",
        "brand": "Nissan",
        "model": "Z",
        "year": 2024,
        "location": "Hyderabad, India",
        "rating": 4.8,
        "price": 550,
        "category": "Sports car",
        "status": "Not Available",
        "images": [
          {
            "id": "1",
            "url": "assets/Car1.svg",
            "isPrimary": true
          },
          {
            "id": "2",
            "url": "assets/Car2.svg",
            "isPrimary": false
          },
          {
            "id": "3",
            "url": "assets/Car3.svg",
            "isPrimary": false
          },
          {
            "id": "4",
            "url": "assets/Car4.svg",
            "isPrimary": false
          },
          {
            "id": "5",
            "url": "assets/Car5.svg",
            "isPrimary": false
          },
          {
            "id": "6",
            "url": "assets/Car6.svg",
            "isPrimary": false
          }
        ],
        "specifications": {
          "transmission": "Automatic",
          "engine": "Gasoline",
          "fuelType": "GASOLINE",
          "seats": 2,
          "fuelConsumption": "10.5 L/100km",
          "features": ["Sports Mode", "GPS"]
        },
        "bookedDates": [
          {
            "startDate": "2025-04-21",
            "startTime": "10:00",
            "endDate": "2025-04-24",
            "endTime": "16:00",
            "bookingId": "booking123",
            "userId": "user456",
            "status": "confirmed" 
          },
          {
            "startDate": "2024-02-20",
            "startTime": "09:00",
            "endDate": "2024-02-25",
            "endTime": "14:00",
            "bookingId": "booking124",
            "userId": "user789",
            "status": "confirmed"
          }
        ],
        "reviews": {
          "content": [
            {
              "id": "1",
              "userName": "John Doe",
              "rating": 4.8,
              "comment": "Amazing sports car experience! The power and handling are exceptional.",
              "date": "2024-01-15",
              "userAvatar": "assets/User1.svg"
            },
            {
              "id": "2",
              "userName": "Sarah Smith",
              "rating": 1.9,
              "comment": "Perfect weekend car. Smooth ride and great features.",
              "date": "2024-01-10",
              "userAvatar": "assets/User2.svg"
            }
          ],
          "totalPages": 1,
          "currentPage": 0,
          "totalElements": 2
        },
        "popularity": {
          "rentCount": 150,
          "viewCount": 1200,
          "favoriteCount": 89,
          "isPopular": true
        }
      }
    ];
    this.popularCars = [...this.cars];
    this.displayedCars = this.popularCars;
    this.error = null;
  }

  bookCar(car: CarDetails): void {
    // Empty function as requested
    console.log('Book car clicked:', car);
  }

  openCarDetailsPopup(carId: string): void {
      const dialogRef = this.dialog.open(CarDetailsPopupComponent, {
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px', 
        maxHeight: '800px',
        position: { top: '50px' },
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