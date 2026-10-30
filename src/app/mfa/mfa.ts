import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
selector: 'app-mfa',
standalone: false,
templateUrl: './mfa.html',
styleUrl: './mfa.css'
})
export class Mfa {

code = '';
erreur = '';
chargement = false;

constructor(
private auth: Auth,
private router: Router
) {}

verifierCode(): void {

this.erreur = '';

if (!this.code || this.code.length !== 6) {
  this.erreur =
    'Veuillez saisir le code MFA à 6 chiffres.';
  return;
}

const mfaToken = this.auth.getMfaToken();

if (!mfaToken) {
  this.erreur =
    'Session MFA introuvable. Veuillez vous reconnecter.';

  this.router.navigate(['/login']);

  return;
}

this.chargement = true;

this.auth.verifyMfa(
  mfaToken,
  this.code
).subscribe({

  next: (response) => {

    this.chargement = false;

    console.log(
      'Réponse MFA :',
      response
    );

    if (
      !response.success ||
      !response.data
    ) {

      this.erreur =
        response.message ||
        'Réponse MFA invalide.';

      return;
    }

    if (
      response.data.passwordChangeToken
    ) {

      this.auth.setPasswordChangeToken(
        response.data.passwordChangeToken
      );

      console.log(
        'Password change token enregistré.'
      );

      this.router.navigate([
        '/changer-mot-de-passe'
      ]);

      return;
    }

    if (
      !response.data.accessToken ||
      !response.data.user
    ) {

      this.erreur =
        response.message ||
        'Réponse MFA invalide.';

      return;
    }

    this.auth.saveSession(
      response.data.accessToken,
      response.data.user
    );

    console.log(
      'Nouveau token enregistré :',
      this.auth.getToken()
    );

    console.log(
      'Utilisateur enregistré :',
      this.auth.getUtilisateur()
    );

    this.router.navigate(['/']);
  },

  error: (error) => {

    this.chargement = false;

    console.error(
      'Erreur MFA :',
      error
    );

    if (error.status === 401) {

      this.erreur =
        'Code MFA incorrect ou expiré.';

    } else if (error.status === 429) {

      this.erreur =
        'Trop de tentatives. Veuillez patienter.';

    } else {

      this.erreur =
        'Une erreur est survenue lors de la vérification.';
    }
  }

});

}
}