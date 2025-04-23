import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openCarReservedDialog() {
    const dialogRef = this.dialog.open(CarReservedDialogContent, {
      width: '400px',
      panelClass: 'car-reserved-dialog',
      disableClose: true
    });

    return dialogRef.afterClosed();
  }
}

// Define the dialog content as a separate component with proper decorator
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-car-reserved-dialog',
  template: `
    <div class="reserved-dialog-container">
      <h2 class="dialog-title">Sorry,</h2>
      
      <p class="dialog-message">
        It seems like someone has already reserved this car.
        You can find similar one 
        <a class="similar-link" (click)="onFindSimilarClick()">here</a>
      </p>
      
      <div class="button-container">
        <button mat-flat-button class="ok-button" (click)="onOkClick()">Ok</button>
      </div>
    </div>
  `,
  styles: [`
    .reserved-dialog-container {
      padding: 20px;
      min-width: 320px;
      max-width: 400px;
      background-color: white;
      border-radius: 8px;
    }

    .dialog-title {
      font-size: 24px;
      font-weight: 500;
      margin-top: 0;
      margin-bottom: 16px;
      color: #333;
    }

    .dialog-message {
      font-size: 16px;
      line-height: 1.5;
      color: #555;
      margin-bottom: 24px;
    }

    .similar-link {
      color: #1976d2;
      text-decoration: underline;
      cursor: pointer;
    }

    .button-container {
      display: flex;
      justify-content: center;
    }

    .ok-button {
      background-color: #d32f2f;
      color: white;
      width: 100%;
      padding: 12px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      text-transform: none;
    }

    .ok-button:hover {
      background-color: #b71c1c;
    }
  `]
})
export class CarReservedDialogContent {
  constructor(public dialogRef: MatDialogRef<CarReservedDialogContent>) {}

  onOkClick(): void {
    this.dialogRef.close();
  }

  onFindSimilarClick(): void {
    window.location.href = '/cars';
    this.dialogRef.close();
  }
}