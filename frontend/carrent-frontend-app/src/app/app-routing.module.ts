// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CarBookingPageComponent } from './pages/car-booking-page/car-booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import { EditBookingPageComponent } from './pages/edit-booking-page/edit-booking-page.component';


const routes: Routes = [
  { path: 'cars', component: CarBookingPageComponent, pathMatch: 'full' }, // Default route
  { path: 'my-bookings', component: MyBookingsPageComponent, pathMatch: 'full' }, // Default route
  { path: 'edit-booking/:id', component: EditBookingPageComponent },
  { path: '', redirectTo: '/car-booking', pathMatch: 'full' } // Default route

];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Enable tracing for debugging
  exports: [RouterModule]
})
export class AppRoutingModule { }