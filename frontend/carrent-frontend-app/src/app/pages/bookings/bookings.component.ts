import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

interface Car {
  _id: string;
  brand: string;
  model: string;
}

interface Client {
  _id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface Booking {
  _id: string;
  carId: Car;
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

  // Map to store client information
  clientsMap: Map<string, Client> = new Map();

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
    
    this.http.get<any>('http://localhost:3000/api/bookings')
      .subscribe({
        next: (response) => {
          // Handle different response formats
          let bookingsData: any[] = [];
          
          if (Array.isArray(response)) {
            bookingsData = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            bookingsData = response.data;
          } else if (response && typeof response === 'object') {
            // If it's a single booking object
            bookingsData = [response];
          }
          
          console.log('Raw bookings data:', bookingsData);
          
          // Load client information for each booking
          this.loadClientsInfo(bookingsData);
          
          // Process the bookings data
          this.bookings = bookingsData;
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

  loadClientsInfo(bookings: any[]): void {
    // Extract unique client IDs
    const clientIds = [...new Set(bookings
      .map(booking => booking.clientId)
      .filter(id => typeof id === 'string'))];
    
    // For each client ID, we would normally fetch client info from API
    // But since we don't have that endpoint, we'll create placeholder data
    clientIds.forEach(clientId => {
      // In a real app, you would fetch client details from an API
      // For now, we'll create a placeholder client
      this.clientsMap.set(clientId, {
        _id: clientId,
        firstName: 'Client',
        lastName: clientId.substring(0, 5),
        role: 'Client' // Default role
      });
    });
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
      
      // Get client info
      const clientInfo = this.getClientInfo(booking.clientId);
      
      // Filter by made by (role)
      const madeByMatch = !filters.madeBy || 
        (clientInfo && clientInfo.role === filters.madeBy);
      
      // Filter by client name (if provided)
      let clientMatch = true;
      if (filters.client && clientInfo) {
        const clientName = `${clientInfo.firstName || ''} ${clientInfo.lastName || ''}`.toLowerCase();
        clientMatch = clientName.includes(filters.client.toLowerCase());
      }
      
      return dateRangeMatch && statusMatch && madeByMatch && clientMatch;
    });
  }

  getClientInfo(clientId: string | Client): Client {
    if (typeof clientId === 'object' && clientId !== null) {
      return clientId;
    }
    
    // If it's a string ID, look up in our map
    if (typeof clientId === 'string' && this.clientsMap.has(clientId)) {
      return this.clientsMap.get(clientId)!;
    }
    
    // Default client info if not found
    return {
      _id: typeof clientId === 'string' ? clientId : 'unknown',
      firstName: 'Unknown',
      lastName: 'Client',
      role: 'Client'
    };
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
      // Updated to use brand instead of make based on your sample data
      return `${car.brand || ''} ${car.model || ''}`.trim() || 'Unknown';
    }
    return 'Unknown';
  }

  getClientName(clientId: string | Client): string {
    const client = this.getClientInfo(clientId);
    return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown';
  }

  getClientRole(clientId: string | Client): string {
    const client = this.getClientInfo(clientId);
    return client.role || 'Client';
  }

  createNewBooking(): void {
    this.router.navigate(['/bookings/create']);
  }

  openBookingDetails(bookingId: string): void {
    this.router.navigate(['/bookings', bookingId]);
  }
}