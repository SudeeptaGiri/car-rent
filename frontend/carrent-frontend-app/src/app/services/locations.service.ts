import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface LocationData {
  locationId: string;
  locationName: string;
  locationAddress: string;
  locationImageUrl: string;
  mapEmbedUrl: string;
}

interface LocationResponse {
  content: LocationData[];
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  // private apiUrl = 'https://orhwpuluvf.execute-api.eu-west-3.amazonaws.com/api';
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getLocations(): Observable<LocationData[]> {
    return this.http.get<LocationResponse>(`${this.apiUrl}/home/locations`)
      .pipe(
        map(response => {
          console.log(response)
          return response.content})
      );
  }
}