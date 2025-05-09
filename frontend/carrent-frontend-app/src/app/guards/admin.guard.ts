import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { RoleAssignmentService } from '../services/role-assignment.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const roleService = inject(RoleAssignmentService);
  
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = roleService.isAdmin();

  if (isAuthenticated && isAdmin) {
    return true;
  } else {
    return router.createUrlTree(['/main']);
  }
};