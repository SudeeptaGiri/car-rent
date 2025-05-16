import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { Car } from '../models/car.interface';
import { MongoDBCarListResponse } from '../models/car.interface';




export interface CarApiResponse {
  // content: Car[];
  totalPages: number;
  currentPage: number;
  totalElements: number;
}


@Injectable({
  providedIn: 'root',
})
export class myCarService {
  private apiUrl = 'https://v8xitm39lf.execute-api.eu-west-3.amazonaws.com/api'; // Replace with your actual API Gateway endpoint

  constructor(private http: HttpClient) {}

  getAllCars(): Observable<MongoDBCarListResponse> {
    return this.http.get<MongoDBCarListResponse>(`${this.apiUrl}/cars`);
  }

  getPopularCars(): Observable<MongoDBCarListResponse> {
    return this.http.get<MongoDBCarListResponse>(`${this.apiUrl}/cars/popular`);
  }
}
