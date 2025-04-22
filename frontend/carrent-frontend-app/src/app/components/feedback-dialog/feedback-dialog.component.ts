import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css'],
  standalone: false
})
export class FeedbackDialogComponent {
  feedbackForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: Booking }
  ) {
    this.feedbackForm = this.fb.group({
      rating: [null, Validators.required],
      comment: ['']
    });
  }
  
  onCancelClick(): void {
    this.dialogRef.close();
  }
  
  onSubmitClick(): void {
    if (this.feedbackForm.valid) {
      this.dialogRef.close(this.feedbackForm.value);
    }
  }
  
  setRating(rating: number): void {
    this.feedbackForm.get('rating')?.setValue(rating);
  }
}