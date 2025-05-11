// services/feedback.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Feedback, FeedbackResponse, FeedbackListResponse, RecentFeedbackResponse } from '../models/feedback.model';
@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = "https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api";
  private feedbackSubject = new BehaviorSubject<Feedback[]>([]);
  
  constructor(private http: HttpClient) {}
  
  // Get feedback as an observable
  get feedback$(): Observable<Feedback[]> {
    return this.feedbackSubject.asObservable();
  }
  
  // Submit feedback for a booking
  submitFeedback(feedbackData: {
    carId: string;
    clientId: string;
    bookingId: string;
    author: string;
    authorImageUrl?: string;
    carRating: number;
    serviceRating: number;
    feedbackText: string;
  }): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.apiUrl}/feedbacks`, feedbackData)
      .pipe(
        tap(response => {
          console.log('Feedback submitted successfully:', response);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error submitting feedback:', error);
          
          // Format the error message for better display
          let errorMessage = 'Failed to submit feedback. Please try again.';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
            
            // Make the error message more user-friendly
            if (errorMessage.includes('completed bookings')) {
              errorMessage = 'Feedback can only be submitted for completed bookings. Please wait until your booking is marked as completed.';
            }
          }
          
          // Return a throwable error with the formatted message
          return throwError(() => ({ 
            message: errorMessage, 
            originalError: error 
          }));
        })
      );
  }
  
  // Get all feedback with optional filters
  getAllFeedback(params?: {
    carId?: string;
    clientId?: string;
    minRating?: number;
    limit?: number;
    page?: number;
  }): Observable<FeedbackListResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.carId) httpParams = httpParams.set('carId', params.carId);
      if (params.clientId) httpParams = httpParams.set('clientId', params.clientId);
      if (params.minRating) httpParams = httpParams.set('minRating', params.minRating.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
    }
    
    return this.http.get<FeedbackListResponse>(`${this.apiUrl}/feedback`, { params: httpParams })
      .pipe(
        tap(response => {
          this.feedbackSubject.next(response.feedback);
        }),
        catchError(error => {
          console.error('Error fetching feedback:', error);
          throw error;
        })
      );
  }
  
  // Get recent feedback
  getRecentFeedback(limit: number = 5): Observable<Feedback[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<RecentFeedbackResponse>(`${this.apiUrl}/feedback/recent`, { params })
      .pipe(
        map(response => response.content),
        tap(feedback => {
          console.log('Recent feedback loaded:', feedback);
        }),
        catchError(error => {
          console.error('Error fetching recent feedback:', error);
          throw error;
        })
      );
  }
  
  // Get feedback for a specific car
  getCarFeedback(carId: string): Observable<Feedback[]> {
    return this.getAllFeedback({ carId })
      .pipe(
        map(response => response.feedback)
      );
  }
}