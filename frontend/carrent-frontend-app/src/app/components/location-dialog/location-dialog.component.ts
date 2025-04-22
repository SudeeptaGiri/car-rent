import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-location-dialog',
  templateUrl: './location-dialog.component.html',
  styleUrls: ['./location-dialog.component.css'],
  standalone: false
})
export class LocationDialogComponent {
  locationForm: FormGroup;
  locations = [
    'Kyiv Hayatt Hotel',
    'Kyiv International Airport',
    'Kyiv Central Station',
    'Kyiv Olympic Stadium'
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<LocationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pickupLocation: string, dropoffLocation: string }
  ) {
    this.locationForm = this.fb.group({
      pickupLocation: [data.pickupLocation, Validators.required],
      dropoffLocation: [data.dropoffLocation, Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.locationForm.valid) {
      this.dialogRef.close({
        pickupLocation: this.locationForm.get('pickupLocation')?.value,
        dropoffLocation: this.locationForm.get('dropoffLocation')?.value
      });
    }
  }
}