// // feedbacks.component.ts
// import { Component, OnInit, Input, HostListener, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FeedbackService } from '../../services/feedback.service';
// import { Feedback } from '../../models/feedback.model';
// import { Subscription } from 'rxjs';

// interface CarImage {
//   id?: string;
//   url?: string;
//   isPrimary?: boolean;
// }

// interface Car {
//   id: string;
//   brand: string;
//   model: string;
//   year: number;
//   location: string;
//   rating: number;
//   price: number;
//   category: string;
//   status: string;
//   images: CarImage[];
//   specifications: any;
//   bookedDates: any[];
//   reviews: {
//     content: {
//       id?: string;
//       userName?: string;
//       rating?: number;
//       comment?: string;
//       date?: string;
//       userAvatar?: string;
//     }[];
//   };
//   popularity: any;
// }

// @Component({
//   selector: 'app-feedback',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './feedbacks.component.html',
//   styleUrls: ['./feedbacks.component.css']
// })
// export class FeedbackComponent implements OnInit, OnDestroy {
//   @Input() cars: Car[] = [];
  
//   // Display cars and feedback
//   displayCars: Car[] = [];
//   recentFeedback: Feedback[] = [];
//   currentIndex = 0;
//   isMobile = false;
//   isLoading = true;
  
//   private subscription = new Subscription();
  
//   constructor(private feedbackService: FeedbackService) {}
  
//   ngOnInit(): void {
//     console.log('FeedbackComponent initialized');
//     this.checkScreenSize();
//     this.loadRecentFeedback();
    
//     // Add scroll event listener
//     setTimeout(() => {
//       const container = document.querySelector('.scrollable-container');
//       if (container) {
//         container.addEventListener('scroll', () => {
//           this.checkScrollPosition();
//         });
        
//         // Initial check
//         this.checkScrollPosition();
//       }
//     }, 500);
//   }
  
//   ngOnDestroy(): void {
//     this.subscription.unsubscribe();
//   }
  
//   loadRecentFeedback(): void {
//     this.isLoading = true;
//     this.subscription.add(
//       this.feedbackService.getRecentFeedback(10).subscribe({
//         next: (feedback) => {
//           console.log('Recent feedback loaded:', feedback);
//           this.recentFeedback = feedback;
//           this.isLoading = false;
//           this.updateDisplayCars();
//         },
//         error: (error) => {
//           console.error('Error loading recent feedback:', error);
//           this.isLoading = false;
//         }
//       })
//     );
//   }
  
//   @HostListener('window:resize')
//   checkScreenSize() {
//     this.isMobile = window.innerWidth < 768;
//     this.updateDisplayCars();
//   }
  
//   updateDisplayCars(): void {
//     if (this.recentFeedback && this.recentFeedback.length > 0) {
//       // Use the feedback data directly
//       console.log(`Displaying ${this.recentFeedback.length} recent feedback items`);
//     } else if (this.cars && this.cars.length > 0) {
//       // Fallback to cars input if no feedback is available
//       this.displayCars = this.cars;
//       console.log(`Displaying all ${this.cars.length} cars for scrolling`);
//     } else {
//       console.warn('No feedback or cars data available');
//       this.displayCars = [];
//     }
//   }

//   checkScrollPosition(): void {
//     const container = document.querySelector('.scrollable-container');
//     if (container) {
//       const scrollLeft = container.scrollLeft;
//       const cardWidth = 440; // card width + gap
      
//       const prevButton = document.querySelector('.nav-button.prev') as HTMLButtonElement;
//       const nextButton = document.querySelector('.nav-button.next') as HTMLButtonElement;
      
//       if (prevButton) {
//         prevButton.disabled = scrollLeft <= 0;
//       }
      
//       if (nextButton) {
//         const maxScroll = container.scrollWidth - container.clientWidth;
//         nextButton.disabled = scrollLeft >= maxScroll - 10; // 10px tolerance
//       }
//     }
//   }
  
//   nextCars(): void {
//     const scrollAmount = 440; 
//     const container = document.querySelector('.scrollable-container');
//     if (container) {
//       container.scrollLeft += scrollAmount;
//     }
//   }
  
//   previousCars(): void {
//     const scrollAmount = 440;
//     const container = document.querySelector('.scrollable-container');
//     if (container) {
//       container.scrollLeft -= scrollAmount;
//     }
//   }
  
  // // Helper method to get image URL from feedback or car
  // getImageUrl(item: Feedback | Car): string {
  //   if ('carImage' in item && item.carImage) {
  //     return item.carImage;
  //   } else if ('images' in item && item.images && item.images.length > 0) {
  //     const imageWithUrl = item.images.find(img => img && img.url);
  //     if (imageWithUrl && imageWithUrl.url) {
  //       return imageWithUrl.url;
  //     }
  //   }
    
//     // Fallback URL
//     const name : any = 'carDetails' in item ? item.carDetails : 
//                  'brand' in item ? `${item.brand} ${item.model}` : 'Car';
//     return `https://via.placeholder.com/300x200?text=${encodeURIComponent(name)}`;
//   }
  
//   // Helper method to get car details
//   getCarDetails(item: Feedback | Car): string {
//     if ('carDetails' in item) {
//       return item.carDetails || 'Unknown Car';
//     } else if ('brand' in item) {
//       return `${item.brand} ${item.model} ${item.year}`;
//     }
//     return 'Unknown Car';
//   }
  
//   // Helper method to get order number
//   getOrderNumber getCarDetails(item: Feedback | Car): string {
//     if ('orderNumber' in item) {
//       return `#${item.orderNumber}`;
//     }
//     return '#0000';
//   }
  
//   // Helper method to get feedback date
//   getFeedbackDate getOrderNumber getCarDetails(item: Feedback | Car): string {
//     if ('date' in item && item.date) {
//       const date = new Date(item.date);
//       return date.toLocaleDateString('en-US', { 
//         day: '2-digit', 
//         month: '2-digit', 
//         year: '2-digit' 
//       });
//     }
//     return '00.00.00';
//   }
  
//   // Helper method to get author name
//   getAuthorName getFeedbackDate getOrderNumber getCarDetails(item: Feedback | Car): string {
//     if ('author' in item) {
//       return item.author;
//     } else if ('reviews' in item && item.reviews?.content?.length > 0) {
//       return item.reviews.content[0].userName || 'Anonymous';
//     }
//     return 'Anonymous';
//   }
  
//   // Helper method to get feedback text
//   getFeedbackText getAuthorName getFeedbackDate getOrderNumber getCarDetails(item: Feedback | Car): string {
//     if ('feedbackText' in item) {
//       return item.feedbackText;
//     } else if ('reviews' in item && item.reviews?.content?.length > 0) {
//       return item.reviews.content[0].comment || 'No comment provided';
//     }
//     return 'No feedback provided';
//   }
  
//   // Helper method to get rating
//   getRating getFeedbackText getAuthorName getFeedbackDate getOrderNumber getCarDetails(item: Feedback | Car): number {
//     if ('carRating' in item) {
//       return item.carRating;
//     } else if ('rating' in item) {
//       return item.rating;
//     }
//     return 0;
//   }
  
//   // Helper to get city from location
//   getCity getRating getFeedbackText getAuthorName getFeedbackDate getOrderNumber getCarDetails(item: Feedback | Car): string {
//     if ('location' in item && item.location) {
//       return item.location.split(',')[0].trim();
//     }
//     return 'Unknown';
//   }
  
//   // Helper to get star rating display
//   getStarRating getCity getRating getFeedbackText getAuthorName getFeedbackDate getOrderNumber getCarDetails(rating: number): number[] {
//     const fullStars = Math.floor(rating);
//     const hasHalfStar = rating % 1 >= 0.5;
//     const stars = [];
    
//     // Add full stars
//     for (let i = 0; i < fullStars; i++) {
//       stars.push(1);
//     }
    
//     // Add half star if needed
//     if (hasHalfStar) {
//       stars.push(0.5);
//     }
    
//     // Add empty stars
//     while (stars.length < 5) {
//       stars.push(0);
//     }
    
//     return stars;
//   }
// }




//DONE BY SOURABH


import { Component, OnInit } from '@angular/core';
import { Feedback } from '../../models/feedback.model';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback',
  standalone: false,
  templateUrl: './feedbacks.component.html',
  styleUrls: ['./feedbacks.component.css'],
})
export class FeedbacksComponent implements OnInit {
  allFeedback: Feedback[] = [];
  recentFeedback: Feedback[] = [];
  carFeedback: Feedback[] = [];
  carToSearch: string = ''; // you can bind this to an input field
  currentIndex = 0;
  isMobile = false;
  isLoading = true;


  constructor(private feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.fetchAllFeedback();
    this.fetchRecentFeedback();
    this.isMobile = window.innerWidth < 768;
  }

  fetchAllFeedback(): void {
    this.feedbackService.getAllFeedback().subscribe({
      next: (response) => {
        this.allFeedback = response.feedback || [];
        console.log("all feedbacks", this.allFeedback);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading feedback:', err);
        this.isLoading = false;
      }
    });
  }

  fetchRecentFeedback(): void {
    this.feedbackService.getRecentFeedback().subscribe({
      next: (response) => {
        this.recentFeedback = response.content || [];
        console.log("recent feedbacks", this.recentFeedback);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading feedback:', err);
        this.isLoading = false;
      }
    });
  }

  fetchCarFeedback(): void {
    if (!this.carToSearch) return;
    this.feedbackService.getCarFeedback(this.carToSearch).subscribe((response) => {
      console.log("fetchCarFeedback", response);
      this.carFeedback = response || [];
    });
  }

  submitFeedback(feedback: any): void {
    this.feedbackService.submitFeedback(feedback).subscribe((res) => {
      console.log('Feedback submitted:', res);
      this.fetchAllFeedback(); // optionally refresh
    });
  }


  getImageUrl(feedback: Feedback): string {
  return feedback.carImage || '';
  }

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
  
  
  // getCity(feedback: Feedback): string {
  // return feedback.carImage || 'assets/images/default-car.jpg';
  // }
  
  getRating(feedback: Feedback): number {
  return feedback.carRating || -1;
  }
  
  getFeedbackText(feedback: Feedback): string {
  return feedback.feedbackText || 'Dummy feedback text';
  }
  
  getAuthorName(feedback: Feedback): string {
  return feedback.author || 'Dummy author name';
  }
  
  getFeedbackDate(feedback: Feedback): any {
  return feedback.date || 'Dummy date';
  }
  
  getOrderNumber(feedback: Feedback): string {
  return feedback.orderNumber || 'Dummy order number';
  }
  
  getCarDetails(feedback: Feedback): string {
  return feedback.carDetails || 'Dummy car detailsg';
  }

  previousCars(): void {
    const scrollAmount = 440;
    const container = document.querySelector('.scrollable-container');
      if (container) {
        container.scrollLeft -= scrollAmount;
      }
  }


    nextCars(): void {
    const scrollAmount = 440; 
    const container = document.querySelector('.scrollable-container');
    if (container) {
      container.scrollLeft += scrollAmount;
    }
  }


}
