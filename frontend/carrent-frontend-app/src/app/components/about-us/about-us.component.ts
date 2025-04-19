import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Car } from '../cards/cards.component';

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
  readonly originYear: number = 2010;
  
  yearsInBusiness: number = 0;
  locationCount: number = 0;
  carBrands: number = 0; // Will be calculated dynamically
  carCount: number = 0;  // Will be calculated dynamically
  
  constructor(private http: HttpClient) {}
  
  ngOnInit(): void {
    // Calculate years in business
    const currentYear = new Date().getFullYear();
    this.yearsInBusiness = currentYear - this.originYear;
    
    // Load locations data to get count
    this.http.get<Location[]>('assets/data/hyderabad-locations.json').subscribe({
      next: (locations) => {
        this.locationCount = locations.length;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.locationCount = 6; // Default value if loading fails
      }
    });

    // Load cars data to get brands and count
    this.http.get<Car[]>('assets/data/cars.json').subscribe({
      next: (cars) => {
        // Set car count
        this.carCount = cars.length;
        
        // Extract unique car brands (first word of car name)
        const brandSet = new Set<string>();
        cars.forEach(car => {
          const brand = car.name.split(' ')[0];
          brandSet.add(brand);
        });
        
        this.carBrands = brandSet.size;
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