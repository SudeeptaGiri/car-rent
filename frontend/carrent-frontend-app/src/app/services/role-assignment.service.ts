import { Injectable } from '@angular/core';
import { User } from '../models/users';

@Injectable({
  providedIn: 'root'
})
export class RoleAssignmentService {
  private supportAgentsEmails: string[] = [
    'support1@example.com',
    'agent.smith@example.com',
    'anastasia@gmail.com' // for testing
  ];
  
  private adminEmails: string[] = [
    'admin@example.com',
    'admin@carrent.com'
  ];

  constructor() {}

  // Assign role based on email
  assignRole(email: string): 'Admin' | 'Support Agent' | 'Client' {
    const emailLower = email.toLowerCase();
    
    if (this.adminEmails.includes(emailLower)) {
      return 'Admin';
    }
    
    if (this.supportAgentsEmails.includes(emailLower)) {
      return 'Support Agent';
    }
    
    return 'Client';
  }

  // Get current role (for header display)
  getCurrentUserRole(): string {
    const userData = this.getCurrentUser();
    if (!userData) return 'Visitor';
    try {
      return userData?.role || 'Visitor';
    } catch {
      return 'Visitor';
    }
  }
  
  // Check if current user is admin
  isAdmin(): boolean {
    const userData = this.getCurrentUser();
    return userData?.role === 'Admin';
  }
  
  getCurrentUser(): User | null {
    const userData = sessionStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }
  getDisplayName(): string {
    const user = this.getCurrentUser();
    return user ? `${user.firstName}` : 'Visitor';
  }
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }
}
