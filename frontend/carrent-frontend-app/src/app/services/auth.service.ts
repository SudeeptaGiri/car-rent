import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/users';
import { RoleAssignmentService } from './role-assignment.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: User[] = [
    {
      firstName: 'Anastasia',
      lastName: 'Doe',
      email: 'anastasia@gmail.com',
      password: 'password123',
      role: 'Support Agent'
    }
  ];

  constructor(private http: HttpClient,private roleService: RoleAssignmentService) {}

  // Register a new user
  register(user: User): Observable<any> {
    const existingUser = this.users.find(u => u.email === user.email);

    if (existingUser) {
      return throwError(() => ({ error: { message: 'This email is already registered' } }));
    }
    const role = this.roleService.assignRole(user.email);
    user.role = role;
    // Save new user (mock)
    this.users.push(user);

    // Store session data
    sessionStorage.setItem('ShowPopup', 'true');

    return of({ success: true, message: 'Registration successful' });
  }

  // Login user
  login(email: string, password: string): Observable<any> {
    const user = this.users.find(u => u.email === email );
    if(!user) return throwError(() => ({success: false, message: 'Invalid email'}));
    const passwordMatch = user.password === password;
    if(!passwordMatch) return throwError(() => ({success: false, message: 'Invalid password'}));
    
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

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
  }
}
