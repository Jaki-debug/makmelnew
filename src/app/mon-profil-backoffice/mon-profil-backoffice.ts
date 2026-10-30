import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

interface Utilisateur {
id: string;
email: string;
firstName: string;
lastName: string;
roles: string[];
permissions: string[];
mfaEnabled: boolean;
mustChangePassword: boolean;
}

interface ProfilResponse {
success: boolean;
data: Utilisateur;
message?: string;
}

@Component({
selector: 'app-mon-profil-backoffice',
standalone: false,
templateUrl: './mon-profil-backoffice.html',
styleUrl: './mon-profil-backoffice.css'
})
export class MonProfilBackoffice implements OnInit {

utilisateur: Utilisateur | null = null;

chargement = true;

erreur = '';

constructor(
private auth: Auth,
private router: Router
) {}

ngOnInit(): void {

this.utilisateur =
  this.auth.getUtilisateur();

if (this.utilisateur) {
  this.chargement = false;
  return;
}

this.chargerProfil();

}

chargerProfil(): void {

if (!this.auth.getToken()) {
  this.router.navigate([
    '/login'
  ]);
  return;
}

this.auth.me().subscribe({

  next: (
    response: ProfilResponse
  ) => {

    console.log(
      'Réponse /me profil :',
      response
    );

    this.utilisateur =
      response?.data || null;

    if (this.utilisateur) {

      this.auth.setUtilisateur(
        this.utilisateur
      );
    }

    this.chargement = false;

  },

  error: (
    error
  ) => {

    console.error(
      'ERREUR CHARGEMENT PROFIL :',
      error
    );

    this.chargement = false;

    if (
      error.status === 401
    ) {

      this.auth.clearSession();

      this.router.navigate([
        '/login'
      ]);

      return;
    }

    this.erreur =
      error?.error?.error?.message ||
      error?.error?.message ||
      'Impossible de récupérer votre profil.';

  }

});

}

get nomComplet(): string {

if (!this.utilisateur) {
  return 'Utilisateur';
}

const prenom =
  this.utilisateur.firstName || '';

const nom =
  this.utilisateur.lastName || '';

return (
  `${prenom} ${nom}`.trim() ||
  'Utilisateur'
);

}

get initiales(): string {

if (!this.utilisateur) {
  return 'U';
}

const prenom =
  this.utilisateur.firstName?.charAt(0) || '';

const nom =
  this.utilisateur.lastName?.charAt(0) || '';

return (
  `${prenom}${nom}`.toUpperCase() ||
  'U'
);

}

get rolePrincipal(): string {

if (
  !this.utilisateur ||
  !this.utilisateur.roles ||
  this.utilisateur.roles.length === 0
) {
  return 'Utilisateur';
}

const role =
  this.utilisateur.roles[0];

const roles: {
  [key: string]: string
} = {

  SUPER_ADMIN:
    'Super administrateur',

  SUPER_ADMINISTRATEUR:
    'Super administrateur',

  DIRECTION:
    'Direction',

  GESTIONNAIRE_BOUTIQUE:
    'Gestionnaire boutique',

  GESTIONNAIRE_RESTAURANT:
    'Gestionnaire restaurant',

  GESTIONNAIRE_RESIDENCE:
    'Gestionnaire résidence',

  COMPTABLE:
    'Comptable',

  MARKETING:
    'Marketing',

  CLIENT:
    'Client'
};

return (
  roles[role] ||
  role
    .replace(
      /_/g,
      ' '
    )
    .toLowerCase()
    .replace(
      /^\w/,
      (
        lettre: string
      ) =>
        lettre.toUpperCase()
    )
);

}

retourner(): void {

this.router.navigate([
  '/'
]);

}

}