import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
      email: ['', [Validators.required, Validators.email]],
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

    // Clear any previous session (optional)
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
  
    if (this.loginForm.invalid) {
      return;
    }
  
    const { email, password } = this.loginForm.value;
  
    this.authService.login(email, password).subscribe({
      next: (response: { token: string, user: User }) => {
        console.log('Login successful', response);
  
        // Save token and full user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login failed', error.message);
  
        // Directly get the message from the thrown error
        this.errorMessage = error.message || 'Login failed. Please try again.';
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
