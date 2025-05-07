import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/users';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import {jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css'],
  standalone: false
})
export class PersonalInfoComponent implements OnInit {
  apiUrl = 'https://qixj9pgekd.execute-api.eu-west-3.amazonaws.com/api'; 
  userProfile: User = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: {
      country: '',
      city: '',
      postalCode: '',
      street: ''
    },
    imageUrl: ''
  };
  
  profileForm: FormGroup;
  showEditModal = false;
  previewImage: string | null = null;
  isLoading = false;
  userId: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{value: '', disabled: true}],
      phoneNumber: [''],
      country: [''],
      city: [''],
      postalCode: [''],
      street: ['']
    });
  }
  
  ngOnInit(): void {
    this.getUserId();
    if (this.userId) {
      this.loadUserProfile();
    } else {
      this.toastr.error('User ID not found. Please login again.');
    }
  }
  
  getUserId(): void {
    // Try to get user ID from session storage first
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        this.userId = userData._id;
        console.log('User ID from session storage:', this.userId);
        return;
      } catch (e) {
        console.error('Error parsing currentUser from session storage:', e);
      }
    }
    
    // If not in session storage, try to get from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode (token);
        this.userId = decodedToken.userId;
        console.log('User ID from JWT token:', this.userId);
        return;
      } catch (e) {
        console.error('Error decoding JWT token:', e);
      }
    }
    
    // If still not found, try auth service
    const authUser = this.authService.getCurrentUser?.();
    if (authUser && authUser._id) {
      this.userId = authUser._id;
      console.log('User ID from auth service:', this.userId);
      return;
    }
    
    console.error('Could not find user ID from any source');
  }
  
  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  
  loadUserProfile(): void {
    this.isLoading = true;
    
    // Try to get basic info from session storage
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        this.userProfile.firstName = userData.firstName || '';
        this.userProfile.lastName = userData.lastName || '';
        this.userProfile.email = userData.email || '';
        this.userProfile._id = userData.id || '';
      } catch (e) {
        console.error('Error parsing currentUser from session storage:', e);
      }
    }
    
    // Then fetch complete profile from API
    console.log(`Fetching user data from: ${this.apiUrl}/users/${this.userId}/personal-info`);
    
    const headers = this.getAuthHeaders();
    
    this.http.get<any>(`${this.apiUrl}/users/${this.userId}/personal-info`, { headers })
      .subscribe({
        next: (response) => {
          console.log('API response:', response);
          this.setUserProfile(response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.toastr.error('Failed to load profile information');
          this.isLoading = false;
        }
      });
  }
  
  setUserProfile(data: any): void {
    // Handle different response formats from API
    this.userProfile = {
      firstName: data.firstName || this.userProfile.firstName,
      lastName: data.lastName || this.userProfile.lastName,
      email: data.email || this.userProfile.email,
      password: '',
      phoneNumber: data.phoneNumber || '',
      address: {
        street: data.street || '',
        city: data.city || '',
        country: data.country || '',
        postalCode: data.postalCode || ''
      },
      imageUrl: data.imageUrl || '',
      _id: data.clientId || data._id || this.userId
    };
  }
  
  openEditModal(): void {
    this.previewImage = null;
    
    // Initialize form with current user profile data
    this.profileForm.patchValue({
      firstName: this.userProfile.firstName,
      lastName: this.userProfile.lastName,
      email: this.userProfile.email,
      phoneNumber: this.userProfile.phoneNumber,
      country: this.userProfile.address?.country,
      city: this.userProfile.address?.city,
      postalCode: this.userProfile.address?.postalCode,
      street: this.userProfile.address?.street
    });
    
    this.showEditModal = true;
  }
  
  closeEditModal(): void {
    this.showEditModal = false;
  }
  
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Read the selected image and convert to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  saveChanges(): void {
    if (this.profileForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const formValues = this.profileForm.getRawValue();
    
    const updatedProfile = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      phoneNumber: formValues.phoneNumber,
      street: formValues.street,
      city: formValues.city,
      country: formValues.country,
      postalCode: formValues.postalCode,
      imageUrl: this.previewImage || this.userProfile.imageUrl
    };
    
    console.log('Sending update to API:', updatedProfile);
    
    this.isLoading = true;
    const headers = this.getAuthHeaders();
    
    this.http.put<any>(`${this.apiUrl}/users/${this.userId}/personal-info`, updatedProfile, { headers })
      .subscribe({
        next: (response) => {
          console.log('Update response:', response);
          
          // Update local user profile with response data
          this.setUserProfile(response);
          
          // Also update in sessionStorage
          try {
            const storedUser = sessionStorage.getItem('currentUser');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              const updatedUser = {
                ...userData,
                firstName: response.firstName || this.userProfile.firstName,
                lastName: response.lastName || this.userProfile.lastName
              };
              sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.error('Error updating sessionStorage:', e);
          }
          
          this.toastr.success('Profile updated successfully');
          this.isLoading = false;
          this.closeEditModal();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.toastr.error('Failed to update profile');
          this.isLoading = false;
        }
      });
  }
  
  changePassword(): void {
    // Navigate to password change page or open password change modal
    this.router.navigate(['/change-password']);
  }
}