import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService, Role } from '../services/role';
import { Auth } from '../services/auth';

@Component({
selector: 'app-role-detail',
standalone: false,
templateUrl: './role-detail.html',
styleUrl: './role-detail.css'
})
export class RoleDetail implements OnInit {

private auth = inject(Auth);

id = '';

role: Role | null = null;
permissions: string[] = [];

chargement = true;
chargementPermissions = true;

erreur = '';
erreurPermissions = '';

constructor(
private route: ActivatedRoute,
private router: Router,
private roleService: RoleService,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {

const idRole = this.route.snapshot.paramMap.get('id');

if (!idRole) {
  this.erreur = 'Identifiant du rôle introuvable.';
  this.chargement = false;
  this.chargementPermissions = false;
  this.cdr.detectChanges();
  return;
}

this.id = idRole;

this.chargerRole();
this.chargerPermissions();

}

hasPermission(permission: string): boolean {
return this.auth.hasPermission(permission);
}

chargerRole(): void {

this.chargement = true;
this.erreur = '';

this.roleService.getRole(this.id).subscribe({

  next: (response) => {

    console.log(
      'Détail du rôle :',
      response
    );

    this.role =
      response?.data ||
      response;

    this.chargement = false;

    this.cdr.detectChanges();
  },

  error: (error) => {

    console.error(
      'Erreur récupération rôle :',
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
        'Rôle introuvable.';

    } else if (error.status === 429) {

      this.erreur =
        'Trop de requêtes. Veuillez patienter.';

    } else {

      this.erreur =
        'Impossible de récupérer les informations du rôle.';
    }

    this.cdr.detectChanges();
  }
});

}

chargerPermissions(): void {

this.chargementPermissions = true;
this.erreurPermissions = '';

this.roleService.getRolePermissions(
  this.id
).subscribe({

  next: (response) => {

    console.log(
      'Permissions du rôle :',
      response
    );

    const data = response?.data;

    if (Array.isArray(data)) {

      this.permissions = data;

    } else if (Array.isArray(data?.permissionCodes)) {

      this.permissions = data.permissionCodes;

    } else if (Array.isArray(response?.permissionCodes)) {

      this.permissions = response.permissionCodes;

    } else {

      this.permissions = [];
    }

    this.chargementPermissions = false;

    this.cdr.detectChanges();
  },

  error: (error) => {

    console.error(
      'Erreur récupération permissions :',
      error
    );

    this.permissions = [];
    this.chargementPermissions = false;

    if (error.status === 401) {

      this.erreurPermissions =
        'Votre session a expiré. Veuillez vous reconnecter.';

    } else if (error.status === 403) {

      this.erreurPermissions =
        'Vous n’avez pas les permissions nécessaires.';

    } else if (error.status === 404) {

      this.erreurPermissions =
        'Rôle introuvable.';

    } else if (error.status === 429) {

      this.erreurPermissions =
        'Trop de requêtes. Veuillez patienter.';

    } else {

      this.erreurPermissions =
        'Impossible de récupérer les permissions du rôle.';
    }

    this.cdr.detectChanges();
  }
});

}

estRoleSysteme(): boolean {
return this.role?.isSystem === true;
}

modifierRole(): void {

if (!this.hasPermission('roles.update')) {
  return;
}

this.router.navigate([
  '/roles',
  this.id,
  'modifier'
]);

}

gererPermissions(): void {

if (!this.hasPermission('roles.manage_permissions')) {
  return;
}

this.router.navigate([
  '/roles',
  this.id,
  'permissions'
]);

}

retourListe(): void {
this.router.navigate(['/roles']);
}

formaterDate(date: string | undefined): string {

if (!date) {
  return 'Non disponible';
}

return new Date(date).toLocaleDateString(
  'fr-FR'
);

}
}