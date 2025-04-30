import { Component } from '@angular/core';
import { User } from './../../models/users';
import { AuthService } from './../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  isLoggedIn: boolean = false;
  constructor(private authService: AuthService) {}
  ngOnInit() {  
    const userData = sessionStorage.getItem('currentUser');
    this.isLoggedIn = !!userData;
  }

}
