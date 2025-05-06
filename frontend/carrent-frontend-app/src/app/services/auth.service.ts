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
  private apiUrl = 'https://u852mb2vza.execute-api.eu-west-3.amazonaws.com/api'; // Replace with your actual API endpoint
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
    const userStr = sessionStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    this.userSubject.next(user);
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