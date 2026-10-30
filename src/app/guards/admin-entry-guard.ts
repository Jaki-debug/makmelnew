import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const adminEntryGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // 1. Vérifier si la session administrateur est active
  if (auth.isLoggedIn()) {
    // Session active : ouvrir le tableau de bord
    return router.createUrlTree(['/admin-dashboard-mak']);
  }

  // 2. Session inactive : rediriger vers la connexion Admin
  return router.createUrlTree(['/connexion-admin'], {
    queryParams: {
      returnUrl: '/admin-dashboard-mak'
    }
  });
};