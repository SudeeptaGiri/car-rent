export interface FilterData {
    pickupLocation: string | null;
    pickupCoordinates: { lat: number; lon: number } | null;
    dropoffLocation: string | null;
    dropoffCoordinates: { lat: number; lon: number } | null;
    pickupDate: string;
    dropoffDate: string;
    carCategory: string;
    gearbox: string;
    engineType: string;
    priceMin: number;
    priceMax: number;
  }