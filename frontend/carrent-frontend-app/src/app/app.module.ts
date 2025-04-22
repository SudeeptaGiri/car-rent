import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './pages/main/main.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { MapviewComponent } from './components/mapview/mapview.component';
import { LocationService } from './services/locations.service';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { FaqComponent } from './components/faq/faq.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CardsComponent } from './components/cards/cards.component';
import { FilterComponent } from './components/filter/filter.component';
import { FormsModule ,ReactiveFormsModule } from '@angular/forms';
import { CalendarComponent } from './components/calendar/calendar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    HeaderComponent,
    FooterComponent,
    MapviewComponent,
    AboutUsComponent,
    FaqComponent,
    CardsComponent,
    FilterComponent,
    CalendarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    FormsModule,
    CommonModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule
  ],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
