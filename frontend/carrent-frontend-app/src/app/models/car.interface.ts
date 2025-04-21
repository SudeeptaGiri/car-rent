// models/car.interface.ts

// Base interfaces
export interface CarImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface CarSpecifications {
  transmission: string;
  engine: string;
  fuelType: string;
  seats: number;
  fuelConsumption: string;
  features: string[];
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  userAvatar: string;
}

export interface BookedDate {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  bookingId: string;
  userId: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export interface BookingRequest {
  carId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  userId: string;
  totalPrice: number;
}

export interface ReviewsData {
  content: Review[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

export interface Popularity {
  rentCount: number;
  viewCount: number;
  favoriteCount: number;
  isPopular: boolean;
}

// Main Car interface
export interface CarDetails {
  id: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  rating: number;
  price: number;
  category: string;
  status: 'Available' | 'Not Available';
  images: CarImage[];
  specifications: CarSpecifications;
  bookedDates: BookedDate[];
  reviews: ReviewsData;
  popularity: Popularity;
}

// Response interfaces
export interface CarsResponse {
  cars: CarDetails[];
  metadata: {
    totalCars: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface CarListResponse {
  content: CarDetails[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

// Filter interfaces
export interface CarFilters {
  location?: string;
  category?: string;
  transmission?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

// Search Params interface
export interface SearchParams {
  pickupDate: Date;
  returnDate: Date;
  location: string;
}

// Booking interface
export interface BookingRequest {
  carId: string;
  startDate: string;
  endDate: string;
  userId: string;
}

// Sort options
export interface SortOption {
  label: string;
  value: string;
}

export type SortBy = 'price' | 'rating' | 'popularity' | 'newest';
export type SortOrder = 'asc' | 'desc';

// Pagination interface
export interface PaginationParams {
  page: number;
  size: number;
  sort?: SortBy;
  order?: SortOrder;
}