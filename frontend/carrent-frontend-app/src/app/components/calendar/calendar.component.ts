import { Component, EventEmitter, HostListener, Input, Output, SimpleChanges } from '@angular/core';
import moment from 'moment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { BookedDate } from '../../models/car.interface';

@Component({
  selector: 'calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {
  @Input() bookedDates: { startDate: string; endDate: string; }[] = [];
  @Input() externalToggle = false;
  @Input() initialStartDate: Date | null = null;
  @Input() initialEndDate: Date | null = null;

  @Output() dateRangeSelected = new EventEmitter<{
    startDate: moment.Moment,
    endDate: moment.Moment
  }>();
  @Output() closed = new EventEmitter<boolean>();
  calendarMonths: Date[] = [];
  selectedPickup: Date | null = null;
  selectedDropoff: Date | null = null;
  today = new Date();
  currentMonthIndex = 0;
  isOpen = false;

  selectedPickupDate: Date | null = null;
  selectedDropoffDate: Date | null = null;

  // Add minimum and maximum time constraints
  private minTime = '00:00';
  private maxTime = '23:59';
  private defaultPickupTime = '07:00';
  private defaultDropoffTime = '10:30';

  // Add getters and setters for time values with validation
  private _pickupTime = this.defaultPickupTime;
  private _dropoffTime = this.defaultDropoffTime;
  timeValidationError: string | null = null;


  get pickupTime(): string {
    return this._pickupTime;
  }

  set pickupTime(value: string) {
    if (this.isValidTime(value)) {
      this._pickupTime = value;
    } else {
      this._pickupTime = this.defaultPickupTime;
    }
  }

  get dropoffTime(): string {
    return this._dropoffTime;
  }

  set dropoffTime(value: string) {
    if (this.isValidTime(value)) {
      this._dropoffTime = value;
    } else {
      this._dropoffTime = this.defaultDropoffTime;
    }
  }

  // Time validation method
  private isValidTime(time: string): boolean {
    if (!time) return false;
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) return false;

    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return false;
    
    return true;
  }

  // Handle time input changes
  onTimeChange(event: Event, isPickup: boolean) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
  
    if (!this.isValidTime(value)) {
      input.value = isPickup ? this.defaultPickupTime : this.defaultDropoffTime;
    }
    
    // Clear validation error when user changes input
    this.timeValidationError = null;
  }
  ngOnInit(): void {
    if (this.initialStartDate) {
      this.selectedPickup = this.initialStartDate;
    }
    
    if (this.initialEndDate) {
      this.selectedDropoff = this.initialEndDate;
    }
    const base = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.calendarMonths = [0, 1].map(i => {
      const month = new Date(base);
      month.setMonth(base.getMonth() + i);
      return month;
    });
    this.updateCalendarMonths();
  }

  resetCalendar(): void {
    this.selectedPickup = null;
    this.selectedDropoff = null;
    this.selectedPickupDate = null;
    this.selectedDropoffDate = null;
    this.pickupTime = this.defaultPickupTime;
    this.dropoffTime = this.defaultDropoffTime;
    this.isOpen = false;
    this.closed.emit(true);
  }

  ngOnChanges(changes: SimpleChanges) {
    
    if (changes['externalToggle'] && !changes['externalToggle'].firstChange) {
      this.isOpen = this.externalToggle;
    }
    
    // Also handle changes to initialStartDate and initialEndDate
    if (changes['initialStartDate'] && !changes['initialStartDate'].firstChange) {
      if (this.initialStartDate) {
        this.selectedPickup = new Date(this.initialStartDate);
        console.log('Updated pickup date from changes:', this.selectedPickup);
      }
    }
    
    if (changes['initialEndDate'] && !changes['initialEndDate'].firstChange) {
      if (this.initialEndDate) {
        this.selectedDropoff = new Date(this.initialEndDate);
        console.log('Updated dropoff date from changes:', this.selectedDropoff);
      }
    }
  }
  updateCalendarMonths() {
    const base = new Date(this.today.getFullYear(), this.today.getMonth() + this.currentMonthIndex, 1);
    this.calendarMonths = [0, 1].map(i => {
      const month = new Date(base);
      month.setMonth(base.getMonth() + i);
      return new Date(month);
    });
  }
  goToNextMonth() {
    this.currentMonthIndex++;
    this.updateCalendarMonths();
  }
  goToPrevMonth() {
    this.currentMonthIndex--;
    this.updateCalendarMonths();
  }

  getDaysInMonth(month: Date): Date[] {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1).getDay();
    const lastDay = new Date(year, m + 1, 0).getDate();
    const days: Date[] = [];

    for (let i = 0; i < first; i++) days.push(null as any); // placeholders

    for (let d = 1; d <= lastDay; d++) {
      days.push(new Date(year, m, d));
    }

    return days;
  }

  isPast(date: Date): boolean {
    const cmp = new Date();
    cmp.setHours(0, 0, 0, 0);
    return date < cmp;
  }

  isBlocked(date: Date): boolean {
    return this.bookedDates.some(({ startDate, endDate }) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return date >= start && date <= end;
    });
  }

  isRangeConflict(start: Date, end: Date): boolean {
    return this.bookedDates.some(({ startDate, endDate }) => {
      const blockStart = new Date(startDate);
      const blockEnd = new Date(endDate);
      return start <= blockEnd && end >= blockStart;
    });
  }

  isInRange(date: Date): boolean {
    if (!this.selectedPickup || !this.selectedDropoff) return false;

    const d = new Date(date.setHours(0, 0, 0, 0));
    const start = new Date(this.selectedPickup.setHours(0, 0, 0, 0));
    const end = new Date(this.selectedDropoff.setHours(0, 0, 0, 0));

    return d > start && d < end;
  }

  isSelected(date: Date): boolean {
    return this.selectedPickup?.toDateString() === date.toDateString() ||
      this.selectedDropoff?.toDateString() === date.toDateString();
  }

  onSelectDate(date: Date): void {
    if (this.isPast(date) || this.isBlocked(date)) {
      return; // Don't allow selection of past or blocked dates
    }

    if (!this.selectedPickup || (this.selectedPickup && this.selectedDropoff)) {
      // Starting new selection
      this.selectedPickup = date;
      this.selectedDropoff = null;
    } else {
      // Completing the selection
      if (date < this.selectedPickup) {
        this.selectedPickup = date;
        this.selectedDropoff = null;
      } else {
        // Check if selected range overlaps with any booked dates
        if (this.isRangeConflict(this.selectedPickup, date)) {
          // Show error or notification about unavailable dates
          return;
        }
        this.selectedDropoff = date;
      }
    }
  }

  emitSelected(): void {
    if (this.selectedPickup && this.selectedDropoff && 
        this.isValidTime(this.pickupTime) && this.isValidTime(this.dropoffTime)) {
      
      // Validate the time range
      const validation = this.validateTimeRange();
      if (!validation.valid) {
        this.timeValidationError = validation.error || null;
        return;
      }
      
      // Clear any previous validation errors
      this.timeValidationError = null;
      
      const pickup = new Date(this.selectedPickup);
      const dropoff = new Date(this.selectedDropoff);
      
      try {
        const [ph, pm] = this.pickupTime.split(':').map(Number);
        const [dh, dm] = this.dropoffTime.split(':').map(Number);
        
        if (isNaN(ph) || isNaN(pm) || isNaN(dh) || isNaN(dm)) {
          throw new Error('Invalid time format');
        }
        
        pickup.setHours(ph, pm);
        dropoff.setHours(dh, dm);
  
        this.dateRangeSelected.emit({
          startDate: moment(pickup),
          endDate: moment(dropoff)
        });
        this.isOpen = false;
      } catch (error) {
        console.error('Error processing time:', error);
        // Reset to default times
        this.pickupTime = this.defaultPickupTime;
        this.dropoffTime = this.defaultDropoffTime;
      }
    }
  }

  closePicker(): void {
    this.isOpen = false;
  }

  formatStartDate(): string {
    if (!this.selectedPickup) {
      return 'Select start date';
    }
    return this.formatDate(this.selectedPickup);
  }

  formatEndDate(): string {
    if (!this.selectedDropoff) {
      return 'Select end date';
    }
    return this.formatDate(this.selectedDropoff);
  }

  // Update your existing formatDate method if needed
  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-picker-container')) {
      this.isOpen = false;
    }
  }

  togglePicker() {
    this.isOpen = !this.isOpen;
  }

  formatSelectedDates(): string {
    if (!this.selectedPickup) {
      return 'Select dates';
    }
    if (!this.selectedDropoff) {
      return `${this.formatDate(this.selectedPickup)} - Select end date`;
    }
    return `${this.formatDate(this.selectedPickup)} - ${this.formatDate(this.selectedDropoff)}`;
  }

  private validateTimeRange(): { valid: boolean, error?: string } {
    // Only validate if both dates are the same day
    if (this.selectedPickup && this.selectedDropoff && 
        this.selectedPickup.toDateString() === this.selectedDropoff.toDateString()) {
      
      const [pickupHours, pickupMinutes] = this.pickupTime.split(':').map(Number);
      const [dropoffHours, dropoffMinutes] = this.dropoffTime.split(':').map(Number);
      
      const pickupMinutesTotal = pickupHours * 60 + pickupMinutes;
      const dropoffMinutesTotal = dropoffHours * 60 + dropoffMinutes;
      
      if (dropoffMinutesTotal <= pickupMinutesTotal) {
        return { 
          valid: false, 
          error: 'Drop-off time must be after pick-up time on the same day' 
        };
      }
    }
    
    return { valid: true };
  }
}
