import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarDetailsPopupComponent } from '../car-details-popup/car-details-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { CarDetails } from '../../models/car.interface';
import { FilterService } from '../../services/filter.service';
import { FilterData } from '../../models/filter.model';
import { Subscription ,of  } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  // Add this property to keep track of the slider state
  private isDragging = false;

  // Filter properties to CardsComponent class
  filterSubscription: Subscription = new Subscription();
  activeFilters: FilterData | null = null;
  allCars: CarDetails[] = []; // Store all cars
  filteredCars: CarDetails[] = []; // Store filtered cars
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 16; // Show 16 cars per page
  totalPages = 1;
  displayedCars: CarDetails[] = [];

  Math = Math;

  constructor(
    private http: HttpClient, 
    private dialog: MatDialog,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    // Set viewAllMode to false initially to show popular cars
    this.viewAllMode = false;
    
    // Subscribe to filter changes
    this.filterSubscription = this.filterService.filters$.subscribe(filters => {
      this.activeFilters = filters;
      this.applyFilters();
    });
    
    // Fetch cars data
    this.fetchCars();
    // this.filterService.filters$.subscribe(filters => {
    //   if (filters) {
    //     this.filteredCars = this.filterService.filterCars(this.cars, filters);
    //   } else {
    //     this.filteredCars = this.cars;
    //   }
    // });
  }

  ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }
  clearFilters(): void {
    this.filterService.resetFilters();
  }


  fetchCars(): void {
    console.log('Fetching cars data...');
    // Note: Use both possible paths to handle different deployment configurations
    this.http.get<{ cars: CarDetails[] }>('assets/cars.json').pipe(
      catchError(err => {
        console.log('Trying alternative path...');
        // Try alternative path if first fails
        return this.http.get<{ cars: CarDetails[] }>('/assets/cars.json').pipe(
          catchError(err2 => {
            console.error('All paths failed:', err2);
            return of({ cars: [] });
          })
        );
      })
    ).subscribe({
      next: (data) => {
        console.log('Cars data loaded successfully:', data);
        if (data && data.cars && data.cars.length > 0) {
          this.allCars = data.cars;
          this.filteredCars = [...this.allCars]; // Initialize filtered cars with all cars
          this.cars = this.filteredCars;
          
          // Set default display
          if (!this.viewAllMode) {
            // Show top rated cars initially
            this.popularCars = [...this.allCars]
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 4);
            this.displayedCars = this.popularCars;
          } else {
            // Or show paginated results
            this.totalPages = Math.ceil(this.cars.length / this.itemsPerPage);
            this.updateDisplayedCars();
          }
          
          this.loading = false;
        } else {
          console.error('No cars data found');
          this.provideFallbackData();
        }
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

  // Update the applyFilters method with better debugging and error handling
  applyFilters(): void {
    if (!this.allCars || !this.allCars.length) {
      console.warn('No cars data to filter');
      return;
    }
    
    console.log('Applying filters:', this.activeFilters);
    
    // Start with all cars
    let filtered = [...this.allCars];
    const initialCount = filtered.length;
    
    // If we have active filters, apply them
    if (this.activeFilters) {
      // Filter by price range with safety checks
      if (this.activeFilters.priceMin !== undefined && this.activeFilters.priceMax !== undefined) {
        console.log(`Filtering by price range: $${this.activeFilters.priceMin} - $${this.activeFilters.priceMax}`);
        
        filtered = filtered.filter(car => {
          if (car.price === undefined || car.price === null) return false;
          
          const inPriceRange = car.price >= this.activeFilters!.priceMin && 
                              car.price <= this.activeFilters!.priceMax;
          
          if (!inPriceRange) {
            console.log(`Car excluded by price: ${car.brand} ${car.model} - $${car.price}`);
          }
          
          return inPriceRange;
        });
        
        console.log(`After price filter: ${filtered.length} cars remaining`);
      }
      
      // Filter by car category regardless of how many cars remain
      if (this.activeFilters.carCategory && this.activeFilters.carCategory !== '') {
        console.log(`Filtering by category: ${this.activeFilters.carCategory}`);
        
        filtered = filtered.filter(car => 
          car.category === this.activeFilters!.carCategory
        );
        
        console.log(`After category filter: ${filtered.length} cars remaining`);
      }
      
      // Filter by gearbox/transmission
      if (this.activeFilters.gearbox && this.activeFilters.gearbox !== '') {
        console.log(`Filtering by transmission: ${this.activeFilters.gearbox}`);
        
        filtered = filtered.filter(car => 
          car.specifications && car.specifications.transmission === this.activeFilters!.gearbox
        );
        
        console.log(`After transmission filter: ${filtered.length} cars remaining`);
      }
      
      // Filter by engine type
      if (this.activeFilters.engineType && this.activeFilters.engineType !== '') {
        console.log(`Filtering by engine: ${this.activeFilters.engineType}`);
        
        filtered = filtered.filter(car => 
          car.specifications && car.specifications.engine === this.activeFilters!.engineType
        );
        
        console.log(`After engine filter: ${filtered.length} cars remaining`);
      }
    }
    
    console.log(`Final filter result: ${initialCount} cars → ${filtered.length} cars`);
    
    // Update filtered cars
    this.filteredCars = filtered;
    this.cars = this.filteredCars;
    
    // Update pagination
    this.totalPages = Math.ceil(this.cars.length / this.itemsPerPage);
    this.currentPage = 1;

    console.log(`Filter applied: ${filtered.length} cars, ${this.totalPages} pages`);
    
    // Update displayed cars based on view mode
    if (this.viewAllMode) {
      this.updateDisplayedCars();
    } else {
      // In popular view mode
      if (this.filteredCars.length >= 4) {
        // Show top rated filtered cars
        this.displayedCars = this.filteredCars
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 4);
      } else {
        // Not enough filtered cars, show all filtered cars
        this.displayedCars = this.filteredCars;
      }
    }
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
    
  }

  openCarDetailsPopup(carId: string): void {
      const dialogRef = this.dialog.open(CarDetailsPopupComponent, {
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px', 
        maxHeight: '800px',
        position: { top: '45px' },
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
        // Calculate total pages based on filtered cars count
        this.totalPages = Math.ceil(this.filteredCars.length / this.itemsPerPage);
        console.log(`View All mode: ${this.filteredCars.length} cars, ${this.totalPages} pages`);
        this.updateDisplayedCars();
      } else {
        // Switching back to "Popular Cars" mode
        if (this.filteredCars.length >= 4) {
          this.displayedCars = this.filteredCars
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 4);
        } else {
          this.displayedCars = this.filteredCars;
        }
      }
    }

    updateDisplayedCars(): void {
      if (!this.viewAllMode) {
        // In popular mode, show top rated cars
        if (this.filteredCars.length >= 4) {
          this.displayedCars = this.filteredCars
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 4);
        } else {
          this.displayedCars = this.filteredCars;
        }
        return;
      }
      
      // In view all mode, use pagination
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredCars.length);
      
      console.log(`Page ${this.currentPage}/${this.totalPages}: showing cars ${startIndex+1}-${endIndex} of ${this.filteredCars.length}`);
      
      // Important: Use filteredCars instead of cars for pagination
      this.displayedCars = this.filteredCars.slice(startIndex, endIndex);
    }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedCars();
      // Scroll to top of the component
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPaginationNumbers(): number[] {
    if (this.totalPages <= 7) {
      // If 7 or fewer pages, show all pages
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    } else {
      // For more pages, show first, last, and pages around current
      const pages: number[] = [];
      const current = this.currentPage;
      
      // Always show first page
      pages.push(1);
      
      if (current > 3) {
        // Add ellipsis after first if needed
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Calculate range around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(this.totalPages - 1, current + 1);
      
      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < this.totalPages - 2) {
        // Add ellipsis before last if needed
        pages.push(-2); // -2 represents ellipsis
      }
      
      // Always show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
      
      return pages;
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