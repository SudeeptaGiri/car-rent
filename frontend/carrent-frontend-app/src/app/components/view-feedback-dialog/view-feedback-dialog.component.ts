import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Feedback } from '../../models/booking.model';

@Component({
  selector: 'app-view-feedback-dialog',
  templateUrl: './view-feedback-dialog.component.html',
  styleUrls: ['./view-feedback-dialog.component.css'],
  standalone: false
})
export class ViewFeedbackDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewFeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { feedback: Feedback }
  ) {}
  
  close(): void {
    this.dialogRef.close();
  }
}