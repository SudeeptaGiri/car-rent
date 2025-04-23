import { Component, OnInit, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CarImage {
  id?: string;
  url?: string;
  isPrimary?: boolean;
}

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  rating: number;
  price: number;
  category: string;
  status: string;
  images: CarImage[];
  specifications: any;
  bookedDates: any[];
  reviews: {
    content: {
      id?: string;
      userName?: string;
      rating?: number;
      comment?: string;
      date?: string;
      userAvatar?: string;
    }[];
  };
  popularity: any;
}

@Component({
  selector: 'app-feedback',
  standalone: true, // Keep it standalone
  imports: [CommonModule],
  templateUrl: './feedbacks.component.html', // Changed from feedback.component.html
  styleUrls: ['./feedbacks.component.css'] // Changed from feedback.component.css
})
export class FeedbackComponent implements OnInit {
  @Input() cars: Car[] = [];
  
  // Hardcoded order history and date
  orderHistory = '#2437 (06.11.24)';
  reviewDate = '05.10.2024';
  
  // Display cars for feedback
  displayCars: Car[] = [];
  currentIndex = 0;
  isMobile = false;
  
  constructor() {}
  
  ngOnInit(): void {
    console.log('FeedbackComponent initialized, cars input:', this.cars);
    this.checkScreenSize();
    
    // Add data watch with timeout to wait for Input binding
    setTimeout(() => {
      console.log('Cars data after timeout:', this.cars?.length || 0, 'cars');
      if (this.cars && this.cars.length > 0) {
        console.log('First car sample:', this.cars[0].brand, this.cars[0].model);
        console.log('First car has images:', this.cars[0].images?.length || 0);
      } else {
        console.warn('No cars data received in feedback component');
      }
      this.updateDisplayCars();
    }, 500);
  }
  
  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    this.updateDisplayCars();
  }
  
  updateDisplayCars(): void {
    if (!this.cars || this.cars.length === 0) {
      console.warn('No cars data available for feedback component');
      this.displayCars = [];
      return;
    }
    
    const cardsToShow = this.isMobile ? 1 : 3;
    const startIdx = this.currentIndex;
    const endIdx = Math.min(startIdx + cardsToShow, this.cars.length);
    this.displayCars = this.cars.slice(startIdx, endIdx);
    console.log(`Displaying cars ${startIdx+1}-${endIdx} of ${this.cars.length}`);
  }
  
  nextCars(): void {
    const step = this.isMobile ? 1 : 3;
    if (this.currentIndex + step < this.cars.length) {
      this.currentIndex += step;
      this.updateDisplayCars();
    }
  }
  
  previousCars(): void {
    const step = this.isMobile ? 1 : 3;
    if (this.currentIndex - step >= 0) {
      this.currentIndex -= step;
      this.updateDisplayCars();
    }
  }
  
  // Helper method to get primary image URL
  getPrimaryImageUrl(car: Car): string {
    if (!car.images || car.images.length === 0) {
      return 'https://via.placeholder.com/300x200?text=Car+Image';
    }
    
    // Check if any image has a URL
    const imageWithUrl = car.images.find(img => img && img.url);
    if (imageWithUrl && imageWithUrl.url) {
      return imageWithUrl.url;
    }
    
    // Use fallback URL based on car brand
    return `https://via.placeholder.com/300x200?text=${car.brand}+${car.model}`;
  }
  
  // Helper method to get first review user
  getFirstReviewUser(car: Car): string {
    return car.reviews?.content?.[0]?.userName || 'Anonymous User';
  }
  
  // Helper method to get first review comment
  getFirstReviewComment(car: Car): string {
    return car.reviews?.content?.[0]?.comment || 'No comment provided';
  }
  
  // Helper to get city from location
  getCity(car: Car): string {
    if (!car.location) return 'Unknown';
    return car.location.split(',')[0].trim();
  }
  
  // Helper to get star rating display
  getStarRating(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(1);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(0.5);
    }
    
    // Add empty stars
    while (stars.length < 5) {
      stars.push(0);
    }
    
    return stars;
  }
}