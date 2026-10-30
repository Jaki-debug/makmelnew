import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    // Vérifier la connexion administrateur
    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login']);
    }

    // Vérifier les permissions
    if (auth.hasPermission(permission)) {
      return true;
    }

    // Administrateur connecté, mais permission insuffisante
    return router.createUrlTree(['/admin/dashboard']);
  };
};