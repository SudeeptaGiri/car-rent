// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { IconSetService } from '@coreui/icons-angular';

import { 
  cilCalendar, 
  cilClock, 
  cilArrowLeft, 
  cilArrowRight,
  cilX
} from '@coreui/icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'car-rental-app';

  constructor(private iconSetService: IconSetService) {
    // Register the icons
    iconSetService.icons = { 
      cilCalendar, 
      cilClock, 
      cilArrowLeft, 
      cilArrowRight,
      cilX
    };
  }

  ngOnInit(): void {}
}