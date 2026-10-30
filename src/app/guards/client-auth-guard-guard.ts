
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

export const clientAuthGuardGuard: CanActivateFn = (route, state) => {
  const clientAuth = inject(ClientAuthService);
  const router = inject(Router);

  if (clientAuth.getAccessToken()) {
    return true;
  }

  return router.createUrlTree(['/client/connexion'], {
    queryParams: {
      returnUrl: state.url
    }
  });
};