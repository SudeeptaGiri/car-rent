import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/users';
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  errorMessage = '';
  showPassword = false;
  registrationSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required, 
        Validators.email,
        this.emailFormatValidator
      ]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Show popup if redirected from registration
    this.route.queryParams.subscribe(() => {
      if (sessionStorage.getItem('ShowPopup')) {
        this.registrationSuccess = true;
        setTimeout(() => {
          this.registrationSuccess = false;
          sessionStorage.removeItem('ShowPopup');
        }, 5000);
      }
    });
    
    // Remove these lines as they're no longer needed
    // localStorage.removeItem('token');
    // localStorage.removeItem('currentUser');
  }

  emailFormatValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;

    const emailPattern = /^[a-z0-9](\.?[a-z0-9]+)*@[a-z0-9-]+\.[a-z]{2,}$/;
    
    if (!emailPattern.test(email)) {
      return { invalidEmailFormat: true };
    }
    
    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
  
    if (this.loginForm.invalid) {
      return;
    }
  
    const { email, password } = this.loginForm.value;
  
    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        
        // Get the user's role from the response or from the auth service
        const user = this.authService.getCurrentUser();
        
        if (user) {
          // Redirect based on user role
          switch (user.role) {
            case 'Client':
              this.router.navigate(['/main']);
              break;
            case 'SupportAgent':
              this.router.navigate(['/bookings']);
              break;
            case 'Admin':
              this.router.navigate(['/dashboard']);
              break;
            default:
              // Default redirect if role is unknown
              this.router.navigate(['/']);
              break;
          }
        } else {
          // Fallback if user info is not immediately available
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Login failed', error);
        
        // Handle specific error messages from the API
        if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get f() {
    return this.loginForm.controls;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.f[fieldName];
    return this.submitted && field.invalid;
  }

  resetForm(): void {
    this.loginForm.reset();
    this.submitted = false;
    this.errorMessage = '';
  }
}
