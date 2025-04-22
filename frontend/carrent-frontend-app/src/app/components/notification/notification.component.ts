// notification.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification',
  standalone: false,
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  @Input() show: boolean = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() login = new EventEmitter<void>();

  constructor(private router: Router) {}

  onCancel() {
    this.cancel.emit();
  }

  onLogin() {
    this.login.emit();
    this.router.navigate(['/login']);
  }
}