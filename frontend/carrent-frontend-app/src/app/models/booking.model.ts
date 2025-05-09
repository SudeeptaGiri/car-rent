export interface BookingParams {
    dateFrom: string;
    dateTo: string;
    clientId: string;
  }
  
  export interface CarDetails {
    name: string;
    model: string;
    location: string;
    image: string;
    pricePerDay: number;
  }
  
  export interface UserInfo {
    fullName: string;
    email: string;
    phone: string;
    role?: string;
  }
  
  export interface LocationInfo {
    pickupLocation: string;
    dropoffLocation: string;
  }

  export enum BookingStatus {
    RESERVED = 'Reserved',
    SERVICE_STARTED = 'Service started',
    SERVICE_PROVIDED = 'Service provided',
    BOOKING_FINISHED = 'Booking finished',
    CANCELLED = 'Cancelled'
  }
  
  export interface Feedback {
    rating: number;
    comment: string;
    submittedAt: Date;
  }
  
  export interface Booking {
    id: string;
    carId: string;
    carName: string;
    carImage: string;
    orderNumber: string;
    pickupDate: Date;
    dropoffDate: Date;
    status: BookingStatus;
    feedback?: Feedback;
    reservedBy?: string;
    totalPrice: number;    // Add this
    numberOfDays: number;  // Add this
    pickupLocation: string;
    dropoffLocation: string;
  }