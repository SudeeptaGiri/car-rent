import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-change-password',
  standalone: false,
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  apiUrl = 'https://qixj9pgekd.execute-api.eu-west-3.amazonaws.com/api';
  passwordForm: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  isSuccess = false;
  errorMessage = '';
  isLoading = false;
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Get user ID from session storage
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.userId = user.id || user._id;
    }
  }

  get currentPassword() {
    return this.passwordForm.get('currentPassword');
  }

  get newPassword() {
    return this.passwordForm.get('newPassword');
  }

  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  changePassword() {
    if (this.passwordForm.invalid || !this.userId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const passwordData = {
      oldPassword: this.currentPassword?.value,
      newPassword: this.newPassword?.value
    };

    // Get token from localStorage
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    this.http.put<any>(`${this.apiUrl}/users/${this.userId}/change-password`, passwordData, { headers })
      .subscribe({
        next: (response) => {
          this.isSuccess = true;
          this.isLoading = false;
          
          // Reset the form after successful change
          this.passwordForm.reset();
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            this.isSuccess = false;
          }, 5000);
        },
        error: (error) => {
          this.isLoading = false;
          
          if (error.status === 401) {
            this.errorMessage = 'The password is wrong. Try another one.';
          } else {
            this.errorMessage = 'Failed to change password. Please try again later.';
          }
        }
      });
  }

  closeAlert() {
    this.isSuccess = false;
  }
}