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
    // Get user from AuthService instead of directly from sessionStorage
    this.user = this.authService.getCurrentUser();
    
    // Subscribe to user changes
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
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
    } else if (url.startsWith('/dashboard')) {
      this.selectedTab = 'dashboard';
    } else if (url.startsWith('/bookings')) {
      this.selectedTab = 'bookings';
    } else if (url.startsWith('/clients')) {
      this.selectedTab = 'clients';
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
      case 'dashboard':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
  
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isClient(): boolean {
    return this.isAuthenticated() && this.user?.role === 'Client';
  }

  isAdmin(): boolean {
    return this.isAuthenticated() && this.user?.role === 'Admin';
  }

  isSupportAgent(): boolean {
    return this.isAuthenticated() && this.user?.role === 'SupportAgent';
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
    this.router.navigate(['/']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
  
  // Get the first letter of the user's first name for the avatar
  getInitial(): string {
    if (this.user && this.user.firstName) {
      return this.user.firstName.charAt(0).toUpperCase();
    }
    return '?';
  }

  @HostListener('window:resize', [])
  onResize() {
    if (window.innerWidth > 640 && this.menuOpen) {
      this.menuOpen = false;
    }
  }
}