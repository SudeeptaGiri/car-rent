// models/car.interface.ts

// Base interfaces
export interface CarImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

// Updated CarSpecifications to match MongoDB schema
export interface CarSpecifications {
  transmission: string;  // Maps to gearBoxType in MongoDB
  engine: string;        // Can be derived from fuelType+engineCapacity
  fuelType: string;      // Direct from MongoDB
  seats: number;         // Maps to passengerCapacity
  fuelConsumption: string; // Direct from MongoDB
  engineCapacity?: string; // Added from MongoDB
  climateControl?: string; // Added from MongoDB
  features: string[];    // Keep for backward compatibility
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

// MongoDB-aligned car interface
export interface MongoDBCar {
  _id?: string;
  carId?: string;
  model: string;
  brand: string;
  year: number;
  category: 'ECONOMY' | 'COMFORT' | 'BUSINESS' | 'PREMIUM' | 'CROSSOVER' | 'MINIVAN' | 'ELECTRIC';
  gearBoxType: 'MANUAL' | 'AUTOMATIC';
  fuelType: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  engineCapacity: string;
  fuelConsumption: string;
  passengerCapacity: string;
  climateControlOption: 'NONE' | 'AIR_CONDITIONER' | 'CLIMATE_CONTROL' | 'TWO_ZONE_CLIMATE_CONTROL';
  status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
  pricePerDay: number;
  locationId: string;
  location: string;
  images: string[];
  carRating: number;
  serviceRating: number;
  carNumber: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Main Car interface (preserved for backward compatibility)
export interface CarDetails {
  id: string;
  brand: string;
  model: string;
  year: number;
  location: string;
  rating: number;
  price: number;
  category: string;
  status: 'Available' | 'Not Available' | 'Reserved';
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

// MongoDB response interface
export interface MongoDBCarListResponse {
  content: MongoDBCar[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}

// Search Params interface
export interface SearchParams {
  pickupDate: Date;
  returnDate: Date;
  location: string;
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

// Helper function to convert MongoDB car to frontend CarDetails
export function mongoDBCarToCarDetails(mongoDBCar: MongoDBCar): CarDetails {
  // Map status from MongoDB to frontend format
  const statusMap: { [key: string]: 'Available' | 'Not Available' | 'Reserved' } = {
    'AVAILABLE': 'Available',
    'BOOKED': 'Reserved',
    'UNAVAILABLE': 'Not Available'
  };

  // Map category from MongoDB to frontend format
  const categoryMap: { [key: string]: string } = {
    'ECONOMY': 'Passenger car',
    'COMFORT': 'Passenger car',
    'BUSINESS': 'Luxury car',
    'PREMIUM': 'Luxury car',
    'CROSSOVER': 'Off-road car',
    'MINIVAN': 'Passenger car',
    'ELECTRIC': 'Passenger car'
  };

  // Convert string array of images to CarImage objects
  const carImages: CarImage[] = mongoDBCar.images.map((url, index) => ({
    id: index.toString(),
    url,
    isPrimary: index === 0
  }));
  console.log('Mongo DB CARRRRRRRR :', mongoDBCar);
  return {
    id: mongoDBCar._id || mongoDBCar.carId || '',
    brand: mongoDBCar.brand,
    model: mongoDBCar.model,
    year: mongoDBCar.year,
    location: mongoDBCar.location,
    rating: mongoDBCar.carRating,
    price: mongoDBCar.pricePerDay,
    category: categoryMap[mongoDBCar.category] || 'Passenger car',
    status: statusMap[mongoDBCar.status] || 'Not Available',
    images: carImages,
    specifications: {
      transmission: mongoDBCar.gearBoxType === 'AUTOMATIC' ? 'Automatic' : 'Manual',
      engine: `${mongoDBCar.engineCapacity} ${mongoDBCar.fuelType.charAt(0) + mongoDBCar.fuelType.slice(1).toLowerCase()}`,
      fuelType: mongoDBCar.fuelType.charAt(0) + mongoDBCar.fuelType.slice(1).toLowerCase(),
      seats: parseInt(mongoDBCar.passengerCapacity) || 5,
      fuelConsumption: mongoDBCar.fuelConsumption,
      engineCapacity: mongoDBCar.engineCapacity,
      climateControl: mongoDBCar.climateControlOption.replace(/_/g, ' ').toLowerCase(),
      features: []
    },
    bookedDates: [],
    reviews: {
      content: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0
    },
    popularity: {
      rentCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      isPopular: false
    }
  };
}

// Helper function to convert MongoDB car list response to frontend format
export function convertMongoDBResponse(response: MongoDBCarListResponse): CarListResponse {
  return {
    content: response.content.map(mongoDBCarToCarDetails),
    totalPages: response.totalPages,
    currentPage: response.currentPage,
    totalElements: response.totalElements
  };
}