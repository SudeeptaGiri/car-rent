import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CarDetailsPopupComponent } from './car-details-popup.component';
import { CarService } from '../../services/car.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import moment from 'moment';
import { CarDetails, BookedDate, ReviewsData } from '../../models/car.interface';

describe('CarDetailsPopupComponent', () => {
  let component: CarDetailsPopupComponent;
  let fixture: ComponentFixture<CarDetailsPopupComponent>;
  let carService: jasmine.SpyObj<CarService>;
  let authService: jasmine.SpyObj<AuthService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CarDetailsPopupComponent>>;

  const mockCarDetails: CarDetails = {
    id: '1',
    brand: 'Toyota',
    model: 'Camry',
    year: 2022,
    price: 50,
    status: 'Available',
    location: 'New York',
    rating: 4.5,
    category: 'Sedan',
    popularity: { rentCount: 10, viewCount: 100, favoriteCount: 5, isPopular: true },
    images: [
      { id: '1', url: 'image1.jpg', isPrimary: true },
      { id: '2', url: 'image2.jpg', isPrimary: false }
    ],
    specifications: {
      transmission: 'Automatic',
      engine: '2.5L',
      fuelType: 'Gasoline',
      seats: 5,
      fuelConsumption: '30 mpg',
      features: ['GPS', 'Bluetooth']
    },
    reviews: {
      content: [
        {
          id: '1',
          userName: 'John',
          userAvatar: 'avatar.jpg',
          rating: 4,
          comment: 'Great car',
          date: '2023-01-01'
        }
      ],
      totalPages: 1,
      currentPage: 0,
      totalElements: 1
    },
    bookedDates: []
  };

  beforeEach(async () => {
    const carServiceSpy = jasmine.createSpyObj('CarService', [
      'getCarDetailsWithNavigation',
      'getNextCar',
      'getPreviousCar'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [CarDetailsPopupComponent],
      imports: [MatIconModule],
      providers: [
        { provide: CarService, useValue: carServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { carId: '1' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CarDetailsPopupComponent);
    component = fixture.componentInstance;
    carService = TestBed.inject(CarService) as jasmine.SpyObj<CarService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CarDetailsPopupComponent>>;
  });

  describe('Initialization', () => {
    it('should handle error when loading car details', fakeAsync(() => {
      carService.getCarDetailsWithNavigation.and.returnValue(throwError(() => new Error('Error')));

      component.ngOnInit();
      tick();

      expect(component.error).toBe('Failed to load car details');
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Car Navigation', () => {
    it('should load next car', fakeAsync(() => {
      const nextCar = { ...mockCarDetails, id: '2' };
      carService.getNextCar.and.returnValue(of(nextCar));

      component.carDetails = mockCarDetails;
      component.currentCarIndex = 0;
      component.onCarPageChange(1);
      tick();

      expect(carService.getNextCar).toHaveBeenCalledWith('1');
      expect(component.carDetails).toEqual(nextCar);
      expect(component.currentCarIndex).toBe(1);
    }));

    it('should load previous car', fakeAsync(() => {
      const prevCar = { ...mockCarDetails, id: '0' };
      carService.getPreviousCar.and.returnValue(of(prevCar));

      component.carDetails = mockCarDetails;
      component.currentCarIndex = 1;
      component.onCarPageChange(0);
      tick();

      expect(carService.getPreviousCar).toHaveBeenCalledWith('1');
      expect(component.carDetails).toEqual(prevCar);
      expect(component.currentCarIndex).toBe(0);
    }));
  });

  describe('Booking', () => {
    it('should show login notification when not logged in', () => {
      authService.isAuthenticated.and.returnValue(false);
      component.carDetails = mockCarDetails;
      component.dateRange = {
        startDate: moment(),
        endDate: moment().add(1, 'day')
      };

      component.bookCar();

      expect(component.showLoginNotification).toBeTrue();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('UI Helpers', () => {
    it('should return the URL of the primary image', () => {
      component.carDetails = mockCarDetails;
      const result = component.getPrimaryImageUrl();
      expect(result).toBe('image1.jpg');
    });

    it('should return an empty string if no primary image is found', () => {
      component.carDetails = { ...mockCarDetails, images: [] };
      const result = component.getPrimaryImageUrl();
      expect(result).toBe('');
    });

    it('should toggle the dropdown state', () => {
      component.isDropdownOpen = false;
      component.toggleDropdown();
      expect(component.isDropdownOpen).toBeTrue();

      component.toggleDropdown();
      expect(component.isDropdownOpen).toBeFalse();
    });

    it('should return correct number of filled and empty stars', () => {
      expect(component.getFilledStars(4)).toHaveSize(4);
      expect(component.getEmptyStars(4)).toHaveSize(1);
    });
  });

  describe('Date Handling', () => {
    it('should return true if the date is within a booked range', () => {
      component.bookedDates = [
        { startDate: '2023-01-01', endDate: '2023-01-05', startTime: '10:00', endTime: '10:00', bookingId: '1', userId: '1', status: 'confirmed' },
        { startDate: '2023-01-10', endDate: '2023-01-15', startTime: '10:00', endTime: '10:00', bookingId: '2', userId: '2', status: 'confirmed' }
      ];

      const result = component.isDateBooked(new Date('2023-01-03'));
      expect(result).toBeTrue();
    });

    it('should return false if the date is not within any booked range', () => {
      component.bookedDates = [
        { startDate: '2023-01-01', endDate: '2023-01-05', startTime: '10:00', endTime: '10:00', bookingId: '1', userId: '1', status: 'confirmed' },
        { startDate: '2023-01-10', endDate: '2023-01-15', startTime: '10:00', endTime: '10:00', bookingId: '2', userId: '2', status: 'confirmed' }
      ];

      const result = component.isDateBooked(new Date('2023-01-06'));
      expect(result).toBeFalse();
    });
  });
});