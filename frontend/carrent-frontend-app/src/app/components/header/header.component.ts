import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { RoleAssignmentService } from '../../services/role-assignment.service';
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

  constructor(
    private authService: AuthService, 
    private roleService: RoleAssignmentService,
    private router: Router
  ) {}

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
    } else if (url.startsWith('/reports')) {
      this.selectedTab = 'reports';
    } else {
      this.selectedTab = '';
    }
  }

  goToReports(): void {
    this.router.navigate(['/reports']);
    this.dropdownOpen = false; // Close the dropdown after navigation
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
      case 'reports':
        this.router.navigate(['/reports']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.roleService.isAdmin();
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
