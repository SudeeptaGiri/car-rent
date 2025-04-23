import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-booking-cancelled-dialog',
  templateUrl: './booking-cancelled-dialog.component.html',
  styleUrls: ['./booking-cancelled-dialog.component.css'],
  standalone: false
})
export class BookingCancelledDialogComponent {
  constructor(public dialogRef: MatDialogRef<BookingCancelledDialogComponent>) {}
  
  close(): void {
    this.dialogRef.close();
  }
}