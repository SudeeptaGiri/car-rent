// login.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/users';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class MockAuthService {
  login(email: string, password: string) {
    if (email === 'test@example.com' && password === 'password123') {
      return of({
        token: 'mockToken',
        user: {
          id: 1,
          firstName: 'Test',
          lastName: 'User',
          email: email,
          password: password,
          favorites: [],
          recipes: []
        } as User
      });
    } else {
      return throwError(() => new Error('Invalid credentials'));
    }
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize loginForm with empty fields', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should make loginForm invalid when fields are empty', () => {
    component.loginForm.setValue({ email: '', password: '' });
    expect(component.loginForm.invalid).toBeTrue();
  });

  it('should validate email format', () => {
    component.loginForm.setValue({ email: 'invalid', password: 'pass' });
    expect(component.loginForm.get('email')?.valid).toBeFalse();
  });

  it('should submit the form and call AuthService on valid credentials', fakeAsync(() => {
    const spy = spyOn(authService, 'login').and.callThrough();
    spyOn(localStorage, 'setItem');
    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    tick();
    expect(spy).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mockToken');
  }));

  it('should show error message for invalid login', fakeAsync(() => {
    component.loginForm.setValue({ email: 'wrong@example.com', password: 'wrong' });
    component.onSubmit();
    tick();
    expect(component.errorMessage).toBe('Invalid credentials');
  }));

  it('should not call AuthService if form is invalid', () => {
    const spy = spyOn(authService, 'login').and.callThrough();
    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it('should reset form correctly', () => {
    component.loginForm.setValue({ email: 'abc@test.com', password: '123' });
    component.resetForm();
    expect(component.loginForm.value).toEqual({ email: null, password: null });
    expect(component.submitted).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('should show success popup if ShowPopup is in sessionStorage', fakeAsync(() => {
    sessionStorage.setItem('ShowPopup', 'true');
    component.ngOnInit();
    tick(5000);
    expect(component.registrationSuccess).toBeFalse();
    expect(sessionStorage.getItem('ShowPopup')).toBeNull();
  }));
});
