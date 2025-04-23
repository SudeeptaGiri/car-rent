import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-car-reserved-dialog',
  templateUrl: './car-reserved-dialog.component.html',
  styleUrls: ['./car-reserved-dialog.component.css'],
  standalone: false
})
export class CarReservedDialogComponent {
  constructor(public dialogRef: MatDialogRef<CarReservedDialogComponent>) {}

  onOkClick(): void {
    this.dialogRef.close();
  }

  onFindSimilarClick(): void {
    window.location.href = '/cars';
    this.dialogRef.close();
  }
}