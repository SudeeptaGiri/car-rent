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
        this.updateSelectedTab(event.urlAfterRedirects);
      });
  
    // Set initially based on current URL
    this.updateSelectedTab(this.router.url);
  }
  
  updateSelectedTab(url: string) {
    if (url === '/' || url === '/main') {
      this.selectedTab = 'home';
    } else if (url.startsWith('/cars')) {
      this.selectedTab = 'cars';
    } else if (url.startsWith('/my-bookings')) {
      this.selectedTab = 'bookings';
    } else {
      this.selectedTab = '';
    }
  }
  
  setActiveTab(tab: string) {
    this.selectedTab = tab;
    switch (tab) {
      case 'home':
        this.router.navigate(['/main']);
        break;
      case 'cars':
        this.router.navigate(['/cars']);
        break;
      case 'bookings':
        this.router.navigate(['/my-bookings']);
        break;
      default:
        this.router.navigate(['/']);
    }
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
