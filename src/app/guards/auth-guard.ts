
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Autoriser l'accès si l'administrateur est connecté
  if (auth.isLoggedIn()) {
    return true;
  }

  // Sinon, rediriger vers la connexion Admin
  // et conserver la page demandée
  return router.createUrlTree(['/connexion-admin'], {
    queryParams: {
      returnUrl: state.url
    }
  });
};
