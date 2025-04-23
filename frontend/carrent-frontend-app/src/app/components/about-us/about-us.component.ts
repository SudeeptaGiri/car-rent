import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CarDetails } from '../../models/car.interface';

// Create an interface for the actual JSON structure
interface CarsResponse {
  cars: CarDetails[];
}

interface Location {
  id: number;
  name: string;
  address: string;
  mapEmbedUrl: string;
}

@Component({
  selector: 'app-about-us',
  standalone: false,
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.css']
})
export class AboutUsComponent implements OnInit {
  readonly originYear: number = 2009;
  
  yearsInBusiness: number = 0;
  locationCount: number = 0;
  carBrands: number = 0; 
  carCount: number = 0;  
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    // Calculate years in business
    const currentYear = new Date().getFullYear();
    this.yearsInBusiness = currentYear - this.originYear;
    
    // Load locations data to get count
    this.http.get<Location[]>('assets/data/locations.json').subscribe({
      next: (locations) => {
        this.locationCount = locations.length;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.locationCount = 6; // Default value if loading fails
      }
    });

    // Load cars data to get brands and count - using correct path and response type
    this.http.get<CarsResponse>('/assets/cars.json').subscribe({
      next: (response) => {
        // Set car count from the cars array
        this.carCount = response.cars.length;
        
        // Extract unique car brands using a Set
        const uniqueBrands = new Set<string>();
        response.cars.forEach(car => {
          if (car && car.brand) {
            uniqueBrands.add(car.brand);
          }
        });
        
        // Count of unique brands
        this.carBrands = uniqueBrands.size;
        
        console.log(`Loaded ${this.carCount} cars from ${uniqueBrands.size} unique brands`);
        console.log('Unique brands:', Array.from(uniqueBrands));
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        // Fallback values
        this.carBrands = 10;
        this.carCount = 25;
      }
    });
  }
}