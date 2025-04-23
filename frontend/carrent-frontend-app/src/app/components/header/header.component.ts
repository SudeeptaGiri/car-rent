import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('window:resize', [])
  onResize() {
    if (window.innerWidth > 640 && this.menuOpen) {
      this.menuOpen = false;
    }
  }
}

