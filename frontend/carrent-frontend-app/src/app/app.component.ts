import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CarDetailsPopupComponent } from './components/car-details-popup/car-details-popup.component';
import { CarService } from './services/car.service';
import { CarDetails } from './models/car.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  cars: CarDetails[] = [];

  constructor(private carService: CarService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.carService.getAllCars().subscribe((response) => {
      this.cars = response.content;
    });
  }

  openCarDetailsPopup(carId: string): void {
    const dialogRef = this.dialog.open(CarDetailsPopupComponent, {
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: { carId },
      autoFocus: false,
      hasBackdrop: true
    });
  }
}
