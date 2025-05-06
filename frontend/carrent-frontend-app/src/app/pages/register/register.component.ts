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
export class RegisterComponent implements OnInit {
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
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator,
        // Use static validator that doesn't depend on 'this'
        RegisterComponent.noEmojiValidator
      ]],
      confirmPassword: ['', [
        Validators.required, 
        // Use static validator that doesn't depend on 'this'
        RegisterComponent.noEmojiValidator
      ]]
    }, {
      validators: this.passwordMatchValidator.bind(this) // Bind this for custom validators
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

  // Static validator method that doesn't use 'this'
  static noEmojiValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    // This regex covers most emoji ranges without using 'this'
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    
    return emojiRegex.test(value) ? { containsEmoji: true } : null;
  }

  // Helper method to detect emojis
  containsEmoji(str: string): boolean {
    // This regex covers most emoji ranges
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(str);
  }

  // Prevent emoji input on keypress
  onKeyPress(event: KeyboardEvent): boolean {
    // Get the character being entered
    const char = String.fromCharCode(event.charCode);
    
    // Check if it's an emoji or non-ASCII character
    if (this.containsEmoji(char) || char.charCodeAt(0) > 127) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // Handle paste events to strip emojis
  onPaste(event: ClipboardEvent, controlName: string): void {
    // Prevent default paste
    event.preventDefault();
    
    // Get clipboard text
    const pastedText = event.clipboardData?.getData('text') || '';
    
    // Remove emojis and non-ASCII characters
    const cleanedText = pastedText.replace(/[^\x00-\x7F]/g, '');
    
    // Get current value and cursor position
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart || 0;
    const currentValue = this.registrationForm.get(controlName)?.value || '';
    
    // Create new value with pasted text inserted at cursor
    const newValue = currentValue.substring(0, cursorPos) + 
                     cleanedText + 
                     currentValue.substring(input.selectionEnd || cursorPos);
    
    // Update form control
    this.registrationForm.get(controlName)?.setValue(newValue);
    
    // Set cursor position after pasted text
    setTimeout(() => {
      const newCursorPos = cursorPos + cleanedText.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    });
  }

  // Handle input to prevent emoji entry
  handlePasswordInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const originalValue = input.value;
    
    // This regex detects common emoji patterns
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    
    // Remove emojis
    const cleanedValue = originalValue.replace(emojiRegex, '');
    
    // Only update if value changed (emoji was removed)
    if (cleanedValue !== originalValue) {
      // Get cursor position
      const cursorPos = input.selectionStart || 0;
      
      // Update form control value
      this.registrationForm.get(controlName)?.setValue(cleanedValue, { emitEvent: false });
      
      // Restore cursor position, adjusted for removed characters
      setTimeout(() => {
        const newPos = Math.max(0, cursorPos - (originalValue.length - cleanedValue.length));
        input.setSelectionRange(newPos, newPos);
      });
    }
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
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  onCancel(): void {
    this.router.navigate(['/main']);
  }

  get f() {
    return this.registrationForm.controls;
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
        
        // If you want to automatically log the user in after registration
        // (since the backend now returns a token on registration)
        // you can navigate directly to a protected route
        // this.router.navigate(['/dashboard']); // or wherever you want to send them
        
        // Or if you still want them to go to login page:
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Registration failed', error);
        // Updated to handle specific API error messages
        if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }

}