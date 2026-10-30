import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User, UserService } from '../services/user';
import { Auth } from '../services/auth';

@Component({
selector: 'app-user-detail',
standalone: false,
templateUrl: './user-detail.html',
styleUrl: './user-detail.css'
})
export class UserDetail implements OnInit {

private auth = inject(Auth);

utilisateur: User | null = null;

chargement = true;
erreur = '';

constructor(
private route: ActivatedRoute,
private router: Router,
private userService: UserService,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {

const id = this.route.snapshot.paramMap.get('id');

if (!id) {
  this.erreur = 'Identifiant utilisateur introuvable.';
  this.chargement = false;
  this.cdr.detectChanges();
  return;
}

if (!this.hasPermission('users.read')) {
  this.erreur =
    'Vous n’avez pas la permission de consulter cet utilisateur.';
  this.chargement = false;
  this.cdr.detectChanges();
  return;
}

this.chargerUtilisateur(id);

}

hasPermission(permission: string): boolean {
return this.auth.hasPermission(permission);
}

chargerUtilisateur(id: string): void {

this.chargement = true;
this.erreur = '';

this.userService.getUser(id).subscribe({

  next: (response) => {

    console.log(
      'Réponse détail utilisateur :',
      response
    );

    this.utilisateur =
      response?.data ||
      response;

    this.chargement = false;

    this.cdr.detectChanges();
  },

  error: (error) => {

    console.error(
      'Erreur récupération détail utilisateur :',
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

getRoles(): string {

if (
  !this.utilisateur?.roles ||
  this.utilisateur.roles.length === 0
) {
  return 'Aucun rôle';
}

return this.utilisateur.roles.join(', ');

}

statutLibelle(statut: string): string {

switch (statut) {

  case 'ACTIVE':
    return 'Actif';

  case 'INACTIVE':
    return 'Inactif';

  case 'SUSPENDED':
    return 'Suspendu';

  default:
    return statut;
}

}

formaterDate(date: string | null): string {

if (!date) {
  return 'Jamais';
}

return new Date(date).toLocaleString('fr-FR');

}

revenir(): void {
this.router.navigate(['/users']);
}

modifier(): void {

if (!this.utilisateur) {
  return;
}

if (!this.hasPermission('users.update')) {
  return;
}

this.router.navigate([
  '/users',
  this.utilisateur.id,
  'modifier'
]);

}
}