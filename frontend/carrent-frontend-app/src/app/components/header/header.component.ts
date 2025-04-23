import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/users';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  menuOpen = false;
  user: User | null = null;
  dropdownOpen = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const userData = sessionStorage.getItem('currentUser');
    this.user = userData ? JSON.parse(userData) : null;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.user = null;
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  @HostListener('window:resize', [])
  onResize() {
    if (window.innerWidth > 640 && this.menuOpen) {
      this.menuOpen = false;
    }
  }
}
