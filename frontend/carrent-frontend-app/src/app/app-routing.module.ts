import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MainComponent } from './pages/main/main.component';
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
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
