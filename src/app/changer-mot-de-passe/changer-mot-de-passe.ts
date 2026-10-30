import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
selector: 'app-changer-mot-de-passe',
standalone: false,
templateUrl: './changer-mot-de-passe.html',
styleUrls: ['./changer-mot-de-passe.css']
})
export class ChangerMotDePasse {

ancienMotDePasse = '';
nouveauMotDePasse = '';
confirmationMotDePasse = '';

chargement = false;
erreur = '';
succes = '';

constructor(
private auth: Auth,
private router: Router
) {}

changerMotDePasse(): void {

this.erreur = '';
this.succes = '';

if (
  !this.ancienMotDePasse ||
  !this.nouveauMotDePasse ||
  !this.confirmationMotDePasse
) {
  this.erreur =
    'Veuillez remplir tous les champs.';
  return;
}

if (this.nouveauMotDePasse.length < 8) {
  this.erreur =
    'Le mot de passe doit contenir au moins 8 caractères.';
  return;
}

if (this.nouveauMotDePasse.length > 72) {
  this.erreur =
    'Le mot de passe ne doit pas dépasser 72 caractères.';
  return;
}

if (!/[a-z]/.test(this.nouveauMotDePasse)) {
  this.erreur =
    'Le mot de passe doit contenir au moins une lettre minuscule.';
  return;
}

if (!/[A-Z]/.test(this.nouveauMotDePasse)) {
  this.erreur =
    'Le mot de passe doit contenir au moins une lettre majuscule.';
  return;
}

if (!/\d/.test(this.nouveauMotDePasse)) {
  this.erreur =
    'Le mot de passe doit contenir au moins un chiffre.';
  return;
}

if (
  this.nouveauMotDePasse ===
  this.ancienMotDePasse
) {
  this.erreur =
    'Le nouveau mot de passe doit être différent du mot de passe temporaire.';
  return;
}

if (
  this.nouveauMotDePasse !==
  this.confirmationMotDePasse
) {
  this.erreur =
    'Les nouveaux mots de passe ne correspondent pas.';
  return;
}

const passwordChangeToken =
  this.auth.getPasswordChangeToken();

if (!passwordChangeToken) {
  this.erreur =
    'Session de changement de mot de passe introuvable. Veuillez vous reconnecter.';
  return;
}

this.chargement = true;

this.auth.changePasswordRequired(
  passwordChangeToken,
  this.ancienMotDePasse,
  this.nouveauMotDePasse
).subscribe({

  next: (response) => {

    this.chargement = false;

    console.log(
      'Réponse changement obligatoire :',
      response
    );

    this.succes =
      'Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la connexion.';

    this.auth.clearSession();

    setTimeout(() => {

      this.router.navigate([
        '/login'
      ]);

    }, 1200);
  },

  error: (error) => {

    this.chargement = false;

    console.error(
      'Erreur changement mot de passe :',
      error
    );

    console.error(
      'Détail backend :',
      error.error
    );

    console.error(
      'Message backend :',
      error.error?.error?.message
    );

    console.error(
      'Code backend :',
      error.error?.error?.code
    );

    const code =
      error.error?.error?.code;

    const message =
      error.error?.error?.message;

    if (
      code === 'PASSWORD_CHANGE_TOKEN_INVALID'
    ) {

      this.erreur =
        'Votre session de changement de mot de passe a expiré ou n’est plus valide. Veuillez demander une nouvelle réinitialisation.';

    } else if (
      code === 'ACCOUNT_INACTIVE'
    ) {

      this.erreur =
        'Votre compte est désactivé.';

    } else if (
      code === 'ACCOUNT_LOCKED'
    ) {

      this.erreur =
        message ||
        'Votre compte est temporairement verrouillé.';

    } else if (
      error.status === 400
    ) {

      this.erreur =
        message ||
        'Les données envoyées sont invalides.';

    } else if (
      error.status === 401
    ) {

      this.erreur =
        message ||
        'Votre session de changement de mot de passe a expiré.';

    } else if (
      error.status === 403
    ) {

      this.erreur =
        message ||
        'Vous n’êtes pas autorisé à effectuer ce changement.';

    } else {

      this.erreur =
        message ||
        'Une erreur est survenue lors du changement du mot de passe.';
    }
  }
});

}

seDeconnecter(): void {

this.auth.logout().subscribe({

  next: () => {

    this.auth.clearSession();

    this.router.navigate([
      '/login'
    ]);
  },

  error: () => {

    this.auth.clearSession();

    this.router.navigate([
      '/login'
    ]);
  }
});

}
}

