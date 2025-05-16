// // services/feedback.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
// import { Observable, BehaviorSubject, throwError } from 'rxjs';
// import { map, tap, catchError } from 'rxjs/operators';
// import { Feedback, FeedbackResponse, FeedbackListResponse, RecentFeedbackResponse } from '../models/feedback.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class FeedbackService {
//   private apiUrl = "https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api";
//   private feedbackSubject = new BehaviorSubject<Feedback[]>([]);

//   constructor(private http: HttpClient) {}

//   get feedback$(): Observable<Feedback[]> {
//     return this.feedbackSubject.asObservable();
//   }

//   submitFeedback(feedbackData: {
//     carId: string;
//     clientId: string;
//     bookingId: string;
//     author: string;
//     authorImageUrl?: string;
//     carRating: number;
//     serviceRating: number;
//     feedbackText: string;
//   }): Observable<FeedbackResponse> {
//     return this.http.post<FeedbackResponse>(`${this.apiUrl}/feedbacks`, feedbackData)
//       .pipe(
//         tap(response => {
//           console.log('Feedback submitted successfully:', response);
//         }),
//         catchError((error: HttpErrorResponse) => {
//           console.error('Error submitting feedback:', error);

//           let errorMessage = 'Failed to submit feedback. Please try again.';

//           if (error.error && error.error.message) {
//             errorMessage = error.error.message;

//             if (errorMessage.includes('completed bookings')) {
//               errorMessage = 'Feedback can only be submitted for completed bookings. Please wait until your booking is marked as completed.';
//             }
//           }

//           return throwError(() => ({ 
//             message: errorMessage, 
//             originalError: error 
//           }));
//         })
//       );
//   }

//   getAllFeedback(params?: {
//     carId?: string;
//     clientId?: string;
//     minRating?: number;
//     limit?: number;
//     page?: number;
//   }): Observable<FeedbackListResponse> {
//     let httpParams = new HttpParams();

//     if (params) {
//       if (params.carId) httpParams = httpParams.set('carId', params.carId);
//       if (params.clientId) httpParams = httpParams.set('clientId', params.clientId);
//       if (params.minRating) httpParams = httpParams.set('minRating', params.minRating.toString());
//       if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
//       if (params.page) httpParams = httpParams.set('page', params.page.toString());
//     }

//     return this.http.get<FeedbackListResponse>(`${this.apiUrl}/feedbacks`, { params: httpParams })
//       .pipe(
//         tap(response => {
//           const feedbackArray = response.feedback || response.content || [];
//           this.feedbackSubject.next(feedbackArray);
//         }),
//         catchError(error => {
//           console.error('Error fetching feedback:', error);
//           return throwError(() => error);
//         })
//       );
//   }

//   getRecentFeedback(limit: number = 5): Observable<Feedback[]> {
//     const params = new HttpParams().set('limit', limit.toString());

//     return this.http.get<RecentFeedbackResponse>(`${this.apiUrl}/feedbacks/recent`, { params })
//       .pipe(
//         map(response => response.feedback || response.content || []),
//         tap(feedback => {
//           console.log('Recent feedback loaded:', feedback);
//         }),
//         catchError(error => {
//           console.error('Error fetching recent feedback:', error);
//           return throwError(() => error);
//         })
//       );
//   }

//   getCarFeedback(carId: string): Observable<Feedback[]> {
//     return this.getAllFeedback({ carId })
//       .pipe(
//         map(response => response.feedback || response.content || [])
//       );
//   }
// }



//DONE BY SOURABH

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Feedback,
  FeedbackListResponse,
  RecentFeedbackResponse
} from '../models/feedback.model';


@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private feedbackUrl = 'https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api/feedbacks';
  private recentFeedbackUrl = 'https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api/feedbacks/recent';

  constructor(private http: HttpClient) {}

  getAllFeedback(): Observable<FeedbackListResponse> {
    return this.http.get<FeedbackListResponse>(this.feedbackUrl);
  }

  getRecentFeedback(): Observable<RecentFeedbackResponse> {
    return this.http.get<RecentFeedbackResponse>(this.recentFeedbackUrl);
  }

  // getCarFeedback(carDetails: string): Observable<Feedback[]> {
  //   return this.http.get<Feedback[]>(`${this.feedbackUrl}?carDetails=${encodeURIComponent(carDetails)}`);
  // }
    getCarFeedback(carId: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.feedbackUrl}/car/${carId}`);
  }

  submitFeedback(feedbackData: Feedback): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.feedbackUrl, feedbackData, { headers });
  }
}
