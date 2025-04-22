import { Component } from '@angular/core';
import { RoleAssignmentService } from '../../services/role-assignment.service';

@Component({
  selector: 'app-user-role',
  standalone: false,
  templateUrl: './user-role.component.html',
  styleUrl: './user-role.component.css'
})
export class UserRoleComponent {
  displayName: string = 'Visitor';
  role: string = 'Visitor';

  constructor(private roleService: RoleAssignmentService) {}

  ngOnInit(): void {
    this.displayName = this.roleService.getDisplayName();
    this.role = this.roleService.getCurrentUserRole();
  }
  isLoggedIn(): boolean {
    return this.roleService.isLoggedIn();
  }
}

