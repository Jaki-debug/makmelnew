import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleSelect, UserService } from '../services/user';

@Component({
selector: 'app-user-create',
standalone: false,
templateUrl: './user-create.html',
styleUrl: './user-create.css'
})
export class UserCreate implements OnInit {

email = '';
firstName = '';
lastName = '';
phone = '';
password = '';

roleId = '';
roleIds: string[] = [];

roles: RoleSelect[] = [];

chargement = false;
chargementRoles = true;

erreur = '';
erreurRoles = '';
succes = '';
temporaryPassword = '';

constructor(
private userService: UserService,
private router: Router,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerRoles();
}

chargerRoles(): void {
this.chargementRoles = true;
this.erreurRoles = '';

this.userService.getRolesSelect().subscribe({
  next: (response) => {
    console.log('Réponse rôles :', response);

    this.roles = response.data || [];
    this.chargementRoles = false;

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error('Erreur récupération rôles :', error);

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

creerUtilisateur(): void {
this.erreur = '';
this.succes = '';
this.temporaryPassword = '';

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

this.roleIds = [this.roleId];

this.chargement = true;

const data = {
  email: this.email.trim(),
  firstName: this.firstName.trim(),
  lastName: this.lastName.trim(),
  phone: this.phone.trim() || undefined,
  password: this.password.trim() || undefined,
  roleIds: this.roleIds
};

console.log('Données envoyées :', data);

this.userService.createUser(data).subscribe({
  next: (response) => {
    console.log('Utilisateur créé :', response);

    this.chargement = false;

    this.temporaryPassword =
      response?.data?.temporaryPassword ||
      response?.temporaryPassword ||
      '';

    this.succes =
      response?.message ||
      'Utilisateur créé avec succès.';

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error('Erreur création utilisateur :', error);

    this.chargement = false;

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
    } else if (error.status === 429) {
      this.erreur =
        'Trop de requêtes. Veuillez patienter.';
    } else {
      this.erreur =
        'Impossible de créer l’utilisateur.';
    }

    this.cdr.detectChanges();
  }
});

}

annuler(): void {
this.router.navigate(['/users']);
}

retourListe(): void {
this.router.navigate(['/users']);
}
}