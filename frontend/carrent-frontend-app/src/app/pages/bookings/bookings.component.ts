import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

interface Car {
  _id: string;
  make: string;
  model: string;
}

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Booking {
  _id: string;
  carId: string | Car;
  clientId: string | Client;
  pickupDateTime: string;
  dropOffDateTime: string;
  bookingStatus: string;
  orderNumber: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css'],
  providers: [DatePipe],
  standalone: false
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  filterForm: FormGroup;
  isLoading: boolean = true;
  error: string | null = null;
  
  // Status options for dropdown
  bookingStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'RESERVED', label: 'Reserved' },
    { value: 'RESERVED_BY_SUPPORT_AGENT', label: 'Reserved by Support' },
    { value: 'SERVICE_STARTED', label: 'Service started' },
    { value: 'SERVICE_PROVIDED', label: 'Service provided' },
    { value: 'BOOKING_FINISHED', label: 'Booking finished' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  // Made by options for dropdown
  madeByOptions = [
    { value: '', label: 'All' },
    { value: 'Client', label: 'Client' },
    { value: 'Support', label: 'Support agent' },
    { value: 'Admin', label: 'Admin' }
  ];

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private router: Router
  ) {
    this.filterForm = this.formBuilder.group({
      dateRange: this.formBuilder.group({
        start: [''],
        end: ['']
      }),
      client: [''],
      bookingStatus: [''],
      madeBy: ['']
    });
  }

  ngOnInit(): void {
    this.loadBookings();
    
    // Subscribe to form value changes to apply filters
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = null;
    
    this.http.get<any>('https://llsvnkriye.execute-api.eu-west-3.amazonaws.com/api/bookings')
      .subscribe({
        next: (response) => {
          // Handle different response formats
          let bookingsData: Booking[] = [];
          
          if (Array.isArray(response)) {
            bookingsData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            bookingsData = response.data;
          } else if (response && typeof response === 'object') {
            // If it's a single booking object
            bookingsData = [response];
          }
          
          // Process the bookings data
          this.bookings = this.processBookingsData(bookingsData);
          this.filteredBookings = [...this.bookings];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching bookings:', error);
          this.error = 'Failed to load bookings. Please try again later.';
          this.isLoading = false;
        }
      });
  }

  processBookingsData(bookingsData: any[]): Booking[] {
    return bookingsData.map(booking => {
      // Ensure we have proper car and client objects
      const processedBooking: Booking = {
        ...booking,
        carId: this.processCarData(booking.carId),
        clientId: this.processClientData(booking.clientId)
      };
      
      return processedBooking;
    });
  }

  processCarData(carData: any): Car {
    // If carId is already populated as an object
    if (carData && typeof carData === 'object' && carData.make && carData.model) {
      return carData as Car;
    }
    
    // If it's just an ID or missing data
    return {
      _id: typeof carData === 'string' ? carData : 'unknown',
      make: 'Unknown',
      model: 'Unknown'
    };
  }

  processClientData(clientData: any): Client {
    // If clientId is already populated as an object
    if (clientData && typeof clientData === 'object' && 
        (clientData.firstName || clientData.lastName)) {
      return {
        _id: clientData._id || 'unknown',
        firstName: clientData.firstName || '',
        lastName: clientData.lastName || '',
        role: clientData.role || 'Client'
      };
    }
    
    // If it's just an ID or missing data
    return {
      _id: typeof clientData === 'string' ? clientData : 'unknown',
      firstName: 'Unknown',
      lastName: 'Client',
      role: 'Client'
    };
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredBookings = this.bookings.filter(booking => {
      // Filter by date range
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      const pickupDate = new Date(booking.pickupDateTime);
      const dropOffDate = new Date(booking.dropOffDateTime);
      
      const dateRangeMatch = 
        (!startDate || pickupDate >= startDate) && 
        (!endDate || dropOffDate <= endDate);
      
      // Filter by booking status
      const statusMatch = !filters.bookingStatus || 
        booking.bookingStatus === filters.bookingStatus;
      
      // Filter by made by (role)
      const clientObject = booking.clientId as Client;
      const madeByMatch = !filters.madeBy || 
        (clientObject && clientObject.role === filters.madeBy);
      
      // Filter by client name (if provided)
      let clientMatch = true;
      if (filters.client && clientObject) {
        const clientName = `${clientObject.firstName} ${clientObject.lastName}`.toLowerCase();
        clientMatch = clientName.includes(filters.client.toLowerCase());
      }
      
      return dateRangeMatch && statusMatch && madeByMatch && clientMatch;
    });
  }

  applyFiltersClick(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterForm.reset({
      dateRange: {
        start: '',
        end: ''
      },
      client: '',
      bookingStatus: '',
      madeBy: ''
    });
    this.filteredBookings = [...this.bookings];
  }

  formatBookingStatus(status: string): string {
    switch (status) {
      case 'RESERVED': return 'Reserved';
      case 'RESERVED_BY_SUPPORT_AGENT': return 'Reserved by support';
      case 'SERVICE_STARTED': return 'Service started';
      case 'SERVICE_PROVIDED': return 'Service provided';
      case 'BOOKING_FINISHED': return 'Booking finished';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  formatDate(date: string | Date): string {
    return this.datePipe.transform(date, 'MMM d') || '';
  }

  getBookingPeriod(pickup: string, dropOff: string): string {
    const pickupFormatted = this.formatDate(pickup);
    const dropOffFormatted = this.formatDate(dropOff);
    return `${pickupFormatted} - ${dropOffFormatted}`;
  }

  getCarName(car: any): string {
    if (typeof car === 'object' && car) {
      return `${car.make || ''} ${car.model || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  }

  getClientName(client: any): string {
    if (typeof client === 'object' && client) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  }

  getClientRole(client: any): string {
    if (typeof client === 'object' && client && client.role) {
      return client.role;
    }
    return 'Client';
  }

  createNewBooking(): void {
    this.router.navigate(['/bookings/create']);
  }

  openBookingDetails(bookingId: string): void {
    this.router.navigate(['/bookings', bookingId]);
  }
}