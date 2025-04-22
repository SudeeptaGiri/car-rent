import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';

// Angular Material modules
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { CarBookingComponent } from './components/car-booking/car-booking.component';
import { LocationDialogComponent } from './components/location-dialog/location-dialog.component';
import { CarReservedDialogComponent } from './components/car-reserved-dialog/car-reserved-dialog.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

import { MyBookingsComponent } from './components/my-bookings/my-bookings.component';
import { CancelBookingDialogComponent } from './components/cancel-booking-dialog/cancel-booking-dialog.component';
import { BookingCancelledDialogComponent } from './components/booking-cancelled-dialog/booking-cancelled-dialog.component';
import { FeedbackDialogComponent } from './components/feedback-dialog/feedback-dialog.component';
import { ViewFeedbackDialogComponent } from './components/view-feedback-dialog/view-feedback-dialog.component';
import { CarBookingPageComponent } from './pages/car-booking-page/car-booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import { AppRoutingModule } from './app-routing.module';
import { BookingSuccessDialogComponent } from './components/booking-success-dialog/booking-success-dialog.component';
import { EditBookingComponent } from './components/edit-booking/edit-booking.component';
import { EditBookingPageComponent } from './pages/edit-booking-page/edit-booking-page.component';

import {
  ButtonModule,
  CardModule,
  FormModule,
  GridModule
} from '@coreui/angular';
import { IconModule, IconSetService } from '@coreui/icons-angular';

@NgModule({
  declarations: [
    AppComponent,
    CarBookingComponent,
    // DatePickerDialogComponent,
    LocationDialogComponent,
    CarReservedDialogComponent,
    HeaderComponent,
    FooterComponent,
    MyBookingsComponent,
    FeedbackDialogComponent,
    BookingCancelledDialogComponent,
    CancelBookingDialogComponent,
    ViewFeedbackDialogComponent,
    CarBookingPageComponent,
    MyBookingsPageComponent,
    EditBookingComponent,
    EditBookingPageComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BookingSuccessDialogComponent,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSelectModule,

    ButtonModule,
    CardModule,
    FormModule,
    GridModule,
    IconModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this line
})
export class AppModule { }