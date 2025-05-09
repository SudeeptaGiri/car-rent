import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../models/users';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://nhhdawlrb2.execute-api.eu-west-3.amazonaws.com/api'; // Replace with your actual API endpoint
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Register a new user
  register(user: User): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/sign-up`, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password
    }).pipe(
      tap(response => {
        // Store token on successful registration
        if (response.token) {
          localStorage.setItem('token', response.token);
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        }
        sessionStorage.setItem('ShowPopup', 'true');
      }),
      catchError(error => {
        return throwError(() => error.error || { message: 'Registration failed' });
      })
    );
  }

  // Login user
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/sign-in`, { email, password }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        }
      }),
      catchError(error => {
        return throwError(() => error.error || { message: 'Login failed' });
      })
    );
  }
  
  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/main']);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token; // Returns true if token exists
  }

  // Get current user from session storage
  getCurrentUser(): User | null {
    // First check session storage for cached user data
    const userStr = sessionStorage.getItem('currentUser');
    let user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      return null; // If no user in session storage, return null
    }
    
    // Return the cached user immediately for UI responsiveness
    this.userSubject.next(user);
    
    // Get the user ID
    const userId = user.id || user._id;
    
    if (userId) {
      // Fetch fresh user data from API without auth headers
      this.http.get<any>(`${this.apiUrl}/users/${userId}/personal-info`)
        .subscribe({
          next: (response) => {
            // Map the response to our User model
            const freshUser: User = {
              _id: response.clientId || userId,
              firstName: response.firstName,
              lastName: response.lastName,
              email: response.email,
              role: user.role, // Keep the role from session storage if not in API response
              imageUrl: response.imageUrl,
              phoneNumber: response.phoneNumber,
              address: {
                street: response.street || '',
                city: response.city || '',
                country: response.country || '',
                postalCode: response.postalCode || ''
              },
              // Explicitly exclude password
              password: ''
            };
            
            // Update session storage with fresh data
            sessionStorage.setItem('currentUser', JSON.stringify(freshUser));
            
            // Notify subscribers of updated user data
            this.userSubject.next(freshUser);
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
            // On error, we still have the cached user data
          }
        });
    }
    
    return user;
  }

  // Get authentication token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Helper method to get HTTP options with auth token
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}