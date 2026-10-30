import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';
import { ClientAddress } from '../models/client-address';

@Component({
selector: 'app-client-adresses',
standalone: false,
templateUrl: './client-adresses.html',
styleUrl: './client-adresses.css'
})
export class ClientAdresses implements OnInit {

adresses: ClientAddress[] = [];

chargement = true;
erreur = '';
succes = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerAdresses();
}

chargerAdresses(): void {

this.chargement = true;
this.erreur = '';

this.changeDetectorRef.detectChanges();

this.clientAuthService.getAdresses().subscribe({

  next: (response: any) => {

    this.adresses =
      response?.data ??
      response ??
      [];

    this.chargement = false;

    this.changeDetectorRef.detectChanges();
  },

  error: (error: any) => {

    console.error(
      'Erreur chargement adresses :',
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
      'Impossible de charger vos adresses.';

    this.changeDetectorRef.detectChanges();
  }

});

}

ajouterAdresse(): void {

this.router.navigate([
  '/client/adresses/ajouter'
]);

}

modifierAdresse(adresse: ClientAddress): void {

this.router.navigate([
  '/client/adresses/modifier',
  adresse.id
]);

}

supprimerAdresse(adresse: ClientAddress): void {

if (!adresse?.id) {
  return;
}

const confirmation = confirm(
  'Voulez-vous vraiment supprimer cette adresse ?'
);

if (!confirmation) {
  return;
}

this.erreur = '';
this.succes = '';

this.changeDetectorRef.detectChanges();

this.clientAuthService
  .supprimerAdresse(adresse.id)
  .subscribe({

    next: () => {

      this.succes =
        'Adresse supprimée avec succès.';

      this.changeDetectorRef.detectChanges();

      this.chargerAdresses();
    },

    error: (error: any) => {

      console.error(
        'Erreur suppression adresse :',
        error
      );

      this.traiterErreur(error);
    }

  });

}

traiterErreur(error: any): void {

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
    'Une erreur est survenue. Veuillez réessayer.';
}

this.changeDetectorRef.detectChanges();

}

retourProfil(): void {

this.router.navigate([
  '/client/profil'
]);

}

}


