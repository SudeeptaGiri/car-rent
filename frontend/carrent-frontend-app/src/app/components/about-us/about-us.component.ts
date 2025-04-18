import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
  carBrands: number = 25; // Static for now, but could be made dynamic
  carCount: number = 100; // Static for now, but could be made dynamic
  
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
        this.locationCount = 6;// Default value if loading fails
      }
    });
  }
}