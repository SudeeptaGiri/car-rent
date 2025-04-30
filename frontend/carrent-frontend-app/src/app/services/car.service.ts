import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  CarDetails,
  CarListResponse,
  CarsResponse,
  BookedDate,
  ReviewsData,
  BookingRequest,
  CarImage
} from '../models/car.interface';
import { Booking, BookingStatus, UserInfo, LocationInfo } from '../models/booking.model';
import { MatDialog } from '@angular/material/dialog';
import { CarReservedDialogComponent } from '../components/car-reserved-dialog/car-reserved-dialog.component';
import { BookingSuccessDialogComponent } from '../components/booking-success-dialog/booking-success-dialog.component';
import { Router } from '@angular/router';
import { BehaviorSubject, interval } from 'rxjs';

import * as moment from 'moment';
import { FormGroup } from '@angular/forms';

export interface LocationSuggestion {
  displayName: string;
  lat: number;
  lon: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private jsonUrl = 'assets/cars.json';
  private readonly STORAGE_KEY = 'bookings';
  private bookings: Booking[] = [];
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  bookings$ = this.bookingsSubject.asObservable()
  
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadBookingsForCurrentUser();
    if (this.bookings.length === 0) {
      this.loadSampleBookings(); 
    }
    interval(1000).subscribe(() => this.updateBookingStatuses());
  }
  submitFeedback(bookingId: string, rating: number, comment: string): void {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].feedback = {
        rating,
        comment,
        submittedAt: new Date()
      };
      this.bookings[bookingIndex].status = BookingStatus.BOOKING_FINISHED;
      this.bookingsSubject.next([...this.bookings]);
    }
  }
  private loadBookingsForCurrentUser(): void {
    const storageKey = this.getStorageKeyForUser();
    const storedBookings = localStorage.getItem(storageKey);
    console.log('Loading bookings with key:', storageKey);
    
    if (storedBookings) {
        try {
            const parsedBookings = JSON.parse(storedBookings);
            this.bookings = parsedBookings.map((booking: any) => ({
                ...booking,
                pickupDate: new Date(booking.pickupDate),
                dropoffDate: new Date(booking.dropoffDate),
                feedback: booking.feedback ? {
                    ...booking.feedback,
                    submittedAt: new Date(booking.feedback.submittedAt)
                } : undefined
            }));
            
            // Update booking statuses and emit
            this.updateBookingStatuses();
            this.bookingsSubject.next(this.bookings);
            
            console.log('Loaded bookings:', this.bookings);
        } catch (error) {
            console.error('Error parsing bookings:', error);
            this.bookings = [];
            this.bookingsSubject.next([]); 
        }
    } else {
        this.bookings = [];
        this.bookingsSubject.next([]); 
    }
}
  private loadSampleBookings(): void {
    // Booking 4: Cancelled booking
    const pickup4 = new Date('2025-04-15T10:00:00');
    const dropoff4 = new Date('2025-04-20T16:00:00');
    
    // Booking 5: Service provided (both dates in past)
    const pickup5 = new Date('2025-04-12T15:00:00');
    const dropoff5 = new Date('2025-04-17T16:00:00');
    
    // Booking 6: Booking finished with feedback
    const pickup6 = new Date('2025-04-07T10:00:00');
    const dropoff6 = new Date('2025-04-12T16:00:00');
    const feedbackDate = new Date('2025-04-13T12:00:00');
    
    this.bookings = [
      {
        id: '4',
        carId: '104',
        carName: 'Nissan Z 2024',
        carImage: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80",
        orderNumber: '#2440',
        pickupDate: pickup4,
        dropoffDate: dropoff4,
        status: BookingStatus.CANCELLED,
        totalPrice:900,
        numberOfDays:5,
        pickupLocation: 'Hyderabad',
        dropoffLocation: 'Chennai'
      },
      {
        id: '5',
        carId: '105',
        carName: 'Mercedes-Benz A class 2019',
        carImage: 'assets/Car7.svg',
        orderNumber: '#2452',
        pickupDate: pickup5,
        dropoffDate: dropoff5,
        status: BookingStatus.SERVICE_PROVIDED,
        totalPrice:900,
        numberOfDays:5,
        pickupLocation: 'Hyderabad',
        dropoffLocation: 'Chennai'
      },
      {
        id: '6',
        carId: '106',
        carName: 'BMW 330i 2020',
        carImage: "https://images.unsplash.com/photo-1551830820-330a71b99659?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80",
        orderNumber: '#2437',
        pickupDate: pickup6,
        dropoffDate: dropoff6,
        status: BookingStatus.BOOKING_FINISHED,
        feedback: {
          rating: 5,
          comment: 'Great car, excellent service!',
          submittedAt: feedbackDate
        },
        totalPrice:900,
        numberOfDays:5,
        pickupLocation: 'Hyderabad',
        dropoffLocation: 'Chennai'
      }
    ];
    
    // Initialize the status based on current date
    this.updateBookingStatuses();
    
    // Emit the initial bookings
    this.bookingsSubject.next([...this.bookings]);
}

  private saveBookingsToStorage(): void {
    const storageKey = this.getStorageKeyForUser();
    localStorage.setItem(storageKey, JSON.stringify(this.bookings));
  }

  getBookings(): Observable<Booking[]> {
    if (this.bookings.length === 0) {
      this.loadBookingsForCurrentUser();
  }
    return this.bookingsSubject.asObservable();
  }

  addBooking(booking: Booking): Observable<Booking> {
    return new Observable<Booking>(observer => {
      try {
        // Add to internal array
        this.bookings.push(booking);
        // Save to localStorage with the correct key
        const storageKey = this.getStorageKeyForUser();
        const existingBookingsStr = localStorage.getItem(storageKey);
        const existingBookings: Booking[] = existingBookingsStr ? JSON.parse(existingBookingsStr) : [];
        existingBookings.push(booking);
        
        // Save updated bookings
        localStorage.setItem(storageKey, JSON.stringify(existingBookings));
        
        // Save to localStorage
        this.saveBookingsToStorage();
        
        // Emit updated bookings
        this.bookingsSubject.next([...this.bookings]);
        
        observer.next(booking);
        observer.complete();
      } catch (error) {
        console.error('Error adding booking:', error);
        observer.error(error);
      }
    });
  }

  cancelBooking(bookingId: string): void {
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex !== -1) {
        this.bookings[bookingIndex].status = BookingStatus.CANCELLED;
        this.saveBookingsToStorage();
        this.bookingsSubject.next([...this.bookings]);
    }
}

  private updateBookingStatuses(): void {
    const now = new Date();
    let updated = false;
    
    this.bookings.forEach(booking => {
      if (booking.status === BookingStatus.CANCELLED) return;
      
      if (now < booking.pickupDate) {
        if (booking.status !== BookingStatus.RESERVED) {
          booking.status = BookingStatus.RESERVED;
          updated = true;
        }
      } else if (now >= booking.pickupDate && now < booking.dropoffDate) {
        if (booking.status !== BookingStatus.SERVICE_STARTED) {
          booking.status = BookingStatus.SERVICE_STARTED;
          updated = true;
        }
      } else if (now >= booking.dropoffDate) {
        if (booking.status !== BookingStatus.SERVICE_PROVIDED && 
            booking.status !== BookingStatus.BOOKING_FINISHED) {
          booking.status = BookingStatus.SERVICE_PROVIDED;
          updated = true;
        }
      }
      
      if (booking.status === BookingStatus.SERVICE_PROVIDED && booking.feedback) {
        booking.status = BookingStatus.BOOKING_FINISHED;
        updated = true;
      }
    });
    
    if (updated) {
      this.saveBookingsToStorage();
      this.bookingsSubject.next([...this.bookings]);
    }
  }

  confirmReservation(
    formValid: boolean, 
    selectedCar: CarDetails, 
    dateFrom: Date, 
    dateTo: Date, 
    totalPrice: number, 
    numberOfDays: number, 
    pickupLocation: string, 
    dropoffLocation: string
): void {
    if (formValid && selectedCar) {
        const bookingId = `booking-${Date.now()}`;
        const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;
        
        const newBooking: Booking = {
            id: bookingId,
            carId: selectedCar.id,
            carName: `${selectedCar.brand} ${selectedCar.model} ${selectedCar.year}`,
            carImage: typeof selectedCar.images[0] === 'string' 
                ? selectedCar.images[0] 
                : selectedCar.images[0].url, // Convert CarImage to string
            orderNumber,
            pickupDate: dateFrom,
            dropoffDate: dateTo,
            status: BookingStatus.RESERVED,
            totalPrice,
            numberOfDays,
            pickupLocation,
            dropoffLocation
        };

        this.addBooking(newBooking).subscribe({
            next: () => {
                this.showBookingSuccessDialog(selectedCar, dateFrom, dateTo, totalPrice, numberOfDays);
                this.router.navigate(['/my-bookings']);
            },
            error: (error) => {
                console.error('Booking failed:', error);
                alert('Booking failed. Please try again.');
            }
        });
    }
}
  // ==================== CAR DATA METHODS ====================

  private getStorageKeyForUser(): string {
    const currentUser = this.getUserFromLocalStorage();
    const userEmail = currentUser?.email;
    return userEmail ? `${this.STORAGE_KEY}_${userEmail}` : this.STORAGE_KEY;
  }

  getAllCars(page: number = 0): Observable<CarListResponse> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        return {
          content: allCars,
          totalPages: 1,
          currentPage: 0,
          totalElements: allCars.length
        };
      })
    );
  }

  getCarDetails(carId: string): Observable<CarDetails | undefined> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => response.cars.find(car => car.id === carId))
    );
  }
 
  getCarDetailsWithNavigation(carId: string): Observable<{
    car: CarDetails | undefined,
    totalCars: number,
    currentIndex: number
  }> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        const currentIndex = allCars.findIndex(car => car.id === carId);
        const car = allCars[currentIndex];
        
        return {
          car,
          totalCars: allCars.length,
          currentIndex
        };
      })
    );
  }

  getNextCar(currentId: string): Observable<CarDetails | undefined> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        const currentIndex = allCars.findIndex(car => car.id === currentId);
        return allCars[currentIndex + 1];
      })
    );
  }

  getPreviousCar(currentId: string): Observable<CarDetails | undefined> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const allCars = response.cars;
        const currentIndex = allCars.findIndex(car => car.id === currentId);
        return allCars[currentIndex - 1];
      })
    );
  }

  getCarBookedDates(carId: string): Observable<BookedDate[]> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const car = response.cars.find(c => c.id === carId);
        return car ? car.bookedDates : [];
      })
    );
  }

  getCarReviews(carId: string): Observable<ReviewsData> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const car = response.cars.find(c => c.id === carId);
        return car ? car.reviews : { content: [], totalPages: 0, currentPage: 0, totalElements: 0 };
      })
    );
  }

  createBooking(bookingRequest: BookingRequest): Observable<any> {
    return this.http.get<CarsResponse>(this.jsonUrl).pipe(
      map(response => {
        const car = response.cars.find(c => c.id === bookingRequest.carId);
        if (car) {
          // Add new booking to car's bookedDates
          const newBookedDate: BookedDate = {
            startDate: bookingRequest.startDate,
            startTime: bookingRequest.startTime,
            endDate: bookingRequest.endDate,
            endTime: bookingRequest.endTime,
            bookingId: `booking${Date.now()}`,
            userId: bookingRequest.userId,
            status: 'pending' as 'pending' | 'confirmed' | 'completed' // Type assertion to match union type
          };
          
          car.bookedDates.push(newBookedDate);
          
          // Get existing bookings and add new one
          const storageKey = this.getStorageKeyForUser();
          const existingBookingsStr = localStorage.getItem(storageKey);
          const existingBookings: Booking[] = existingBookingsStr ? JSON.parse(existingBookingsStr) : [];
          
          localStorage.setItem(storageKey, JSON.stringify(existingBookings));
        }
        return bookingRequest;
      })
    );
  }

  // ==================== LOCATION METHODS ====================
   // Handle search input for pickup location
   onPickupSearchInput(
    pickupSearchSubject: Subject<string>,
    query: string,
    showPickupSuggestions: { value: boolean }
  ): void {
    showPickupSuggestions.value = true;
    pickupSearchSubject.next(query);
  }
  
  // Handle search input for dropoff location
  onDropoffSearchInput(
    dropoffSearchSubject: Subject<string>,
    query: string,
    showDropoffSuggestions: { value: boolean }
  ): void {
    showDropoffSuggestions.value = true;
    dropoffSearchSubject.next(query);
  }
  
  // Handle selection of pickup location
  selectPickupLocation(
    suggestion: LocationSuggestion,
    component: {
      selectedPickupLocation: string | null,
      pickupSearchQuery: string,
      showPickupSuggestions: boolean,
      showPickupModal: boolean,
      bookingForm: FormGroup
    }
  ): void {
    component.selectedPickupLocation = suggestion.displayName;
    component.pickupSearchQuery = suggestion.displayName;
    component.showPickupSuggestions = false;
    component.showPickupModal = false;
    component.bookingForm.patchValue({
      location: {
        pickupLocation: suggestion.displayName
      }
    });
  }
  
  // Handle selection of dropoff location
  selectDropoffLocation(
    suggestion: LocationSuggestion,
    component: {
      selectedDropoffLocation: string | null,
      dropoffSearchQuery: string,
      showDropoffSuggestions: boolean,
      showDropoffModal: boolean,
      bookingForm: FormGroup
    }
  ): void {
    component.selectedDropoffLocation = suggestion.displayName;
    component.dropoffSearchQuery = suggestion.displayName;
    component.showDropoffSuggestions = false;
    component.showDropoffModal = false;
    component.bookingForm.patchValue({
      location: {
        dropoffLocation: suggestion.displayName
      }
    });
  }
  
  // Handle using current location
  useCurrentLocation(
    forPickup: boolean,
    component: {
      selectedPickupLocation?: string | null,
      selectedPickupCoordinates?: { lat: number; lon: number } | null,
      pickupSearchQuery?: string,
      showPickupModal?: boolean,
      selectedDropoffLocation?: string | null,
      selectedDropoffCoordinates?: { lat: number; lon: number } | null,
      dropoffSearchQuery?: string,
      showDropoffModal?: boolean,
      bookingForm: FormGroup
    }
  ): void {
    this.getCurrentLocation(
      (coords, address) => {
        if (forPickup) {
          component.selectedPickupLocation = address;
          component.selectedPickupCoordinates = coords;
          component.pickupSearchQuery = address;
          component.showPickupModal = false;
          
          // Update form with new location
          component.bookingForm.get('location')?.patchValue({
            pickupLocation: address
          });
        } else {
          component.selectedDropoffLocation = address;
          component.selectedDropoffCoordinates = coords;
          component.dropoffSearchQuery = address;
          component.showDropoffModal = false;
          
          // Update form with new location
          component.bookingForm.get('location')?.patchValue({
            dropoffLocation: address
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert(typeof error === 'string' ? error : 'Could not access your location. Please check your browser permissions and try again.');
      }
    );
  }
  
  // Handle opening location modal
  openLocationModal(
    forPickup: boolean,
    component: {
      showPickupModal: boolean,
      showDropoffModal: boolean,
      selectedPickupLocation?: string | null,
      pickupSearchQuery?: string,
      selectedDropoffLocation?: string | null,
      dropoffSearchQuery?: string
    }
  ): void {
    if (forPickup) {
      component.showPickupModal = true;
      component.showDropoffModal = false;
      component.pickupSearchQuery = component.selectedPickupLocation || '';
    } else {
      component.showPickupModal = false;
      component.showDropoffModal = true;
      component.dropoffSearchQuery = component.selectedDropoffLocation || '';
    }
  }
  
  // Handle closing location modal
  closeLocationModal(
    component: {
      showPickupModal: boolean,
      showDropoffModal: boolean
    }
  ): void {
    component.showPickupModal = false;
    component.showDropoffModal = false;
  }

  // Handle calendar toggle
  toggleCalendar(
    component: {
      isCalendarOpen: boolean
    }
  ): void {
    component.isCalendarOpen = !component.isCalendarOpen;
  }

  // Handle date range selection
  onDateRangeSelected(
    event: {startDate: moment.Moment, endDate: moment.Moment},
    component: {
      dateFrom: Date,
      dateTo: Date,
      bookingForm: FormGroup,
      calculateTotalPrice: () => void
    }
  ): void {
    // Convert moment objects to Date objects
    component.dateFrom = event.startDate.toDate();
    component.dateTo = event.endDate.toDate();

    // Update the form with the new dates
    component.bookingForm.patchValue({
      dates: {
        dateFrom: component.dateFrom.toISOString(),
        dateTo: component.dateTo.toISOString()
      }
    });

    // Recalculate total price
    component.calculateTotalPrice();
  }
  searchLocations(query: string): Observable<LocationSuggestion[]> {
    if (query.trim().length < 2) {
      return of([]);
    }
    
    // Using OpenStreetMap's Nominatim API for geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    
    return this.http.get<any[]>(url).pipe(
      map(results => results.map(item => ({
        displayName: item.display_name.split(',').slice(0, 2).join(','), // Simplify display name
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      }))),
      catchError(() => of([]))
    );
  }

  setupLocationSearch(
    searchSubject: Subject<string>,
    onResultsCallback: (results: LocationSuggestion[]) => void,
    onLoadingCallback: (isLoading: boolean) => void
  ): Subscription {
    return searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length < 2) {
          onLoadingCallback(false);
          return of([]);
        }
        
        onLoadingCallback(true);
        return this.searchLocations(query).pipe(
          catchError(() => {
            onLoadingCallback(false);
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      onResultsCallback(results);
      onLoadingCallback(false);
    });
  }

  reverseGeocode(lat: number, lon: number): Observable<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    return this.http.get<any>(url).pipe(
      map(result => {
        if (result && result.display_name) {
          return result.display_name.split(',').slice(0, 2).join(',');
        }
        return 'Current location';
      }),
      catchError(() => of('Current location'))
    );
  }

  getCurrentLocation(
    onSuccess: (coords: { lat: number; lon: number }, address: string) => void,
    onError: (error: GeolocationPositionError | string) => void
  ): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          // Reverse geocode to get address
          this.reverseGeocode(coords.lat, coords.lon).subscribe(
            (address) => {
              onSuccess(coords, address);
            },
            (error) => {
              console.error('Error getting address:', error);
              onError('Could not determine your address. Please enter it manually.');
            }
          );
        },
        (error) => {
          console.error('Geolocation error:', error);
          onError(error);
        }
      );
    } else {
      onError('Geolocation is not supported by your browser. Please enter your location manually.');
    }
  }

  // ==================== FORM VALIDATION METHODS ====================

  isLocationInvalid(location: string | null): boolean {
    return !location || location === 'Choose location';
  }
  
  isDuplicateLocations(pickupLocation: string | null, dropoffLocation: string | null): boolean {
    if (!pickupLocation || !dropoffLocation) {
      return false;
    }
    return pickupLocation === dropoffLocation;
  }

  isFormValid(
    formValid: boolean, 
    pickupLocation: string | null, 
    dropoffLocation: string | null
  ): boolean {
    return (
      formValid && 
      !this.isLocationInvalid(pickupLocation) && 
      !this.isLocationInvalid(dropoffLocation) && 
      !this.isDuplicateLocations(pickupLocation, dropoffLocation)
    );
  }

  // ==================== DATE & PRICE METHODS ====================

  calculateTotalPrice(
    dateFrom: Date, 
    dateTo: Date, 
    pricePerDay: number
  ): { numberOfDays: number, totalPrice: number } {
    if (dateFrom && dateTo) {
      // Calculate difference in days (use UTC to avoid timezone issues)
      const diffTime = Math.abs(dateTo.getTime() - dateFrom.getTime());
      const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalPrice = numberOfDays * pricePerDay;
      
      return { numberOfDays, totalPrice };
    }
    return { numberOfDays: 0, totalPrice: 0 };
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', { 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  }
  
  formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Asia/Kolkata'
    });
  }

  formatBookedDates(bookedDates?: BookedDate[]): { startDate: string; endDate: string; }[] {
    if (!bookedDates) return [];
    
    return bookedDates.map(date => ({
      startDate: date.startDate,
      endDate: date.endDate
    }));
  }

  getDefaultEndDate(): Date {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 5); // Default to 5 days rental
    return endDate;
  }

  // ==================== USER & BOOKING METHODS ====================

  getMockUserInfo(): UserInfo {
    return {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+38 067 123 45 67'
    };
  }

  getMockLocationInfo(): LocationInfo {
    return {
      pickupLocation: 'Kyiv, Ukraine',
      dropoffLocation: 'Lviv, Ukraine'
    };
  }

  getUserFromLocalStorage(): any {
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  getUserInfo(): UserInfo {
    const user = this.getUserFromLocalStorage();
    
    if (user) {
      return {
        fullName: user.firstName && user.lastName ? 
          `${user.firstName} ${user.lastName}` : 
          (user.fullName || user.name || 'User'),
        email: user.email || '',
        phone: user.phone || this.getMockUserInfo().phone
      };
    } else {
      // If no user in localStorage, use mock data
      return this.getMockUserInfo();
    }
  }


  // Updated updateBooking method in car.service.ts
updateBooking(booking: Booking): Observable<Booking> {
  return new Observable<Booking>(observer => {
    try {
      // Find the booking in our internal array
      const index = this.bookings.findIndex(b => b.id === booking.id);
      
      if (index !== -1) {
        // Update the booking in our array
        this.bookings[index] = {
          ...booking,
          // Ensure dates are Date objects
          pickupDate: new Date(booking.pickupDate),
          dropoffDate: new Date(booking.dropoffDate)
        };
        
        // Save to localStorage using the correct key
        this.saveBookingsToStorage();
        
        // Emit updated bookings
        this.bookingsSubject.next([...this.bookings]);
        
        // Return success
        observer.next(this.bookings[index]);
        observer.complete();
      } else {
        // Booking not found
        observer.error(new Error('Booking not found'));
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      observer.error(error);
    }
  });
}

// Add this helper method to car.service.ts
private getBookingIndex(bookingId: string): number {
  return this.bookings.findIndex(b => b.id === bookingId);
}

  getBookingById(id: string): Observable<Booking | undefined> {
    return this.getBookings().pipe(
      map(bookings => bookings.find(booking => booking.id === id))
    );
  }

  // ==================== DIALOG & UI METHODS ====================

  showBookingSuccessDialog(car: CarDetails, dateFrom: Date, dateTo: Date, totalPrice: number, numberOfDays: number): void {
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    
    this.dialog.open(BookingSuccessDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'success-dialog-container',
      data: {
        carName: `${car.brand} ${car.model}`,
        startDate: dateFrom,
        endDate: dateTo,
        orderNumber: orderNumber,
        bookingDate: new Date(),
        totalPrice: totalPrice,
        numberOfDays: numberOfDays
      }
    });
  }

  showCarReservedDialog(): void {
    this.dialog.open(CarReservedDialogComponent, {
      width: '400px',
      panelClass: 'car-reserved-dialog',
      position: { top: '0' },
      disableClose: true
    });
  }
}