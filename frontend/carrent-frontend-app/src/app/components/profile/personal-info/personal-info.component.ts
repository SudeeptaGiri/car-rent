import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface UserProfile {
  name: string;
  surname: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  postalCode: string;
  street: string;
  imageUrl: string;
}

@Component({
  selector: 'app-personal-info',
  standalone: false,
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css']
})
export class PersonalInfoComponent implements OnInit {
  userProfile: UserProfile = {
    name: '',
    surname: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    postalCode: '',
    street: '',
    imageUrl: ''
  };
  
  editedProfile: UserProfile;
  profileForm: FormGroup;
  showEditModal = false;
  previewImage: string | null = null;
  private readonly STORAGE_KEY = 'user_profile';
  
  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: [''],
      surname: [''],
      email: [''],
      phone: [''],
      country: [''],
      city: [''],
      postalCode: [''],
      street: ['']
    });
    
    this.editedProfile = { ...this.userProfile };
  }
  
  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  loadUserProfile(): void {
    const savedProfile = localStorage.getItem(this.STORAGE_KEY);
    if (savedProfile) {
      this.userProfile = JSON.parse(savedProfile);
    }
  }
  
  openEditModal(): void {
    this.editedProfile = { ...this.userProfile };
    this.previewImage = null;
    
    // Initialize form with current user profile data
    this.profileForm.patchValue({
      name: this.userProfile.name,
      surname: this.userProfile.surname,
      email: this.userProfile.email,
      phone: this.userProfile.phone,
      country: this.userProfile.country,
      city: this.userProfile.city,
      postalCode: this.userProfile.postalCode,
      street: this.userProfile.street
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
    const formValues = this.profileForm.value;
    
    // Update the user profile with form values and image
    this.userProfile = {
      ...this.userProfile,
      ...formValues,
      imageUrl: this.previewImage || this.userProfile.imageUrl
    };
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    // Close the modal
    this.closeEditModal();
  }
  
  saveToLocalStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.userProfile));
  }
}