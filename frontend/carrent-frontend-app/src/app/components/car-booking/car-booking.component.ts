import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import * as momentImport from 'moment';
const moment = momentImport.default || momentImport; 

interface Client {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface Location {
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationImageUrl?: string;
  mapEmbedUrl: string;
}

interface UserInfo {
  fullName: string;
  email: string;
  phone: string;
}

interface CarDetails {
  _id: string;
  carId: string;
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  images: any[];
  location: string;
  bookedDates?: {startDate: string, endDate: string}[];
}

@Component({
  selector: 'app-car-booking',
  templateUrl: './car-booking.component.html',
  styleUrls: ['./car-booking.component.css'],
  standalone: false
})
export class CarBookingComponent implements OnInit, OnDestroy {
  bookingForm!: FormGroup;
  selectedCar!: CarDetails;
  userInfo: UserInfo = { fullName: '', email: '', phone: '' };
  isReserved = false;

  totalPrice = 0;
  depositAmount = 2000;
  numberOfDays = 0;
  dateFrom!: Date;
  dateTo!: Date;
  isCalendarOpen = false;

  // User role related properties
  isSupport = false;
  clients: Client[] = [];
  selectedClient: Client | null = null;

  // Locations from database
  locations: Location[] = [];
  selectedPickupLocation: string | null = null;
  selectedDropoffLocation: string | null = null;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  // API URL
  private apiUrl = "https://egvws0hf2k.execute-api.eu-west-3.amazonaws.com/api";

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check user role from sessionStorage
    const userString = sessionStorage.getItem('currentUser');
    if (userString) {
      const user = JSON.parse(userString);
      this.isSupport = user.role === 'SupportAgent';
      
      // Set user info
      this.userInfo = {
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber || ''
      };
    }
    
    // If support agent, load clients
    if (this.isSupport) {
      this.loadClients();
    }
    
    // Load locations from database
    this.loadLocations();
    
    // Initialize form
    this.initForm();

    // Get car ID and dates from route parameters
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        if (params['carId']) {
          // Get car details
          this.loadCarDetails(params['carId']);
          
          // If dates are provided in the URL, use them
          if (params['startDate'] && params['endDate']) {
            const startDate = new Date(`${params['startDate']} ${params['startTime'] || '10:00'}`);
            const endDate = new Date(`${params['endDate']} ${params['endTime'] || '16:00'}`);
            
            this.dateFrom = startDate;
            this.dateTo = endDate;
            
            // Update form with these dates
            this.bookingForm.patchValue({
              dates: {
                dateFrom: startDate.toISOString(),
                dateTo: endDate.toISOString()
              }
            });
          }
        }
      })
    );
  }
  
  // Load car details
  loadCarDetails(carId: string): void {
    this.subscriptions.push(
      this.http.get<CarDetails>(`${this.apiUrl}/cars/${carId}`).subscribe({
        next: (car) => {
          this.selectedCar = car;
          this.calculateTotalPrice();
        },
        error: (error) => {
          console.error('Error loading car details:', error);
          
          // Mock car data for testing if API fails
          this.selectedCar = {
            _id: '1',
            carId: carId,
            brand: 'Audi',
            model: 'A6 Quattro',
            year: 2023,
            pricePerDay: 150,
            images: [
              { url: 'https://images.unsplash.com/photo-1541348263662-e068662d82af?q=80&w=1974&auto=format&fit=crop' }
            ],
            location: 'Ukraine, Kyiv'
          };
          this.calculateTotalPrice();
        }
      })
    );
  }
  
  // Load locations from database
  loadLocations(): void {
    this.subscriptions.push(
      this.http.get<any>(`${this.apiUrl}/home/locations`).subscribe({
        next: (response) => {
          // Check if response has content property (based on the provided response)
          if (response && response.content && Array.isArray(response.content)) {
            this.locations = response.content;
          } else {
            this.locations = response; // In case the response is directly an array
          }
          console.log('Locations loaded:', this.locations);
        },
        error: (error) => {
          console.error('Error loading locations:', error);
        }
      })
    );
  }
  
  // Load clients for support agent
  loadClients(): void {
    this.subscriptions.push(
      this.http.get<Client[]>(`${this.apiUrl}/users/clients`).subscribe({
        next: (clients) => {
          this.clients = clients;
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          
          // Mock data for testing
          this.clients = [
            { id: '1', fullName: 'Anastasiya Dobrota', email: 'dobrota@gmail.com', phone: '+38 111 111 11 11' },
            { id: '2', fullName: 'John Smith', email: 'john.smith@example.com', phone: '+38 222 222 22 22' }
          ];
        }
      })
    );
  }
  
  // Handle client selection
  onClientSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedIndex = selectElement.selectedIndex;
    
    // Skip if the first option (placeholder) is selected
    if (selectedIndex <= 0) return;
    
    // Get the selected client (subtract 1 because of the placeholder option)
    const client = this.clients[selectedIndex - 1];
    this.selectedClient = client;
    
    // Update form with selected client info
    this.bookingForm.get('personalInfo')?.patchValue({
      fullName: client.fullName,
      email: client.email,
      phone: client.phone
    });
  }
  
  // Handle pickup location change
  onPickupLocationChanged(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const locationId = selectElement.value;
    
    if (locationId) {
      this.selectedPickupLocation = locationId;
      const selectedLocation = this.locations.find(loc => loc.locationId === locationId);
      
      if (selectedLocation) {
        // Update form value
        this.bookingForm.get('location.pickupLocation')?.setValue(locationId);
      }
    }
  }
  
  // Handle dropoff location change
  onDropoffLocationChanged(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const locationId = selectElement.value;
    
    if (locationId) {
      this.selectedDropoffLocation = locationId;
      const selectedLocation = this.locations.find(loc => loc.locationId === locationId);
      
      if (selectedLocation) {
        // Update form value
        this.bookingForm.get('location.dropoffLocation')?.setValue(locationId);
      }
    }
  }
  
  // Location validation methods
  isLocationInvalid(controlName: string): boolean {
    const control = this.bookingForm.get(`location.${controlName}`);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  isDuplicateLocations(): boolean {
    const pickupLocation = this.bookingForm.get('location.pickupLocation')?.value;
    const dropoffLocation = this.bookingForm.get('location.dropoffLocation')?.value;
    return pickupLocation && dropoffLocation && pickupLocation === dropoffLocation;
  }

  isFormValid(): boolean {
    return this.bookingForm.valid && 
           !this.isDuplicateLocations() && 
           !!this.selectedPickupLocation && 
           !!this.selectedDropoffLocation;
  }

  toggleCalendar(): void {
    this.isCalendarOpen = !this.isCalendarOpen;
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      personalInfo: this.fb.group({
        fullName: [this.userInfo.fullName, Validators.required],
        email: [this.userInfo.email, [Validators.required, Validators.email]],
        phone: [this.userInfo.phone, Validators.required]
      }),
      location: this.fb.group({
        pickupLocation: ['', Validators.required],
        dropoffLocation: ['', Validators.required]
      }),
      dates: this.fb.group({
        dateFrom: [new Date().toISOString(), Validators.required],
        dateTo: [this.addDays(new Date(), 3).toISOString(), Validators.required]
      })
    });
  
    // Initialize dates
    this.dateFrom = new Date(this.bookingForm.get('dates.dateFrom')?.value);
    this.dateTo = new Date(this.bookingForm.get('dates.dateTo')?.value);
  
    // Subscribe to date changes
    const dateSubscription = this.bookingForm.get('dates')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
    
    if (dateSubscription) {
      this.subscriptions.push(dateSubscription);
    }
  }

  // Helper method to add days to a date
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  calculateTotalPrice(): void {
    const dateFromStr = this.bookingForm.get('dates.dateFrom')?.value;
    const dateToStr = this.bookingForm.get('dates.dateTo')?.value;

    if (dateFromStr && dateToStr && this.selectedCar) {
      // Create dates
      this.dateFrom = new Date(dateFromStr);
      this.dateTo = new Date(dateToStr);
  
      // Calculate number of days
      const diffTime = Math.abs(this.dateTo.getTime() - this.dateFrom.getTime());
      this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate total price
      this.totalPrice = this.numberOfDays * this.selectedCar.pricePerDay;
    }
  }

  confirmReservation(): void {
    if (!this.isFormValid()) return;
    
    // Get selected location details
    const pickupLocationObj = this.locations.find(loc => loc.locationId === this.selectedPickupLocation);
    const dropoffLocationObj = this.locations.find(loc => loc.locationId === this.selectedDropoffLocation);
    
    if (!pickupLocationObj || !dropoffLocationObj) {
      console.error('Location not found');
      return;
    }
    
    // Get current user ID from sessionStorage
    let clientId: string | null = null;
    
    if (this.isSupport && this.selectedClient) {
      // If support agent is making booking for a client
      clientId = this.selectedClient.id;
    } else {
      // Get current user ID
      const userString = sessionStorage.getItem('currentUser');
      if (userString) {
        const user = JSON.parse(userString);
        clientId = user._id || user.id;
      }
    }
    
    if (!clientId) {
      console.error('Client ID not found');
      return;
    }
    
    // Create booking request
    const bookingData = {
      carId: this.selectedCar.carId || this.selectedCar._id,
      clientId: clientId,
      pickupDateTime: this.dateFrom.toISOString(),
      dropOffDateTime: this.dateTo.toISOString(),
      pickupLocationId: pickupLocationObj.locationId,
      dropOffLocationId: dropoffLocationObj.locationId
    };
    
    // Call API to create booking
    this.http.post<any>(`${this.apiUrl}/bookings`, bookingData).subscribe({
      next: (response) => {
        console.log('Booking created successfully:', response);
        
        // Navigate to confirmation page or show success message
        this.router.navigate(['/booking-confirmation'], { 
          queryParams: { 
            bookingId: response.bookingId,
            orderNumber: response.orderNumber
          }
        });
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        // Show error message to user
        alert('Failed to create booking. Please try again.');
      }
    });
  }

  onDateRangeSelected(event: {startDate: moment.Moment, endDate: moment.Moment}): void {
    if (event.startDate && event.endDate) {
      // Set time to 10:00 for start date and 16:00 for end date
      const startDate = event.startDate.hour(10).minute(0).second(0).toDate();
      const endDate = event.endDate.hour(16).minute(0).second(0).toDate();
      
      this.dateFrom = startDate;
      this.dateTo = endDate;
      
      // Update form
      this.bookingForm.patchValue({
        dates: {
          dateFrom: startDate.toISOString(),
          dateTo: endDate.toISOString()
        }
      });
      
      // Calculate total price
      this.calculateTotalPrice();
    }
  }

  // Add a getter for formatted booked dates
  get bookedDatesFormatted(): { startDate: string; endDate: string; }[] {
    if (!this.selectedCar?.bookedDates) return [];
    
    return this.selectedCar.bookedDates.map(date => ({
      startDate: moment(date.startDate).format('YYYY-MM-DD'),
      endDate: moment(date.endDate).format('YYYY-MM-DD')
    }));
  }
  
  // Helper method to get button text based on user role
  getConfirmButtonText(): string {
    return this.isSupport ? 'Confirm booking' : 'Confirm reservation';
  }
  
  // Helper method to get current user from sessionStorage
  getCurrentUser(): any {
    const userString = sessionStorage.getItem('currentUser');
    if (userString) {
      return JSON.parse(userString);
    }
    return null;
  }
  
  // Helper method to get formatted date string
  getFormattedDate(date: Date): string {
    return `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()} | ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`;
  }
  
  // Helper method to pad zero
  padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }
}