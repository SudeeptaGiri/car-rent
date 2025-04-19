import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-filter',
  standalone: false,
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit, AfterViewInit {
  @ViewChild('rangeSlider') rangeSliderElement!: ElementRef;
  
  minPrice: number = 50;
  maxPrice: number = 2000;
  currentMinPrice: number = 52;
  currentMaxPrice: number = 400; // Default max value shown in UI
  
  // Track slider state
  isDraggingMin = false;
  isDraggingMax = false;
  sliderWidth = 0;
  sliderLeft = 0;
  
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initRangeSlider();
    
    // Add window resize listener to recalculate slider dimensions
    window.addEventListener('resize', () => {
      this.updateSliderDimensions();
      this.updateSliderPositions();
    });
  }

  initRangeSlider(): void {
    this.updateSliderDimensions();
    this.updateSliderPositions();
    
    // Add event listeners for mouse and touch events
    const slider = this.rangeSliderElement.nativeElement;
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    // Mouse events for min handle
    minHandle.addEventListener('mousedown', (e: MouseEvent) => {
      this.startDragMin(e);
    });
    
    // Mouse events for max handle
    maxHandle.addEventListener('mousedown', (e: MouseEvent) => {
      this.startDragMax(e);
    });
    
    // Mouse move and up events for the whole document
    document.addEventListener('mousemove', (e: MouseEvent) => {
      this.onDrag(e);
    });
    
    document.addEventListener('mouseup', () => {
      this.stopDrag();
    });
    
    // Touch events for min handle
    minHandle.addEventListener('touchstart', (e: TouchEvent) => {
      this.startDragMin(e.touches[0]);
      e.preventDefault();
    });
    
    // Touch events for max handle
    maxHandle.addEventListener('touchstart', (e: TouchEvent) => {
      this.startDragMax(e.touches[0]);
      e.preventDefault();
    });
    
    // Touch move and end events for the whole document
    document.addEventListener('touchmove', (e: TouchEvent) => {
      this.onDrag(e.touches[0]);
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
      this.stopDrag();
    });
  }
  
  updateSliderDimensions(): void {
    const slider = this.rangeSliderElement.nativeElement;
    const rect = slider.getBoundingClientRect();
    this.sliderWidth = rect.width;
    this.sliderLeft = rect.left;
  }
  
  startDragMin(e: MouseEvent | Touch): void {
    this.isDraggingMin = true;
    this.updateMinPosition(e.clientX);
  }
  
  startDragMax(e: MouseEvent | Touch): void {
    this.isDraggingMax = true;
    this.updateMaxPosition(e.clientX);
  }
  
  onDrag(e: MouseEvent | Touch): void {
    if (this.isDraggingMin) {
      this.updateMinPosition(e.clientX);
    } else if (this.isDraggingMax) {
      this.updateMaxPosition(e.clientX);
    }
  }
  
  stopDrag(): void {
    this.isDraggingMin = false;
    this.isDraggingMax = false;
  }
  
  updateMinPosition(clientX: number): void {
    const slider = this.rangeSliderElement.nativeElement;
    const track = slider.querySelector('.slider-track');
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    // Calculate position within the slider
    let position = clientX - this.sliderLeft;
    
    // Constrain to slider boundaries
    position = Math.max(0, Math.min(position, this.sliderWidth));
    
    // Constrain to not exceed max handle
    const maxHandlePosition = parseInt(maxHandle.style.left || '0', 10);
    position = Math.min(position, maxHandlePosition);
    
    // Calculate price based on position
    const priceRange = this.maxPrice - this.minPrice;
    const percentage = position / this.sliderWidth;
    this.currentMinPrice = Math.round(this.minPrice + (percentage * priceRange));
    
    // Update handle position
    minHandle.style.left = `${position}px`;
    
    // Update track fill
    this.updateTrackFill();
  }
  
  updateMaxPosition(clientX: number): void {
    const slider = this.rangeSliderElement.nativeElement;
    const track = slider.querySelector('.slider-track');
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    // Calculate position within the slider
    let position = clientX - this.sliderLeft;
    
    // Constrain to slider boundaries
    position = Math.max(0, Math.min(position, this.sliderWidth));
    
    // Constrain to not go below min handle
    const minHandlePosition = parseInt(minHandle.style.left || '0', 10);
    position = Math.max(position, minHandlePosition);
    
    // Calculate price based on position
    const priceRange = this.maxPrice - this.minPrice;
    const percentage = position / this.sliderWidth;
    this.currentMaxPrice = Math.round(this.minPrice + (percentage * priceRange));
    
    // Update handle position
    maxHandle.style.left = `${position}px`;
    
    // Update track fill
    this.updateTrackFill();
  }
  
  updateTrackFill(): void {
    const slider = this.rangeSliderElement.nativeElement;
    const track = slider.querySelector('.slider-track');
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    const minPos = parseInt(minHandle.style.left || '0', 10);
    const maxPos = parseInt(maxHandle.style.left || '0', 10);
    
    const fillStart = (minPos / this.sliderWidth) * 100;
    const fillEnd = (maxPos / this.sliderWidth) * 100;
    
    track.style.background = `linear-gradient(
      to right, 
      #e5e5e5 0%, 
      #e5e5e5 ${fillStart}%, 
      #d32f2f ${fillStart}%, 
      #d32f2f ${fillEnd}%, 
      #e5e5e5 ${fillEnd}%, 
      #e5e5e5 100%
    )`;
  }
  
  updateSliderPositions(): void {
    const slider = this.rangeSliderElement.nativeElement;
    const minHandle = slider.querySelector('.min-handle');
    const maxHandle = slider.querySelector('.max-handle');
    
    // Calculate initial positions based on current prices
    const priceRange = this.maxPrice - this.minPrice;
    const minPercentage = (this.currentMinPrice - this.minPrice) / priceRange;
    const maxPercentage = (this.currentMaxPrice - this.minPrice) / priceRange;
    
    const minPosition = minPercentage * this.sliderWidth;
    const maxPosition = maxPercentage * this.sliderWidth;
    
    // Set handle positions
    minHandle.style.left = `${minPosition}px`;
    maxHandle.style.left = `${maxPosition}px`;
    
    // Update track fill
    this.updateTrackFill();
  }
  
  clearFilters(): void {
    this.currentMinPrice = 52;
    this.currentMaxPrice = 400; // Reset to default max shown in UI
    this.updateSliderPositions();
  }
  
  findCars(): void {
    console.log(`Finding cars with price range: $${this.currentMinPrice} - $${this.currentMaxPrice}`);
    // Implement your search logic here
  }
}