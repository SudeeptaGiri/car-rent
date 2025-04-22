// src/app/components/booking-success-dialog/booking-success-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-success-dialog',
  templateUrl: './booking-success-dialog.component.html',
  styleUrls: ['./booking-success-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, MatDialogModule]
})
export class BookingSuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BookingSuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      carName: string;
      startDate: Date;
      endDate: Date;
      orderNumber: string;
      bookingDate: Date;
    }
  ) {}

  // Format dates for display
  formatDateRange(startDate: Date, endDate: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const start = new Date(startDate).toLocaleDateString('en-US', options);
    const end = new Date(endDate).toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  }

  // Format deadline time
  formatDeadline(date: Date): string {
    const deadlineDate = new Date(date);
    deadlineDate.setHours(22, 30, 0); // 10:30 PM
    
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true,
      day: 'numeric',
      month: 'short'
    };
    
    return deadlineDate.toLocaleDateString('en-US', options);
  }

  // Format order date
  formatOrderDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}