import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CarDetailsPopupComponent } from './components/car-details-popup/car-details-popup.component';
import { NotificationComponent } from './components/notification/notification.component';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';

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

// Services
import { LocationService } from './services/locations.service';

// Angular Material Modules
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';

// Forms
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    LoginComponent,
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
    DateRangePickerComponent
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
    MatFormFieldModule
  ],
  providers: [ provideHttpClient(),LocationService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
