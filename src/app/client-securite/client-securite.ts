import {
ChangeDetectorRef,
Component
} from '@angular/core';

import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-securite',
standalone: false,
templateUrl: './client-securite.html',
styleUrl: './client-securite.css'
})
export class ClientSecurite {

ancienMotDePasse = '';
nouveauMotDePasse = '';
confirmationMotDePasse = '';

sauvegarde = false;

erreur = '';
succes = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

modifierMotDePasse(): void {

this.erreur = '';
this.succes = '';

if (
  !this.ancienMotDePasse.trim() ||
  !this.nouveauMotDePasse.trim() ||
  !this.confirmationMotDePasse.trim()
) {
  this.erreur =
    'Veuillez remplir tous les champs.';

  this.changeDetectorRef.detectChanges();

  return;
}

if (this.nouveauMotDePasse.length < 8) {
  this.erreur =
    'Le nouveau mot de passe doit contenir au moins 8 caractères.';

  this.changeDetectorRef.detectChanges();

  return;
}

if (
  this.nouveauMotDePasse !==
  this.confirmationMotDePasse
) {
  this.erreur =
    'La confirmation du mot de passe ne correspond pas.';

  this.changeDetectorRef.detectChanges();

  return;
}

this.sauvegarde = true;

this.changeDetectorRef.detectChanges();

const donnees = {
  currentPassword: this.ancienMotDePasse,
  newPassword: this.nouveauMotDePasse
};

this.clientAuthService
  .changerMotDePasse(donnees)
  .subscribe({

    next: () => {

      this.sauvegarde = false;

      this.ancienMotDePasse = '';
      this.nouveauMotDePasse = '';
      this.confirmationMotDePasse = '';

      this.succes =
        'Votre mot de passe a été modifié avec succès.';

      this.changeDetectorRef.detectChanges();
    },

    error: (error: any) => {

      console.error(
        'Erreur modification mot de passe :',
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
          'Impossible de modifier votre mot de passe.';
      }

      this.changeDetectorRef.detectChanges();
    }

  });

}

retourProfil(): void {

this.router.navigate([
  '/client/profil'
]);

}

}

