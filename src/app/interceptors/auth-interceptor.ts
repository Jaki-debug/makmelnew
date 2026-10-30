import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { Auth } from '../services/auth';
import { ClientAuthService } from '../services/client-auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

const auth = inject(Auth);

const clientAuth = inject(ClientAuthService);
const router = inject(Router);

/*

============================================================
REQUÊTES CLIENT
============================================================
*/

const isClientRequest =
req.url.includes('/api/v1/customers') ||
req.url.includes('/api/v1/products') ||
req.url.includes('/api/v1/categories') ||
req.url.includes('/api/v1/files') ||
req.url.includes('/api/v1/cart') ||
req.url.includes('/api/v1/orders') ||
req.url.includes('/api/v1/delivery') ||
req.url.includes('/api/v1/promotions') ||
req.url.includes('/api/v1/coupons');

if (isClientRequest) {

const clientToken =
  clientAuth.getAccessToken();


/*
 * Requêtes client sans token :
 *
 * Elles doivent rester publiques.
 * On ne fait aucun refresh et aucune redirection
 * vers le login administrateur.
 */

if (!clientToken) {

  const publicClientRequest =
    req.clone({
      withCredentials: true
    });

  return next(publicClientRequest);

}


/*
 * Requête client avec token.
 */

const clientRequest =
  req.clone({

    withCredentials: true,

    setHeaders: {
      Authorization:
        'Bearer ' + clientToken
    }

  });


return next(clientRequest).pipe(

  catchError((error) => {

    /*
     * Un 401 sur une requête client :
     * on tente le refresh CLIENT.
     */

    if (error.status !== 401) {

      return throwError(
        () => error
      );

    }


    /*
     * Évite de faire un refresh sur le refresh lui-même.
     */

    if (
      req.url.includes('/api/v1/customers/refresh')
    ) {

      clientAuth.effacerClientConnecte();

      return throwError(
        () => error
      );

    }


    return clientAuth.refresh().pipe(

      switchMap((response: any) => {

        const nouveauToken =
          response?.data?.accessToken ||
          response?.accessToken ||
          response?.token;


        if (!nouveauToken) {

          clientAuth.effacerClientConnecte();

          return throwError(
            () => error
          );

        }


        clientAuth.setAccessToken(
          nouveauToken
        );


        const retryRequest =
          req.clone({

            withCredentials: true,

            setHeaders: {
              Authorization:
                'Bearer ' + nouveauToken
            }

          });


        return next(retryRequest);

      }),

      catchError((refreshError) => {

        clientAuth.effacerClientConnecte();

        /*
         * IMPORTANT :
         *
         * On ne redirige PAS vers /login.
         *
         * Une personne qui visite le catalogue
         * peut être totalement anonyme.
         */

        return throwError(
          () => refreshError
        );

      })

    );

  })

);

}

/*

============================================================
REQUÊTES ADMIN
============================================================
*/

const token =
auth.getToken();

const isLoginRequest =
req.url.includes('/auth/login');

const isMfaVerifyRequest =
req.url.includes('/auth/mfa/verify');

const isRefreshRequest =
req.url.includes('/auth/refresh');

const isLogoutRequest =
req.url.includes('/auth/logout');

const isPasswordChangeRequiredRequest =
req.url.includes('/auth/change-password-required');

const authReq =
req.clone({

  withCredentials: true,

  setHeaders: token
    ? {
        Authorization:
          'Bearer ' + token
      }
    : {}

});

return next(authReq).pipe(

catchError((error) => {

  if (
    error.status === 401 &&
    !isLoginRequest &&
    !isMfaVerifyRequest &&
    !isRefreshRequest &&
    !isLogoutRequest &&
    !isPasswordChangeRequiredRequest
  ) {

    return auth.refresh().pipe(

      switchMap((response: any) => {

        const nouveauToken =
          response?.data?.accessToken ||
          response?.accessToken ||
          response?.token;


        if (!nouveauToken) {

          auth.clearSession();

          router.navigate([
            '/login'
          ]);

          return throwError(
            () => error
          );

        }


        auth.setToken(
          nouveauToken
        );


        const retryReq =
          req.clone({

            withCredentials: true,

            setHeaders: {
              Authorization:
                'Bearer ' + nouveauToken
            }

          });


        return next(retryReq);

      }),

      catchError((refreshError) => {

        auth.clearSession();

        router.navigate([
          '/login'
        ]);

        return throwError(
          () => refreshError
        );

      })

    );

  }


  return throwError(
    () => error
  );

})

);

};