// feedback-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Booking } from '../../models/booking.model';
import { FeedbackService } from '../../services/feedback.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-feedback-dialog',
  templateUrl: './feedback-dialog.component.html',
  styleUrls: ['./feedback-dialog.component.css'],
  standalone: false
})
export class FeedbackDialogComponent implements OnInit {
  feedbackForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  stars = [1, 2, 3, 4, 5];
  
  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    public dialogRef: MatDialogRef<FeedbackDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: Booking }
  ) {
    // Initialize form with validators
    this.feedbackForm = this.fb.group({
      carRating: [null, Validators.required],
      serviceRating: [null, Validators.required],
      comment: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    console.log('Dialog data:', this.data);
    console.log('Booking data:', this.data.booking);
    
    // Set dialog position to center
    this.dialogRef.updatePosition({ top: '50px' });
    
    // Make dialog take less space and center it
    this.dialogRef.updateSize('400px', 'auto');
  }
  
  onCancelClick(): void {
    this.dialogRef.close();
  }
  
 // feedback-dialog.component.ts
onSubmitClick(): void {
  if (this.feedbackForm.valid) {
    this.isSubmitting = true;
    this.errorMessage = '';
    
    try {
      // Get current user info
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      const clientId = currentUser._id;
      const author = currentUser.name || currentUser.email || 'Anonymous User';
      const authorImageUrl = currentUser.profileImage || '';
      
      // Generate a unique feedbackId
      const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Prepare feedback data
      const feedbackData = {
        feedbackId: feedbackId, // Add this line to include feedbackId
        carId: this.data.booking.carId,
        clientId: clientId,
        bookingId: this.data.booking.id,
        author: author,
        authorImageUrl: authorImageUrl,
        carRating: this.feedbackForm.value.carRating,
        serviceRating: this.feedbackForm.value.serviceRating,
        feedbackText: this.feedbackForm.value.comment
      };
      
      console.log('Submitting feedback:', feedbackData);
      
      this.feedbackService.submitFeedback(feedbackData).subscribe({
        next: (response) => {
          console.log('Feedback submitted successfully', response);
          this.isSubmitting = false;
          this.dialogRef.close({
            success: true,
            rating: this.feedbackForm.value.carRating,
            comment: this.feedbackForm.value.comment,
            feedback: response.feedback
          });
        },
        error: (error) => {
          console.error('Error submitting feedback', error);
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Failed to submit feedback. Please try again.';
        }
      });
    } catch (error) {
      console.error('Error preparing feedback data', error);
      this.isSubmitting = false;
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
  } else {
    // Mark all form controls as touched to show validation errors
    Object.keys(this.feedbackForm.controls).forEach(key => {
      this.feedbackForm.get(key)?.markAsTouched();
    });
  }
}
  
  setCarRating(rating: number): void {
    this.feedbackForm.get('carRating')?.setValue(rating);
    this.feedbackForm.get('carRating')?.markAsTouched();
  }
  
  setServiceRating(rating: number): void {
    this.feedbackForm.get('serviceRating')?.setValue(rating);
    this.feedbackForm.get('serviceRating')?.markAsTouched();
  }
  
  // Helper method to check if a field has an error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.feedbackForm.get(controlName);
    return control !== null && control.touched && control.hasError(errorName);
  }
  
  // Helper method to get star display class
  getStarClass(controlName: string, starValue: number): string {
    const control = this.feedbackForm.get(controlName);
    if (!control) return 'text-gray-200';
    
    const rating = control.value;
    return rating >= starValue ? 'text-yellow-400' : 'text-gray-200';
  }
}