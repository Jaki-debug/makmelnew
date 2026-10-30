import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Auth } from '../services/auth';

@Component({
selector: 'app-securite',
standalone: false,
templateUrl: './securite.html',
styleUrl: './securite.css'
})
export class Securite implements OnInit {

motDePasseActuel = '';
nouveauMotDePasse = '';
confirmationMotDePasse = '';

afficherMotDePasseActuel = false;
afficherNouveauMotDePasse = false;
afficherConfirmation = false;

chargement = false;

mfaActive = false;
chargementMfa = true;
mfaEnConfiguration = false;
mfaSecret = '';
otpauthUrl = '';
codeMfa = '';
confirmationMfaEnCours = false;

afficherDesactivationMfa = false;
codeDesactivationMfa = '';
desactivationMfaEnCours = false;

constructor(
private auth: Auth,
private router: Router,
private snackBar: MatSnackBar,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
console.log('PAGE SECURITE CHARGEE');
this.chargerEtatMfa();
}

chargerEtatMfa(): void {
this.auth.me().subscribe({
next: (response) => {
console.log('Réponse /me dans sécurité :', response);

    const utilisateur = response?.data || response;

    this.mfaActive = utilisateur?.mfaEnabled === true;
    this.chargementMfa = false;

    console.log('Etat MFA :', this.mfaActive);
    console.log('Chargement MFA :', this.chargementMfa);

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error('Erreur récupération état MFA :', error);

    this.chargementMfa = false;

    this.cdr.detectChanges();
  }
});

}

changerMotDePasse(): void {
console.log('BOUTON MODIFIER CLIQUÉ');

if (
  !this.motDePasseActuel ||
  !this.nouveauMotDePasse ||
  !this.confirmationMotDePasse
) {
  this.afficherNotification(
    'Veuillez remplir tous les champs.',
    'error'
  );
  return;
}

if (this.nouveauMotDePasse.length < 8) {
  this.afficherNotification(
    'Le nouveau mot de passe doit contenir au moins 8 caractères.',
    'error'
  );
  return;
}

if (this.nouveauMotDePasse !== this.confirmationMotDePasse) {
  this.afficherNotification(
    'La confirmation du nouveau mot de passe ne correspond pas.',
    'error'
  );
  return;
}

if (this.motDePasseActuel === this.nouveauMotDePasse) {
  this.afficherNotification(
    'Le nouveau mot de passe doit être différent de l’ancien.',
    'error'
  );
  return;
}

this.chargement = true;

this.auth.changePassword(
  this.motDePasseActuel,
  this.nouveauMotDePasse
).subscribe({
  next: (response) => {
    console.log(
      'Réponse changement mot de passe :',
      response
    );

    this.chargement = false;

    this.motDePasseActuel = '';
    this.nouveauMotDePasse = '';
    this.confirmationMotDePasse = '';

    this.afficherNotification(
      'Mot de passe modifié avec succès. Veuillez vous reconnecter.',
      'success'
    );

    setTimeout(() => {
      this.auth.clearSession();
      this.router.navigate(['/login']);
    }, 1500);
  },

  error: (error) => {
    console.error(
      'Erreur changement mot de passe :',
      error
    );

    this.chargement = false;

    let message =
      'Une erreur est survenue lors du changement de mot de passe.';

    if (error.status === 400) {
      message =
        error?.error?.error?.message ||
        'Les données envoyées sont invalides.';
    } else if (error.status === 401) {
      message =
        error?.error?.error?.message ||
        'Mot de passe actuel incorrect ou session expirée.';
    } else if (error.status === 429) {
      message =
        'Trop de tentatives. Veuillez patienter.';
    }

    this.afficherNotification(
      message,
      'error'
    );
  }
});

}

configurerMfa(): void {
if (this.mfaEnConfiguration) {
return;
}

this.mfaEnConfiguration = true;
this.mfaSecret = '';
this.otpauthUrl = '';
this.codeMfa = '';

this.auth.mfaSetup().subscribe({
  next: (response) => {
    console.log('Réponse MFA setup :', response);
    console.log('DATA MFA :', response.data);

    this.mfaSecret = response.data.secret;
    this.otpauthUrl = response.data.otpauthUrl;

    console.log('SECRET MFA :', this.mfaSecret);
    console.log('OTPAUTH URL :', this.otpauthUrl);

    this.afficherNotification(
      'Secret MFA généré. Scannez le QR code avec Google Authenticator.',
      'success'
    );

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error(
      'Erreur MFA setup :',
      error
    );

    this.mfaEnConfiguration = false;

    let message =
      'Impossible de démarrer la configuration MFA.';

    if (error.status === 401) {
      message =
        'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      message =
        'Vous n’avez pas les permissions nécessaires pour configurer la MFA.';
    } else if (error.status === 429) {
      message =
        'Trop de tentatives. Veuillez patienter.';
    }

    this.afficherNotification(
      message,
      'error'
    );
  }
});

}

confirmerMfa(): void {
if (!this.codeMfa) {
this.afficherNotification(
'Veuillez saisir le code MFA.',
'error'
);
return;
}

if (!/^\d{6}$/.test(this.codeMfa)) {
  this.afficherNotification(
    'Le code MFA doit contenir exactement 6 chiffres.',
    'error'
  );
  return;
}

this.confirmationMfaEnCours = true;

this.auth.mfaConfirm(
  this.codeMfa
).subscribe({
  next: (response) => {
    console.log(
      'Réponse MFA confirm :',
      response
    );

    this.confirmationMfaEnCours = false;

    this.codeMfa = '';
    this.mfaEnConfiguration = false;
    this.mfaActive = true;
    this.mfaSecret = '';
    this.otpauthUrl = '';

    this.afficherNotification(
      response?.message ||
      'MFA activée avec succès.',
      'success'
    );

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error(
      'Erreur MFA confirm :',
      error
    );

    this.confirmationMfaEnCours = false;

    let message =
      'Impossible de confirmer la MFA.';

    if (error.status === 400) {
      message =
        error?.error?.error?.message ||
        'Le code MFA est invalide.';
    } else if (error.status === 401) {
      message =
        'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (error.status === 429) {
      message =
        'Trop de tentatives. Veuillez patienter.';
    }

    this.afficherNotification(
      message,
      'error'
    );
  }
});

}

annulerConfigurationMfa(): void {
this.mfaEnConfiguration = false;
this.mfaSecret = '';
this.otpauthUrl = '';
this.codeMfa = '';
}

afficherDesactivation(): void {
this.afficherDesactivationMfa = true;
this.codeDesactivationMfa = '';
}

annulerDesactivationMfa(): void {
this.afficherDesactivationMfa = false;
this.codeDesactivationMfa = '';
this.desactivationMfaEnCours = false;
}

desactiverMfa(): void {
if (!this.codeDesactivationMfa) {
this.afficherNotification(
'Veuillez saisir votre code MFA.',
'error'
);
return;
}

if (!/^\d{6}$/.test(this.codeDesactivationMfa)) {
  this.afficherNotification(
    'Le code MFA doit contenir exactement 6 chiffres.',
    'error'
  );
  return;
}

this.desactivationMfaEnCours = true;

this.auth.mfaDisable(
  this.codeDesactivationMfa
).subscribe({
  next: (response) => {
    console.log(
      'Réponse désactivation MFA :',
      response
    );

    this.desactivationMfaEnCours = false;
    this.codeDesactivationMfa = '';
    this.afficherDesactivationMfa = false;
    this.mfaActive = false;

    this.afficherNotification(
      response?.message ||
      'MFA désactivée avec succès.',
      'success'
    );

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error(
      'Erreur désactivation MFA :',
      error
    );

    this.desactivationMfaEnCours = false;

    let message =
      'Impossible de désactiver la MFA.';

    if (error.status === 400) {
      message =
        error?.error?.error?.message ||
        'Le code MFA est invalide.';
    } else if (error.status === 401) {
      message =
        'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      message =
        'Vous n’avez pas les permissions nécessaires.';
    } else if (error.status === 429) {
      message =
        'Trop de tentatives. Veuillez patienter.';
    }

    this.afficherNotification(
      message,
      'error'
    );
  }
});

}

afficherNotification(
message: string,
type: 'success' | 'error'
): void {
this.snackBar.open(
message,
'Fermer',
{
duration: 5000,
horizontalPosition: 'right',
verticalPosition: 'top',
panelClass:
type === 'success'
? ['notification-success']
: ['notification-error']
}
);
}

seDeconnecter(): void {
this.auth.logout().subscribe({
next: () => {
this.auth.clearSession();
this.router.navigate(['/login']);
},

  error: () => {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
});

}
}