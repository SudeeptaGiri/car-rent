import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CarDetailsPopupComponent } from './components/car-details-popup/car-details-popup.component';
import { NotificationComponent } from './components/notification/notification.component';
import { HttpClientModule } from '@angular/common/http';

// Pages
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';

// Components
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { MapviewComponent } from './components/mapview/mapview.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { FaqComponent } from './components/faq/faq.component';
import { CardsComponent } from './components/cards/cards.component';
import { FilterComponent } from './components/filter/filter.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { UserRoleComponent } from './components/user-role/user-role.component';
import {  FeedbacksComponent } from './components/feedbacks/feedbacks.component';

// Services
import { LocationService } from './services/locations.service';
import { FilterService } from './services/filter.service';

// Angular Material Modules
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

// Forms
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

// Angular Material modules
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { CarBookingComponent } from './components/car-booking/car-booking.component';
import { LocationDialogComponent } from './components/location-dialog/location-dialog.component';
import { CarReservedDialogComponent } from './components/car-reserved-dialog/car-reserved-dialog.component';

import { MyBookingsComponent } from './components/my-bookings/my-bookings.component';
import { CancelBookingDialogComponent } from './components/cancel-booking-dialog/cancel-booking-dialog.component';
import { BookingCancelledDialogComponent } from './components/booking-cancelled-dialog/booking-cancelled-dialog.component';
import { FeedbackDialogComponent } from './components/feedback-dialog/feedback-dialog.component';
import { ViewFeedbackDialogComponent } from './components/view-feedback-dialog/view-feedback-dialog.component';
import { CarBookingPageComponent } from './pages/car-booking-page/car-booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import { BookingSuccessDialogComponent } from './components/booking-success-dialog/booking-success-dialog.component';
import { EditBookingComponent } from './components/edit-booking/edit-booking.component';
import { EditBookingPageComponent } from './pages/edit-booking-page/edit-booking-page.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ReviewsComponent } from './components/profile/reviews/reviews.component';
import { PersonalInfoComponent } from './components/profile/personal-info/personal-info.component';
import { DocumentsComponent } from './components/profile/documents/documents.component';
import { ChangePasswordComponent } from './components/profile/change-password/change-password.component';
import { TruncatePipe } from './pipes/truncate.pipe';
import { CarsComponent } from './pages/cars/cars.component';
import { ReportsComponent } from './pages/reports/reports.component';

import { ToastrModule } from 'ngx-toastr';
import { BookingsComponent } from './pages/bookings/bookings.component';


@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
    FeedbacksComponent,
    MainComponent,
    HeaderComponent,
    FooterComponent,
    MapviewComponent,
    AboutUsComponent,
    FaqComponent,
    CardsComponent,
    FilterComponent,
    CalendarComponent,
    UserRoleComponent,
    CarDetailsPopupComponent,
    NotificationComponent,
    CarBookingComponent,
    CalendarComponent,
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
    ProfileComponent,
    ReviewsComponent,
    PersonalInfoComponent,
    DocumentsComponent,
    ChangePasswordComponent,
    TruncatePipe,
    CarsComponent,
    ReportsComponent,
    BookingsComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    BookingSuccessDialogComponent,
    ReactiveFormsModule,
    HttpClientModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatSelectModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
  ],
  providers: [ provideHttpClient(),LocationService,FilterService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
    

    

