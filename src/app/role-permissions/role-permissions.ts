import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '../services/role';
import { Auth } from '../services/auth';

interface Permission {
id: string;
code: string;
description: string | null;
createdAt?: string;
}

@Component({
selector: 'app-role-permissions',
standalone: false,
templateUrl: './role-permissions.html',
styleUrl: './role-permissions.css'
})
export class RolePermissions implements OnInit {

private route = inject(ActivatedRoute);
private router = inject(Router);
private roleService = inject(RoleService);
private cdr = inject(ChangeDetectorRef);
private auth = inject(Auth);

id = '';

role: any = null;
permissions: Permission[] = [];
permissionsSelectionnees: string[] = [];

chargement = true;
chargementPermissions = true;
enregistrement = false;

erreur = '';
erreurPermissions = '';
succes = '';

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

estSuperAdministrateur(): boolean {
return this.role?.name?.toLowerCase() === 'super administrateur';
}

peutModifierPermissions(): boolean {
return this.hasPermission('roles.manage_permissions')
&& !this.estSuperAdministrateur();
}

chargerRole(): void {

this.chargement = true;
this.erreur = '';

this.roleService.getRole(this.id).subscribe({

  next: (response) => {

    this.role = response?.data || response;

    this.chargement = false;

    this.cdr.detectChanges();
  },

  error: (error) => {

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
        'Trop de requêtes. Veuillez réessayer plus tard.';

    } else {

      this.erreur =
        'Impossible de récupérer le rôle.';
    }

    this.cdr.detectChanges();
  }
});

}

chargerPermissions(): void {

this.chargementPermissions = true;
this.erreurPermissions = '';

this.roleService.getPermissions().subscribe({

  next: (response) => {

    const data = response?.data;

    if (Array.isArray(data)) {

      this.permissions = data;

    } else {

      this.permissions = [];
    }

    this.chargementPermissions = false;

    this.cdr.detectChanges();

    this.chargerPermissionsRole();
  },

  error: (error) => {

    this.chargementPermissions = false;

    if (error.status === 401) {

      this.erreurPermissions =
        'Votre session a expiré. Veuillez vous reconnecter.';

    } else if (error.status === 403) {

      this.erreurPermissions =
        'Vous n’avez pas les permissions nécessaires.';

    } else if (error.status === 429) {

      this.erreurPermissions =
        'Trop de requêtes. Veuillez réessayer plus tard.';

    } else {

      this.erreurPermissions =
        'Impossible de récupérer les permissions disponibles.';
    }

    this.cdr.detectChanges();
  }
});

}

chargerPermissionsRole(): void {

this.roleService.getRolePermissions(this.id).subscribe({

  next: (response) => {

    const data = response?.data;

    if (Array.isArray(data)) {

      this.permissionsSelectionnees = [...data];

    } else if (Array.isArray(data?.permissionCodes)) {

      this.permissionsSelectionnees = [
        ...data.permissionCodes
      ];

    } else if (Array.isArray(response?.permissionCodes)) {

      this.permissionsSelectionnees = [
        ...response.permissionCodes
      ];

    } else {

      this.permissionsSelectionnees = [];
    }

    this.cdr.detectChanges();
  },

  error: (error) => {

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
        'Trop de requêtes. Veuillez réessayer plus tard.';

    } else {

      this.erreurPermissions =
        'Impossible de récupérer les permissions du rôle.';
    }

    this.cdr.detectChanges();
  }
});

}

estSelectionnee(code: string): boolean {
return this.permissionsSelectionnees.includes(code);
}

changerPermission(code: string, event: Event): void {

if (!this.peutModifierPermissions()) {
  return;
}

const checkbox = event.target as HTMLInputElement;

if (checkbox.checked) {

  if (!this.permissionsSelectionnees.includes(code)) {

    this.permissionsSelectionnees.push(code);
  }

} else {

  this.permissionsSelectionnees =
    this.permissionsSelectionnees.filter(
      permission => permission !== code
    );
}

this.cdr.detectChanges();

}

enregistrer(): void {

if (!this.peutModifierPermissions()) {

  this.erreur =
    'Vous n’avez pas la permission de modifier les permissions de ce rôle.';

  return;
}

this.erreur = '';
this.succes = '';
this.enregistrement = true;

this.roleService.updateRolePermissions(
  this.id,
  this.permissionsSelectionnees
).subscribe({

  next: (response) => {

    this.enregistrement = false;

    this.succes =
      response?.message ||
      'Les permissions ont été mises à jour avec succès.';

    this.cdr.detectChanges();

    setTimeout(() => {

      this.router.navigate([
        '/roles',
        this.id
      ]);

    }, 900);
  },

  error: (error) => {

    this.enregistrement = false;

    if (error.status === 400) {

      this.erreur =
        error?.error?.error?.message ||
        'Les permissions envoyées sont invalides.';

    } else if (error.status === 401) {

      this.erreur =
        'Votre session a expiré. Veuillez vous reconnecter.';

    } else if (error.status === 403) {

      this.erreur =
        'Vous n’avez pas la permission de modifier les permissions de ce rôle.';

    } else if (error.status === 404) {

      this.erreur =
        'Rôle introuvable.';

    } else if (error.status === 429) {

      this.erreur =
        'Trop de requêtes. Veuillez réessayer plus tard.';

    } else {

      this.erreur =
        'Une erreur est survenue lors de l’enregistrement.';
    }

    this.cdr.detectChanges();
  }
});

}

retourDetail(): void {
this.router.navigate(['/roles', this.id]);
}

toutSelectionner(): void {

if (!this.peutModifierPermissions()) {
  return;
}

this.permissionsSelectionnees =
  this.permissions.map(
    permission => permission.code
  );

this.cdr.detectChanges();

}

toutDeselectionner(): void {

if (!this.peutModifierPermissions()) {
  return;
}

this.permissionsSelectionnees = [];

this.cdr.detectChanges();

}
}