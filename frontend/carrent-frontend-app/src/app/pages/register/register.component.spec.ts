// Component creation

// Form validation

// Custom validators

// Visibility toggles

// Form submission logic including success and error scenarios

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/users';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the RegisterComponent', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when empty', () => {
    expect(component.registrationForm.valid).toBeFalse();
  });

  it('should validate firstName and lastName', () => {
    const firstName = component.registrationForm.controls['firstName'];
    const lastName = component.registrationForm.controls['lastName'];

    firstName.setValue('John');
    lastName.setValue('Doe123');

    expect(firstName.valid).toBeTrue();
    expect(lastName.valid).toBeFalse(); // because of pattern
  });

  it('should validate email format', () => {
    const email = component.registrationForm.controls['email'];

    email.setValue('invalid-email');
    expect(email.valid).toBeFalse();

    email.setValue('valid@email.com');
    expect(email.valid).toBeTrue();
  });

  it('should validate password strength', () => {
    const password = component.registrationForm.controls['password'];

    password.setValue('weakpass');
    expect(password.errors?.['passwordStrength']).toBeTruthy();

    password.setValue('Strong1Pass');
    expect(password.errors).toBeNull();
  });

  it('should validate password and confirmPassword match', () => {
    const password = component.registrationForm.controls['password'];
    const confirmPassword = component.registrationForm.controls['confirmPassword'];

    password.setValue('Strong1Pass');
    confirmPassword.setValue('Mismatch');

    component.registrationForm.updateValueAndValidity();

    expect(component.registrationForm.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.showConfirmPassword).toBeFalse();
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBeTrue();
  });

  it('should call authService.register on valid form submit', fakeAsync(() => {
    component.registrationForm.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password1',
      confirmPassword: 'Password1'
    });

    authServiceSpy.register.and.returnValue(of({ success: true }));

    component.onSubmit();
    tick();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password1'
    } as User);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.registrationSuccess).toBeTrue();
  }));

  it('should handle registration error', fakeAsync(() => {
    component.registrationForm.setValue({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'Password1',
      confirmPassword: 'Password1'
    });

    const errorResponse = {
      error: { message: 'Email already in use' }
    };

    authServiceSpy.register.and.returnValue(throwError(() => errorResponse));

    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Email already in use');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

});
