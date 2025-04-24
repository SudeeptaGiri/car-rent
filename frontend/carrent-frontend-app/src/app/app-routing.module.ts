import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './pages/main/main.component';
import { CarBookingPageComponent } from './pages/car-booking-page/car-booking-page.component';
import { MyBookingsPageComponent } from './pages/my-bookings-page/my-bookings-page.component';
import { EditBookingPageComponent } from './pages/edit-booking-page/edit-booking-page.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ReviewsComponent } from './components/profile/reviews/reviews.component';
import { PersonalInfoComponent } from './components/profile/personal-info/personal-info.component';
import { DocumentsComponent } from './components/profile/documents/documents.component';
import { ChangePasswordComponent } from './components/profile/change-password/change-password.component';


const routes: Routes = [
  {path:"login", component:LoginComponent},
  {path:"register", component:RegisterComponent},
  {
    path: "profile", 
    component: ProfileComponent,
    children: [
      { path: 'reviews', component: ReviewsComponent },
      { path: 'personal-info', component: PersonalInfoComponent },
      { path: 'documents', component: DocumentsComponent },
      { path: 'change-password', component: ChangePasswordComponent },
      { path: '', redirectTo: 'reviews', pathMatch: 'full' } // Default route
    ]
  },
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
