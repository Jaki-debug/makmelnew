import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../services/role';

@Component({
selector: 'app-role-create',
standalone: false,
templateUrl: './role-create.html',
styleUrl: './role-create.css'
})
export class RoleCreate {

private roleService = inject(RoleService);
private router = inject(Router);

nom = '';
description = '';

chargement = false;
erreur = '';
succes = '';

creerRole(): void {
this.erreur = '';
this.succes = '';

const nom = this.nom.trim();
const description = this.description.trim();

if (!nom) {
  this.erreur = 'Le nom du rôle est obligatoire.';
  return;
}

if (nom.length < 2) {
  this.erreur = 'Le nom du rôle doit contenir au moins 2 caractères.';
  return;
}

this.chargement = true;

this.roleService.createRole({
  name: nom,
  description: description || null
}).subscribe({
  next: (response) => {
    this.chargement = false;

    this.succes =
      response?.message ||
      'Rôle créé avec succès.';

    setTimeout(() => {
      this.router.navigate(['/roles']);
    }, 800);
  },
  error: (error) => {
    this.chargement = false;

    if (error.status === 400) {
      this.erreur = 'Les informations saisies sont invalides.';
    } else if (error.status === 401) {
      this.erreur = 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      this.erreur = 'Vous n’avez pas la permission de créer un rôle.';
    } else if (error.status === 409) {
      this.erreur = 'Un rôle portant ce nom existe déjà.';
    } else if (error.status === 429) {
      this.erreur = 'Trop de requêtes. Veuillez réessayer plus tard.';
    } else {
      this.erreur = 'Une erreur est survenue lors de la création du rôle.';
    }
  }
});

}

annuler(): void {
this.router.navigate(['/roles']);
}
}