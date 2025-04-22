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

  constructor() {}

  // Assign role based on email
  assignRole(email: string): 'Support Agent' | 'Client' {
    const isAgent = this.supportAgentsEmails.includes(email.toLowerCase());
    return isAgent ? 'Support Agent' : 'Client';
  }

  // Get current role (for header display)
  getCurrentUserRole(): string {
    const userData = this.getCurrentUser();
    console.log('Current user data:', userData);
    if (!userData) return 'Visitor';
    try {
      return userData?.role || 'Visitor';
    } catch {
      return 'Visitor';
    }
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
