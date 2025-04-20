// notification.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

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

  onCancel() {
    this.cancel.emit();
  }

  onLogin() {
    this.login.emit();
  }
}