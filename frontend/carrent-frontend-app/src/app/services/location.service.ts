// src/app/services/location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = "https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api";// Set your API URL here

  constructor(private http: HttpClient) { }

  getAllLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/home/locations`);
  }

}