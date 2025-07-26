export interface Location {
    locationId: number;
    locationName: string;
    address?: string;
    locationImageUrl: string;
    mapEmbedUrl:string;
    lat?: number;  // Add latitude
    lng?: number;  // Add longitude
}