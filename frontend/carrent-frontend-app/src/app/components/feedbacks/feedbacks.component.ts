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
    
    setTimeout(() => {
      console.log('Cars data after timeout:', this.cars?.length || 0, 'cars');
      if (this.cars && this.cars.length > 0) {
        console.log('First car sample:', this.cars[0].brand, this.cars[0].model);
      }
      this.updateDisplayCars();
      
      // Add scroll event listener
      const container = document.querySelector('.scrollable-container');
      if (container) {
        container.addEventListener('scroll', () => {
          this.checkScrollPosition();
        });
        
        // Initial check
        this.checkScrollPosition();
      }
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
    
    this.displayCars = this.cars;
  console.log(`Displaying all ${this.cars.length} cars for scrolling`);
  }

  // Add this new method to check scroll position for enabling/disabling nav buttons
  checkScrollPosition(): void {
    const container = document.querySelector('.scrollable-container');
    if (container) {
      // Get the leftmost visible card index
      const scrollLeft = container.scrollLeft;
      const cardWidth = 440; // card width + gap
      
      // Enable/disable navigation buttons based on scroll position
      const prevButton = document.querySelector('.nav-button.prev') as HTMLButtonElement;
      const nextButton = document.querySelector('.nav-button.next') as HTMLButtonElement;
      
      if (prevButton) {
        prevButton.disabled = scrollLeft <= 0;
      }
      
      if (nextButton) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        nextButton.disabled = scrollLeft >= maxScroll - 10; // 10px tolerance
      }
    }
  }
  
  nextCars(): void {
    // Calculate scroll amount based on card width + gap (400px + 40px)
    const scrollAmount = 440; 
    const container = document.querySelector('.scrollable-container');
    if (container) {
      container.scrollLeft += scrollAmount;
    }
  }
  
  previousCars(): void {
    // Calculate scroll amount based on card width + gap (400px + 40px)
    const scrollAmount = 440;
    const container = document.querySelector('.scrollable-container');
    if (container) {
      container.scrollLeft -= scrollAmount;
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