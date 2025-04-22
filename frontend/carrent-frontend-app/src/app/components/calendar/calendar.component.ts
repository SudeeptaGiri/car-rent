import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import moment from 'moment';
import { BookedDate } from '../../models/car.model';

@Component({
  selector: 'calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {
  @Input() bookedDates: { startDate: string; endDate: string; }[] = [];
  @Output() dateRangeSelected = new EventEmitter<{
    startDate: moment.Moment,
    endDate: moment.Moment
  }>();
  @Output() closed = new EventEmitter<boolean>();
  calendarMonths: Date[] = [];
  selectedPickup: Date | null = null;
  selectedDropoff: Date | null = null;
  pickupTime = '07:00';
  dropoffTime = '10:30';
  today = new Date();
  currentMonthIndex = 0;
  isOpen = false;



  selectedPickupDate: Date | null = null;
  selectedDropoffDate: Date | null = null;


  ngOnInit(): void {
    const base = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    this.calendarMonths = [0, 1].map(i => {
      const month = new Date(base);
      month.setMonth(base.getMonth() + i);
      return month;
    });
    this.updateCalendarMonths();
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
    if (this.selectedPickup && this.selectedDropoff) {
      const pickup = new Date(this.selectedPickup);
      const dropoff = new Date(this.selectedDropoff);
      const [ph, pm] = this.pickupTime.split(':').map(Number);
      const [dh, dm] = this.dropoffTime.split(':').map(Number);
      
      pickup.setHours(ph, pm);
      dropoff.setHours(dh, dm);

      // Just emit the selected dates without any login check
      this.dateRangeSelected.emit({
        startDate: moment(pickup),
        endDate: moment(dropoff)
      });
      this.isOpen = false;
    }
  }


  closePicker(): void {
    this.isOpen = false;
  }



  // date-range-picker.component.ts

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
}
