import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-consentements',
standalone: false,
templateUrl: './client-consentements.html',
styleUrl: './client-consentements.css'
})
export class ClientConsentements implements OnInit {

consentements: any[] = [];

chargement = true;
sauvegarde = false;

erreur = '';
succes = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerConsentements();
}

chargerConsentements(): void {

this.chargement = true;
this.erreur = '';

this.changeDetectorRef.detectChanges();

this.clientAuthService
  .getConsentements()
  .subscribe({

    next: (response: any) => {

      this.consentements =
        response?.data ??
        response ??
        [];

      this.chargement = false;

      this.changeDetectorRef.detectChanges();
    },

    error: (error: any) => {

      console.error(
        'Erreur chargement consentements :',
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
        'Impossible de charger vos consentements.';

      this.changeDetectorRef.detectChanges();
    }

  });

}

obtenirNomConsentement(consentement: any): string {

return (
  consentement?.label ??
  consentement?.name ??
  consentement?.code ??
  'Consentement'
);

}

obtenirDescription(consentement: any): string {

return (
  consentement?.description ??
  'Gérer votre préférence concernant ce consentement.'
);

}

estActive(consentement: any): boolean {

return (
  consentement?.granted === true ||
  consentement?.accepted === true ||
  consentement?.enabled === true ||
  consentement?.value === true
);

}

modifierConsentement(
consentement: any,
event: Event
): void {

const input =
  event.target as HTMLInputElement;

consentement.granted = input.checked;

this.changeDetectorRef.detectChanges();

}

enregistrer(): void {

this.erreur = '';
this.succes = '';

const consents = this.consentements.map(
  (consentement: any) => ({
    code:
      consentement.code ??
      consentement.name,

    granted:
      this.estActive(consentement)
  })
);

this.sauvegarde = true;

this.changeDetectorRef.detectChanges();

this.clientAuthService
  .modifierConsentements(consents)
  .subscribe({

    next: () => {

      this.sauvegarde = false;

      this.succes =
        'Vos préférences ont été enregistrées avec succès.';

      this.changeDetectorRef.detectChanges();
    },

    error: (error: any) => {

      console.error(
        'Erreur modification consentements :',
        error
      );

      this.sauvegarde = false;

      if (error?.status === 401) {

        this.router.navigate([
          '/client/connexion'
        ]);

        return;
      }

      if (error?.error?.error?.message) {

        this.erreur =
          error.error.error.message;

      } else if (error?.error?.message) {

        this.erreur =
          error.error.message;

      } else {

        this.erreur =
          'Impossible d’enregistrer vos préférences.';
      }

      this.changeDetectorRef.detectChanges();
    }

  });

}

retourCompte(): void {

this.router.navigate([
  '/client/compte'
]);

}

}