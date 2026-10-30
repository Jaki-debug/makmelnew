import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleSelect, User, UserService } from '../services/user';
import { Auth } from '../services/auth';

@Component({
selector: 'app-user-update',
standalone: false,
templateUrl: './user-update.html',
styleUrl: './user-update.css'
})
export class UserUpdate implements OnInit {

private auth = inject(Auth);

id = '';

email = '';
firstName = '';
lastName = '';
phone = '';

roleId = '';
roleIds: string[] = [];
roles: RoleSelect[] = [];

chargement = true;
chargementRoles = true;
enregistrement = false;

erreur = '';
erreurRoles = '';
succes = '';

constructor(
private route: ActivatedRoute,
private router: Router,
private userService: UserService,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {

const idUtilisateur = this.route.snapshot.paramMap.get('id');

if (!idUtilisateur) {
  this.erreur = 'Identifiant utilisateur introuvable.';
  this.chargement = false;
  this.chargementRoles = false;
  this.cdr.detectChanges();
  return;
}

this.id = idUtilisateur;

if (!this.hasPermission('users.update')) {
  this.erreur =
    'Vous n’avez pas la permission de modifier cet utilisateur.';
  this.chargement = false;
  this.chargementRoles = false;
  this.cdr.detectChanges();
  return;
}

this.chargerRoles();
this.chargerUtilisateur();

}

hasPermission(permission: string): boolean {
return this.auth.hasPermission(permission);
}

chargerRoles(): void {

if (!this.hasPermission('users.update')) {
  return;
}

this.chargementRoles = true;
this.erreurRoles = '';

this.userService.getRolesSelect().subscribe({

  next: (response) => {

    console.log(
      'Rôles disponibles :',
      response
    );

    this.roles = response.data || [];
    this.chargementRoles = false;

    this.preselectionnerRole();

    this.cdr.detectChanges();
  },

  error: (error) => {

    console.error(
      'Erreur récupération rôles :',
      error
    );

    this.roles = [];
    this.chargementRoles = false;

    if (error.status === 401) {

      this.erreurRoles =
        'Votre session a expiré. Veuillez vous reconnecter.';

    } else if (error.status === 403) {

      this.erreurRoles =
        'Vous n’avez pas les permissions nécessaires.';

    } else {

      this.erreurRoles =
        'Impossible de récupérer les rôles.';
    }

    this.cdr.detectChanges();
  }
});

}

chargerUtilisateur(): void {

if (!this.hasPermission('users.update')) {
  return;
}

this.chargement = true;
this.erreur = '';

this.userService.getUser(this.id).subscribe({

  next: (response) => {

    console.log(
      'Détail utilisateur pour modification :',
      response
    );

    const utilisateur: User =
      response?.data ||
      response;

    this.email =
      utilisateur.email ||
      '';

    this.firstName =
      utilisateur.firstName ||
      '';

    this.lastName =
      utilisateur.lastName ||
      '';

    this.phone =
      utilisateur.phone ||
      '';

    this.roleId = '';

    if (
      utilisateur.roles &&
      utilisateur.roles.length > 0
    ) {

      const nomRole =
        utilisateur.roles[0];

      const roleCorrespondant =
        this.roles.find(
          role =>
            role.label.toLowerCase() ===
            nomRole.toLowerCase()
        );

      if (roleCorrespondant) {

        this.roleId =
          roleCorrespondant.id;

        this.roleIds = [
          roleCorrespondant.id
        ];
      }
    }

    this.chargement = false;

    this.preselectionnerRole();

    this.cdr.detectChanges();
  },

  error: (error) => {

    console.error(
      'Erreur récupération utilisateur :',
      error
    );

    this.chargement = false;

    if (error.status === 401) {

      this.erreur =
        'Votre session a expiré. Veuillez vous reconnecter.';

    } else if (error.status === 403) {

      this.erreur =
        'Vous n’avez pas les permissions nécessaires.';

    } else if (error.status === 404) {

      this.erreur =
        'Utilisateur introuvable.';

    } else {

      this.erreur =
        'Impossible de récupérer les informations de cet utilisateur.';
    }

    this.cdr.detectChanges();
  }
});

}

preselectionnerRole(): void {

if (!this.roleId) {
  return;
}

const roleExiste =
  this.roles.some(
    role => role.id === this.roleId
  );

if (!roleExiste) {
  return;
}

this.roleIds = [
  this.roleId
];

}

selectionnerRole(): void {

this.roleIds =
  this.roleId
    ? [this.roleId]
    : [];

console.log(
  'RoleIds sélectionnés :',
  this.roleIds
);

}

modifierUtilisateur(): void {

if (!this.hasPermission('users.update')) {

  this.erreur =
    'Vous n’avez pas la permission de modifier cet utilisateur.';

  return;
}

this.erreur = '';
this.succes = '';

if (
  !this.email.trim() ||
  !this.firstName.trim() ||
  !this.lastName.trim()
) {

  this.erreur =
    'Veuillez remplir tous les champs obligatoires.';

  return;
}

if (!this.roleId) {

  this.erreur =
    'Veuillez sélectionner un rôle.';

  return;
}

this.roleIds = [
  this.roleId
];

this.enregistrement = true;

const data = {
  email: this.email.trim(),
  firstName: this.firstName.trim(),
  lastName: this.lastName.trim(),
  phone: this.phone.trim() || null,
  roleIds: this.roleIds
};

console.log(
  'Données modification utilisateur :',
  data
);

this.userService.updateUser(
  this.id,
  data
).subscribe({

  next: (response) => {

    console.log(
      'Utilisateur modifié :',
      response
    );

    this.enregistrement = false;

    this.succes =
      response?.message ||
      'Utilisateur modifié avec succès.';

    this.cdr.detectChanges();

    setTimeout(() => {

      this.router.navigate([
        '/users',
        this.id
      ]);

    }, 1000);
  },

  error: (error) => {

    console.error(
      'Erreur modification utilisateur :',
      error
    );

    this.enregistrement = false;

    if (error.status === 400) {

      this.erreur =
        error?.error?.error?.message ||
        'Les données envoyées sont invalides.';

    } else if (error.status === 401) {

      this.erreur =
        'Votre session a expiré. Veuillez vous reconnecter.';

    } else if (error.status === 403) {

      this.erreur =
        'Vous n’avez pas les permissions nécessaires.';

    } else if (error.status === 404) {

      this.erreur =
        'Utilisateur introuvable.';

    } else if (error.status === 429) {

      this.erreur =
        'Trop de requêtes. Veuillez patienter.';

    } else {

      this.erreur =
        'Impossible de modifier cet utilisateur.';
    }

    this.cdr.detectChanges();
  }
});

}

annuler(): void {
this.router.navigate(['/users']);
}

retourDetail(): void {

this.router.navigate([
  '/users',
  this.id
]);

}
}