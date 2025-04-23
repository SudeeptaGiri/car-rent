import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './pages/main/main.component';
import { CarBookingPageComponent } from './pages/car-booking-page/car-booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import { EditBookingPageComponent } from './pages/edit-booking-page/edit-booking-page.component';

const routes: Routes = [
  {path:"login", component:LoginComponent},
  {path:"register", component:RegisterComponent},
  {path: 'main', component: MainComponent, pathMatch: 'full'},
  {path: '', redirectTo: 'main', pathMatch: 'full'},
  { path: 'cars', component: CarBookingPageComponent, pathMatch: 'full' }, 
  { path: 'my-bookings', component: MyBookingsPageComponent, pathMatch: 'full' }, 
  { path: 'edit-booking/:id', component: EditBookingPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
