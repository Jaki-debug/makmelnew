import {
ChangeDetectorRef,
Component
} from '@angular/core';

import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-compte',
standalone: false,
templateUrl: './client-compte.html',
styleUrl: './client-compte.css'
})
export class ClientCompte {

client: any = null;

chargement = true;
erreur = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {

this.chargerCompte();

}

chargerCompte(): void {

this.chargement = true;
this.erreur = '';

this.changeDetectorRef.detectChanges();

this.clientAuthService
  .getProfil()
  .subscribe({

    next: (response: any) => {

      this.client =
        response?.data ??
        response ??
        null;

      this.chargement = false;

      this.changeDetectorRef.detectChanges();
    },

    error: (error: any) => {

      console.error(
        'Erreur chargement compte :',
        error
      );

      this.chargement = false;

      if (error?.status === 401) {

        this.router.navigate([
          '/client/connexion'
        ]);

        return;
      }

      this.erreur =
        'Impossible de charger votre compte.';

      this.changeDetectorRef.detectChanges();
    }

  });

}

allerAuProfil(): void {

this.router.navigate([
  '/client/profil'
]);

}

allerAuxAdresses(): void {

this.router.navigate([
  '/client/adresses'
]);

}

allerALaSecurite(): void {

this.router.navigate([
  '/client/securite'
]);

}

allerAuxConsentements(): void {

this.router.navigate([
  '/client/consentements'
]);

}

deconnecter(): void {

this.clientAuthService
  .deconnecter()
  .subscribe({

    next: () => {

      this.clientAuthService
        .effacerClientConnecte();

      this.router.navigate([
        '/client/connexion'
      ]);

    },

    error: (error: any) => {

      console.error(
        'Erreur déconnexion :',
        error
      );

      this.clientAuthService
        .effacerClientConnecte();

      this.router.navigate([
        '/client/connexion'
      ]);

    }

  });

}

retourAccueil(): void {

this.router.navigate([
  '/client'
]);

}

}

