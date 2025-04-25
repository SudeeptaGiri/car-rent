import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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
  selectedTab!: string;


  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const userData = sessionStorage.getItem('currentUser');
    this.user = userData ? JSON.parse(userData) : null;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log('Navigation event:', event); // Log the navigation event
        const url = event.urlAfterRedirects;
        console.log('Current URL:', url); // Log the current URL
        if (url === '/' || url === '/main') {
          this.selectedTab = 'home';
        } else if (url.includes('/cars')) {
          this.selectedTab = 'cars';
        } else if (url.includes('/my-bookings')) {
          this.selectedTab = 'bookings';
        } else {
          this.selectedTab = '';
        }
      });
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

setActiveTab(tab: string) {
  this.selectedTab = tab;
  let curRoute;
  switch (tab) {
    case 'home':
      curRoute = '';
      break;
    case 'cars':
      curRoute = 'main';
      break;
    case 'bookings':
      curRoute = 'my-bookings';
      break;
    default:
      curRoute = '';
  }

  this.router.navigate([`/${curRoute}`]);
}

}
