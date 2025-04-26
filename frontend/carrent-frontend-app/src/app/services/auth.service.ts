import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { User } from '../models/users';
import { RoleAssignmentService } from './role-assignment.service';
import { Router } from '@angular/router';
import { BookingService } from './booking.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: User[] = [];

  constructor(
    private http: HttpClient,
    private roleService: RoleAssignmentService,
    private router: Router,
    private bookingService: BookingService
  ) {
    const storedUsers = localStorage.getItem('registeredUsers');
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
    } else {
      // Optional: preload with a default user
      this.users = [
        {
          firstName: 'Anastasia',
          lastName: 'Doe',
          email: 'anastasia@gmail.com',
          password: 'Password123',
          role: 'Support Agent'
        }
      ];
      this.saveUsersToStorage();
    }
  }

  logout(): void {
    this.bookingService.clearUserBookings(); // Clear user-specific bookings
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/main']);
  }

  private saveUsersToStorage() {
    localStorage.setItem('registeredUsers', JSON.stringify(this.users));
  }

  // Register a new user
  register(user: User): Observable<any> {
    const existingUser = this.users.find(u => u.email === user.email);
    if (existingUser) {
      return throwError(() => ({ error: { message: 'This email is already registered' } }));
    }

    const role = this.roleService.assignRole(user.email);
    user.role = role;

    this.users.push(user);
    this.saveUsersToStorage();

    sessionStorage.setItem('ShowPopup', 'true');

    return of({ success: true, message: 'Registration successful' });
  }

  // Login user
  login(email: string, password: string): Observable<any> {
    const user = this.users.find(u => u.email === email );
    if (!user) {
      return throwError(() => ({ success: false, message: 'Invalid email' }));
    }

    if (user.password !== password) {
      return throwError(() => ({ success: false, message: 'Invalid password' }));
    }

    localStorage.setItem('token', 'demo-jwt-token');
    sessionStorage.setItem('currentUser', JSON.stringify(user));

    return of({
      success: true,
      message: 'Login successful',
      token: 'demo-jwt-token',
      user
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
