import { Component, OnInit } from '@angular/core';
import { FeedbacksComponent } from '../../components/feedbacks/feedbacks.component';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-main',
  standalone: false,
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit {
  carsData: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    console.log('MainComponent initialized, fetching cars data...');
    this.loadCarsData();
  }
  
  // Add this missing method
  loadCarsData(path: string = 'assets/cars.json') {
    console.log(`Loading cars data from: ${path}`);
    
    this.http.get<{cars: any[]}>(path)
      .subscribe({
        next: (data) => {
          if (data && data.cars) {
            this.carsData = data.cars;
            console.log(`Successfully loaded ${this.carsData.length} cars for feedback`);
          } else {
            console.error('No cars data found in the response');
          }
        },
        error: (err) => {
          console.error(`Error loading cars data from ${path}:`, err);
          
          // If default path failed, try alternate path
          if (path === 'assets/cars.json') {
            console.log('Trying alternate path: ./public/assets/cars.json');
            this.loadCarsData('./public/assets/cars.json');
          }
        }
      });
  }
}