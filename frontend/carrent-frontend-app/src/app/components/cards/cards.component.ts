import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarDetailsPopupComponent } from '../car-details-popup/car-details-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { CarDetails } from '../../models/car.interface';
import { FilterService } from '../../services/filter.service';
import { FilterData } from '../../models/filter.model';
import { Subscription, of } from 'rxjs';
import { CarService } from '../../services/car.service';
import {myCarService} from '../../services/my-cars.service'
import { catchError } from 'rxjs/operators';

// Define the extended properties that are used but not in the original interface
interface ExtendedCarDetails extends CarDetails {
  fuelType?: string;
  gearBoxType?: string;
  _id?: string;
  carId?: string;
}

// Define proper CarSpecifications interface to ensure all required fields exist
interface CarSpecifications {
  transmission: string;
  engine: string;
  fuelType: string;
  seats: number;
  fuelConsumption: string;
  features: string[];
}

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
export class CardsComponent implements OnInit, OnDestroy {
  cars: any[] = [];
  popularCars: any[] = [];
  loading = true;
  error: string | null = null;
  viewAllMode: boolean = false;

  // Add this property to keep track of the slider state
  private isDragging = false;

  // Filter properties to CardsComponent class
  filterSubscription: Subscription = new Subscription();
  activeFilters: FilterData | null = null;
  allCars: any[] = []; // Store all cars
  filteredCars: any[] = []; // Store filtered cars

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 8; // Show 8 cars per page
  totalPages = 1;
  displayedCars: any[] = [];

  Math = Math;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private filterService: FilterService,
    private carService: CarService,
    private myCarService: myCarService
  ) { }

  ngOnInit(): void {
    console.log('CardsComponent initialized');
    // Set viewAllMode to false initially to show popular cars
    this.viewAllMode = false;
    this.applyFilters();
    // Subscribe to filter changes
    this.filterSubscription = this.filterService.filters$.subscribe(filters => {
      console.log('Filter changes detected:', filters);
      this.activeFilters = filters;
        // Only apply filters if data is loaded
        if (this.allCars && this.allCars.length) {
            this.applyFilters();
        }
    });

    // Fetch cars data using CarService
    this.fetchCars();
    this.updateDisplayedCars();
    this.updatePaginationAndDisplay();

  }

  ngOnDestroy(): void {
    console.log('CardsComponent destroyed');
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  clearFilters(): void {
    console.log('Clearing filters');
    this.filterService.resetFilters();
  }

  // Utility function to convert raw car data to ExtendedCarDetails
  //DONE BY SOURABH
  private transformCarData(carData: any): ExtendedCarDetails {
  const id = carData.id || carData._id || carData.carId || '';
  const fuelType = carData.fuelType ? carData.fuelType.charAt(0) + carData.fuelType.slice(1).toLowerCase() : '';
  const transmission = carData.gearBoxType === 'AUTOMATIC' ? 'Automatic' : 'Manual';

  const images = Array.isArray(carData.images)
    ? carData.images.map((img: any, index: number) => ({
        id: index.toString(),
        url: typeof img === 'string' ? img : img.url,
        isPrimary: index === 0,
      }))
    : [{
        id: '0',
        url: 'https://t3.ftcdn.net/jpg/02/48/42/64/360_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg',
        isPrimary: true,
      }];

  return {
    ...carData,
    id,
    images,
    fuelType: carData.fuelType,
    gearBoxType: carData.gearBoxType,
    _id: carData._id,
    carId: carData.carId,
    rating: typeof carData.rating === 'string' ? parseFloat(carData.rating) : carData.rating || 0,
    price: typeof carData.price === 'string' ? parseFloat(carData.price) : carData.price || 0,
    specifications: {
      transmission,
      engine: `${carData.engineCapacity || ''} ${fuelType}`.trim(),
      fuelType,
      seats: parseInt(carData.passengerCapacity) || 5,
      fuelConsumption: carData.fuelConsumption || '',
      engineCapacity: carData.engineCapacity || '',
      climateControl: carData.climateControlOption?.replace(/_/g, ' ').toLowerCase() || '',
      features: carData.specifications?.features || [],
    },
    bookedDates: carData.bookedDates || [],
    reviews: carData.reviews || {
      content: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0
    },
    popularity: carData.popularity || {
      rentCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      isPopular: false
    }
  };
}


  fetchCars(): void {
    console.log('Fetching cars data from service...');
    this.loading = true;
    
    this.myCarService.getAllCars().subscribe({
      next: (response) => {
        console.log('Cars data loaded successfully:', response);
        if (response && response.content && response.content.length > 0) {
          // Process MongoDB car data - ensure all fields map correctly
          this.allCars = response.content.map((carData: any) => {
            // Use any type for initial data to avoid TypeScript errors on unknown properties
            // Create a properly typed object with all required fields
            const processedCar: ExtendedCarDetails = {
              ...carData,
              id: carData.id || carData._id || carData.carId || '',
              // Initialize specifications with proper structure
              specifications: carData.specifications || {
                transmission: '',
                engine: '',
                fuelType: '',
                seats: 0,
                fuelConsumption: '',
                features: []
              },
              // Explicitly copy extended properties
              fuelType: carData.fuelType,
              gearBoxType: carData.gearBoxType,
              _id: carData._id,
              carId: carData.carId
            };

            // Process images if they're strings (MongoDB format)
            if (Array.isArray(carData.images)) {
              processedCar.images = carData.images.map((img: any, index: number) => {
                if (typeof img === 'string') {
                  return {
                    id: index.toString(),
                    url: img,
                    isPrimary: index === 0
                  };
                }
                return img;
              });
            } else if (!carData.images) {
              // Provide a fallback image if none exists
              processedCar.images = [{
                id: '0',
                url: 'https://t3.ftcdn.net/jpg/02/48/42/64/360_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg',
                isPrimary: true
              }];
            }

            // Ensure rating is a number
            if (typeof carData.rating === 'string') {
              processedCar.rating = parseFloat(carData.rating);
            }

            // Ensure price is a number
            if (typeof carData.price === 'string') {
              processedCar.price = parseFloat(carData.price);
            }

            // Map gearBoxType to transmission in specifications if needed
            if (carData.gearBoxType && processedCar.specifications && 
                !processedCar.specifications.transmission) {
              processedCar.specifications.transmission = 
                carData.gearBoxType.toUpperCase() === 'AUTOMATIC' ? 'Automatic' : 'Manual';
            }

            // Map fuelType to engine/fuelType in specifications if needed
            if (carData.fuelType && processedCar.specifications && 
                !processedCar.specifications.fuelType) {
              processedCar.specifications.fuelType = carData.fuelType.charAt(0) + 
                carData.fuelType.slice(1).toLowerCase();
            }

            return processedCar;
          });
          
          console.log("sourabh", this.allCars);
          console.log("cars",this.cars);
          console.log("all cars",this.allCars);
          console.log("filtered cars",this.filteredCars);
          console.log("displayed cars",this.displayedCars);
          
          this.filteredCars = [...this.allCars]; 
          this.cars = this.filteredCars;

          // Set default display
          if (!this.viewAllMode) {
            // Get popular cars
            this.myCarService.getPopularCars().subscribe({
              next: (popularCarsData) => {
                console.log('Popular cars loaded:', popularCarsData);
                this.popularCars =(popularCarsData.content || []).map((carData: any) => {
                  // Create a properly formatted car object
                  const processedCar: ExtendedCarDetails = {
                    ...carData,
                    id: carData.id || carData._id || carData.carId || '',
                    // Explicitly copy extended properties
                    fuelType: carData.fuelType,
                    gearBoxType: carData.gearBoxType,
                    _id: carData._id,
                    carId: carData.carId,
                    // Initialize specifications properly
                    specifications: carData.specifications || {
                      transmission: '',
                      engine: '',
                      fuelType: '',
                      seats: 0,
                      fuelConsumption: '',
                      features: []
                    }
                  };

                  // Process images for popular cars
                  if (Array.isArray(carData.images)) {
                    processedCar.images = carData.images.map((img: any, index: number) => {
                      if (typeof img === 'string') {
                        return {
                          id: index.toString(),
                          url: img,
                          isPrimary: index === 0
                        };
                      }
                      return img;
                    });
                  } else if (!carData.images) {
                    processedCar.images = [{
                      id: '0',
                      url: 'https://t3.ftcdn.net/jpg/02/48/42/64/360_F_248426448_NVKLywWqArG2ADUxDq6QprtIzsF82dMF.jpg',
                      isPrimary: true
                    }];
                  }

                  // Ensure rating is a number
                  if (typeof carData.rating === 'string') {
                    processedCar.rating = parseFloat(carData.rating);
                  }

                  // Ensure price is a number
                  if (typeof carData.price === 'string') {
                    processedCar.price = parseFloat(carData.price);
                  }

                  return processedCar;
                });
                //latest edit
                this.displayedCars = [...this.filteredCars]
                  .slice(0,4);
                this.loading = false;
              },
              error: (error) => {
                console.error('Error loading popular cars:', error);
                // Fallback to sorting by rating
                this.popularCars = [...this.allCars]
                  .sort((a, b) => {
                    const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating || 0;
                    const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating || 0;
                    return ratingB - ratingA;
                  })
                  .slice(0, 4);
                this.displayedCars = this.popularCars;
                this.loading = false;
              }
            });
            this.applyFilters();
          } else {
            // Or show paginated results
            this.totalPages = Math.ceil(this.cars.length / this.itemsPerPage);
            this.updateDisplayedCars();
            this.loading = false;
          }
        } else {
          console.error('No cars data found in response:', response);
          this.provideFallbackData();
        }
      },
      error: (err) => {
        console.error('Error loading cars:', err);
        this.error = 'Failed to load cars. Please try again later.';
        this.loading = false;
        this.provideFallbackData();
      }
    });


       console.log("cars", this.cars.length);
   console.log("popularCars", this.popularCars.length);
   console.log("allCars", this.allCars.length);
   console.log("filteredCars", this.filteredCars.length);

   //DONE BY SOURABH

   this.updateDisplayedCars();
   
  }

  // Modified to use client-side filtering with fixed type issues
  applyFilters(): void {
    if (!this.allCars || !this.allCars.length) {
      console.warn('No cars data to filter');
      return;
    }

    console.log('Applying filters client-side:', this.activeFilters);
    this.loading = true;
    
    if (!this.activeFilters) {
      // If no filters, show all cars
      this.filteredCars = [...this.allCars];
      this.cars = this.filteredCars;
      this.updatePaginationAndDisplay();
      this.loading = false;
      return;
    }
    
    // Filter cars locally
    this.filteredCars = this.allCars.filter(car => {
      let matchesFilter = true;
      
      // Price Range Filter
      if (this.activeFilters?.priceMin !== undefined && this.activeFilters?.priceMax !== undefined) {
        const carPrice = typeof car.price === 'string' ? parseFloat(car.price) : car.price;
        
        if (carPrice < this.activeFilters.priceMin || carPrice > this.activeFilters.priceMax) {
          matchesFilter = false;
        }
      }
      
      // Car Category Filter
      if (this.activeFilters?.carCategory && matchesFilter) {
        const carCategory = car.category?.toLowerCase() || '';
        const filterCategory = this.activeFilters.carCategory.toLowerCase();
        
        if (carCategory !== filterCategory) {
          matchesFilter = false;
        }
      }
      
      // Gearbox/Transmission Filter
      if (this.activeFilters?.gearbox && matchesFilter) {
        // Check multiple fields that could contain transmission info
        let carTransmission: string;
        
        // First try to get from specifications.transmission
        if (car.specifications?.transmission) {
          carTransmission = car.specifications.transmission.toLowerCase();
        }
        // If not found, try the extended property gearBoxType
        else if (car.gearBoxType) {
          carTransmission = car.gearBoxType.toUpperCase() === 'AUTOMATIC' ? 'automatic' : 'manual';
        }
        // Default to empty string if neither is available
        else {
          carTransmission = '';
        }
        
        const filterTransmission = this.activeFilters.gearbox.toLowerCase();
        
        if (carTransmission !== filterTransmission) {
          matchesFilter = false;
        }
      }
      
      // Engine Type Filter
      if (this.activeFilters?.engineType && matchesFilter) {
        let engineMatch = false;
        const filterEngineType = this.activeFilters.engineType.toUpperCase();
        
        // Check multiple potential fields that might contain engine info
        const engineFields: (string | undefined)[] = [
          car.specifications?.engine,
          car.specifications?.fuelType,
          car.fuelType
        ];
        
        for (const field of engineFields) {
          if (field && field.toString().toUpperCase().includes(filterEngineType)) {
            engineMatch = true;
            break;
          }
        }
        
        if (!engineMatch) {
          matchesFilter = false;
        }
      }
      
      // Location Filter
      if (this.activeFilters?.pickupLocation && matchesFilter) {
        const carLocation = car.location?.toLowerCase() || '';
        const filterLocation = this.activeFilters.pickupLocation.toLowerCase();
        
        if (!carLocation.includes(filterLocation)) {
          matchesFilter = false;
        }
      }
      
      return matchesFilter;
    });
    
    console.log(`Client-side filtering complete: ${this.filteredCars.length} cars match the criteria`);
    this.cars = this.filteredCars;
    this.updatePaginationAndDisplay();
    this.loading = false;
    console.log("cars",this.cars);
    console.log("all cars",this.allCars);
    console.log("cars",this.cars);
    console.log("cars",this.cars);
    //DONE BY SOURABH
    this.updateDisplayedCars();
  }

  private updatePaginationAndDisplay(): void {
    // Update pagination
    this.totalPages = Math.ceil(this.cars.length / this.itemsPerPage);
    this.currentPage = 1;

    console.log(`Filter result: ${this.filteredCars.length} cars, ${this.totalPages} pages`);

    // Update displayed cars based on view mode
    if (this.viewAllMode) {
      this.updateDisplayedCars();
    } else {
      // In popular view mode
      if (this.filteredCars.length >= 4) {
        // Show top rated filtered cars
        this.displayedCars = this.filteredCars
          .sort((a, b) => {
            const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating || 0;
            const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating || 0;
            return ratingB - ratingA;
          })
          .slice(0, 4);
      } else {
        // Not enough filtered cars, show all filtered cars
        this.displayedCars = this.filteredCars;
      }
    }
  }

  provideFallbackData(): void {
    console.log('Providing fallback data');
    // Fallback data in case the API call fails
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
        "status": "Available",
        "images": [
          {
            "id": "1",
            "url": "assets/Car1.svg",
            "isPrimary": true
          }
        ],
        "specifications": {
          "transmission": "Automatic",
          "engine": "Gasoline",
          "fuelType": "Gasoline",
          "seats": 2,
          "fuelConsumption": "10.5 L/100km",
          "features": ["Sports Mode", "GPS"]
        },
        "bookedDates": [],
        "reviews": {
          "content": [],
          "totalPages": 0,
          "currentPage": 0,
          "totalElements": 0
        },
        "popularity": {
          "rentCount": 150,
          "viewCount": 1200,
          "favoriteCount": 89,
          "isPopular": true
        }
      }
    ] as ExtendedCarDetails[]; // Type assertion for the fallback data
    
    this.allCars = [...this.cars];
    this.filteredCars = [...this.cars];
    this.popularCars = [...this.cars];
    this.displayedCars = this.popularCars;
    this.error = null;
    this.loading = false;
  }

  bookCar(car: ExtendedCarDetails): void {
    // Empty function as requested
  }

  openCarDetailsPopup(carId: string): void {
    console.log('Opening car details popup for car ID:', carId);
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

  //DONE BY SOURABH

  toggleViewMode(): void {
  this.viewAllMode = !this.viewAllMode;
  console.log(`View mode toggled: ${this.viewAllMode ? 'View All' : 'Popular Cars'}`);

  if (this.viewAllMode) {
    // Reset pagination when switching to "View All"
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredCars.length / this.itemsPerPage);
    console.log(`View All mode: ${this.filteredCars.length} cars, ${this.totalPages} pages`);
  }

  // Always update displayed cars after toggling view
  this.updateDisplayedCars();
}




  //done by sourabh


  updateDisplayedCars(): void {
  if (!this.viewAllMode) {
    // In popular mode, show top rated cars
    if (this.filteredCars.length >= 4) {
      this.displayedCars = this.filteredCars
        .sort((a, b) => {
          const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : a.rating || 0;
          const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : b.rating || 0;
          return ratingB - ratingA;
        })
        .slice(0, 4);
    } else {
      this.displayedCars = this.filteredCars;
    }
    return;

  // In view all mode, apply pagination
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  this.displayedCars = this.filteredCars.slice(startIndex, endIndex);
}

    // In view all mode, use pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredCars.length);

    console.log(`Page ${this.currentPage}/${this.totalPages}: showing cars ${startIndex + 1}-${endIndex} of ${this.filteredCars.length}`);

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