import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService, Role } from '../services/role';
import { Auth } from '../services/auth';

@Component({
selector: 'app-role-update',
standalone: false,
templateUrl: './role-update.html',
styleUrl: './role-update.css'
})
export class RoleUpdate implements OnInit {

private route = inject(ActivatedRoute);
private router = inject(Router);
private roleService = inject(RoleService);
private auth = inject(Auth);
private cdr = inject(ChangeDetectorRef);

id = '';

role: Role | null = null;

nom = '';
description = '';

chargement = true;
enregistrement = false;

erreur = '';
succes = '';

ngOnInit(): void {

const idRole = this.route.snapshot.paramMap.get('id');

if (!idRole) {
  this.erreur = 'Identifiant du rôle introuvable.';
  this.chargement = false;
  return;
}

this.id = idRole;

if (!this.hasPermission('roles.update')) {
  this.erreur =
    'Vous n’avez pas la permission de modifier ce rôle.';
  this.chargement = false;
  this.cdr.detectChanges();
  return;
}

this.chargerRole();

}

hasPermission(permission: string): boolean {
return this.auth.hasPermission(permission);
}

chargerRole(): void {

this.chargement = true;
this.erreur = '';

this.roleService.getRole(this.id).subscribe({

  next: (response) => {

    this.role =
      response?.data ||
      response;

    if (this.role) {

      this.nom =
        this.role.name || '';

      this.description =
        this.role.description || '';
    }

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

    } else {

      this.erreur =
        'Impossible de récupérer les informations du rôle.';
    }

    this.cdr.detectChanges();
  }
});

}

enregistrer(): void {

if (!this.hasPermission('roles.update')) {

  this.erreur =
    'Vous n’avez pas la permission de modifier ce rôle.';

  return;
}

if (
  !this.nom.trim()
) {

  this.erreur =
    'Le nom du rôle est obligatoire.';

  return;
}

this.erreur = '';
this.succes = '';
this.enregistrement = true;

const data = {
  name: this.nom.trim(),
  description: this.description.trim() || null
};

this.roleService.updateRole(
  this.id,
  data
).subscribe({

  next: (response) => {

    console.log(
      'Rôle modifié :',
      response
    );

    this.enregistrement = false;

    this.succes =
      response?.message ||
      'Rôle modifié avec succès.';

    this.cdr.detectChanges();

    setTimeout(() => {

      this.router.navigate([
        '/roles',
        this.id
      ]);

    }, 1000);
  },

  error: (error) => {

    console.error(
      'Erreur modification rôle :',
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
        'Vous n’avez pas la permission de modifier ce rôle.';

    } else if (error.status === 404) {

      this.erreur =
        'Rôle introuvable.';

    } else if (error.status === 429) {

      this.erreur =
        'Trop de requêtes. Veuillez réessayer plus tard.';

    } else {

      this.erreur =
        'Impossible de modifier ce rôle.';
    }

    this.cdr.detectChanges();
  }
});

}

annuler(): void {
this.router.navigate([
'/roles',
this.id
]);
}

retourListe(): void {
this.router.navigate(['/roles']);
}
}