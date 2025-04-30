import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/users';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registrationForm: FormGroup;
  submitted = false;
  registrationSuccess = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registrationForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
      email: ['', [
        Validators.required,
        Validators.email,
        this.emailFormatValidator
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void { }

  emailFormatValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    const emailPattern = /^[a-z0-9](\.?[a-z0-9]+)*@[a-z0-9-]+\.[a-z]{2,}$/;
   
    if (!emailPattern.test(email)) {
      return { invalidEmailFormat: true };
    }
   
    return null;
  }

  // Custom validator for password strength
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasDigit = /[0-9]/.test(value);

    if (!hasUpperCase || !hasDigit) {
      return {
        passwordStrength: {
          hasUpperCase: !hasUpperCase,
          hasDigit: !hasDigit
        }
      };
    }

    return null;
  }

  // Custom validator for password match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else if (confirmPassword?.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }

    return null;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registrationForm.invalid) {
      return;
    }

    const user: User = {
      firstName: this.registrationForm.value.firstName,
      lastName: this.registrationForm.value.lastName,
      email: this.registrationForm.value.email,
      password: this.registrationForm.value.password,
    };

    this.authService.register(user).subscribe({
      next: (response) => {
        console.log('Registration successful', response);
        this.registrationSuccess = true;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Registration failed', error);
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  onCancel(){
    this.router.navigate(['/main']);
  }

  get f() {
    return this.registrationForm.controls;
  }
}
