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
export function mongoDBCarToCarDetails(mongoDBCar: any): CarDetails {
  // Check if we're getting the simplified list format or detailed car format
  const isSimplifiedFormat = mongoDBCar.hasOwnProperty('imageUrl') && !mongoDBCar.hasOwnProperty('images');
  
  // Extract car ID from the appropriate field
  const id = mongoDBCar._id || mongoDBCar.carId || '';
  
  // Parse model string to extract brand, model and year
  let brand = '', model = '', year = new Date().getFullYear();
  if (isSimplifiedFormat && mongoDBCar.model) {
    const modelParts = mongoDBCar.model.split(' ');
    if (modelParts.length >= 3) {
      // Last part is year
      const lastPart = modelParts[modelParts.length - 1];
      if (!isNaN(parseInt(lastPart))) {
        year = parseInt(lastPart);
        // First part is typically brand
        brand = modelParts[0];
        // Middle parts are model
        model = modelParts.slice(1, modelParts.length - 1).join(' ');
      } else {
        // No year in the string
        brand = modelParts[0];
        model = modelParts.slice(1).join(' ');
      }
    } else if (modelParts.length === 2) {
      // Assume first part is brand, second is model
      brand = modelParts[0];
      model = modelParts[1];
    } else {
      // Just use the whole string as model
      model = mongoDBCar.model;
    }
  } else {
    // Use direct fields if available
    brand = mongoDBCar.brand || '';
    model = mongoDBCar.model || '';
    year = mongoDBCar.year || new Date().getFullYear();
  }

  // Map status from MongoDB to frontend format
  const statusMap: { [key: string]: 'Available' | 'Not Available' | 'Reserved' } = {
    'AVAILABLE': 'Available',
    'BOOKED': 'Reserved',
    'UNAVAILABLE': 'Not Available'
  };
  
  // Get status or default to Available
  const status = mongoDBCar.status ? statusMap[mongoDBCar.status] || 'Not Available' : 'Available';

  // Handle images - could be array of strings, array of objects, or single imageUrl
  let carImages: CarImage[] = [];
  if (isSimplifiedFormat && mongoDBCar.imageUrl) {
    carImages = [{
      id: '0',
      url: mongoDBCar.imageUrl,
      isPrimary: true
    }];
  } else if (Array.isArray(mongoDBCar.images)) {
    carImages = mongoDBCar.images.map((img: any, index: number) => {
      if (typeof img === 'string') {
        return {
          id: index.toString(),
          url: img,
          isPrimary: index === 0
        };
      } else if (img && img.url) {
        return {
          id: img.id || index.toString(),
          url: img.url,
          isPrimary: img.isPrimary || index === 0
        };
      }
      return {
        id: index.toString(),
        url: 'assets/placeholder-car.svg',
        isPrimary: index === 0
      };
    });
  }
  
  // If no images were found, add a placeholder
  if (carImages.length === 0) {
    carImages = [{
      id: '0',
      url: 'assets/placeholder-car.svg',
      isPrimary: true
    }];
  }

  // Get price from appropriate field
  const price = mongoDBCar.pricePerDay ? 
    (typeof mongoDBCar.pricePerDay === 'string' ? 
      parseFloat(mongoDBCar.pricePerDay) : mongoDBCar.pricePerDay) : 
    (mongoDBCar.price || 0);

  // Get rating from appropriate field
  const rating = mongoDBCar.carRating ? 
    (typeof mongoDBCar.carRating === 'string' ? 
      parseFloat(mongoDBCar.carRating) : mongoDBCar.carRating) : 
    (mongoDBCar.rating || 0);

  // Create specifications object with available data
  const specifications = {
    transmission: mongoDBCar.gearBoxType === 'AUTOMATIC' ? 'Automatic' : 'Manual',
    engine: mongoDBCar.fuelType ? 
      `${mongoDBCar.engineCapacity || ''} ${mongoDBCar.fuelType.charAt(0).toUpperCase() + mongoDBCar.fuelType.slice(1).toLowerCase()}` : 
      (mongoDBCar.specifications?.engine || ''),
    fuelType: mongoDBCar.fuelType ? 
      mongoDBCar.fuelType.charAt(0).toUpperCase() + mongoDBCar.fuelType.slice(1).toLowerCase() : 
      (mongoDBCar.specifications?.fuelType || ''),
    seats: mongoDBCar.passengerCapacity ? 
      parseInt(mongoDBCar.passengerCapacity) : 
      (mongoDBCar.specifications?.seats || 5),
    fuelConsumption: mongoDBCar.fuelConsumption || 
      (mongoDBCar.specifications?.fuelConsumption || ''),
    engineCapacity: mongoDBCar.engineCapacity || '',
    climateControl: mongoDBCar.climateControlOption ? 
      mongoDBCar.climateControlOption.replace(/_/g, ' ').toLowerCase() : '',
    features: mongoDBCar.specifications?.features || []
  };

  // Create and return the car details object
  return {
    id: id,
    brand: brand,
    model: model,
    year: year,
    location: mongoDBCar.location || '',
    rating: rating,
    price: price,
    category: mongoDBCar.category || 'Passenger car',
    status: status,
    images: carImages,
    specifications: specifications,
    bookedDates: mongoDBCar.bookedDates || [],
    reviews: mongoDBCar.reviews || {
      content: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0
    },
    popularity: mongoDBCar.popularity || {
      rentCount: 0,
      viewCount: 0,
      favoriteCount: 0,
      isPopular: false
    }
  };
}

// In convertMongoDBResponse function
export function convertMongoDBResponse(response: any): CarListResponse {
  console.log('Converting MongoDB response:', response);
  
  // Handle both direct array and paginated response formats
  let content = [];
  let totalPages = 1;
  let currentPage = 1;
  let totalElements = 0;
  
  if (response) {
    if (Array.isArray(response.content)) {
      content = response.content;
      totalPages = response.totalPages || 1;
      currentPage = response.currentPage || 1;
      totalElements = response.totalElements || content.length;
    } else if (Array.isArray(response)) {
      content = response;
      totalElements = content.length;
    }
  }
  
  const convertedCars = content.map((car: any) => {
    const convertedCar = mongoDBCarToCarDetails(car);
    console.log(`Converted car ${car.carId || car._id}: Brand=${convertedCar.brand}, Model=${convertedCar.model}`);
    return convertedCar;
  });
  
  return {
    content: convertedCars,
    totalPages,
    currentPage,
    totalElements
  };
}