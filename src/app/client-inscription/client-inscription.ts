import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-inscription',
standalone: false,
templateUrl: './client-inscription.html',
styleUrl: './client-inscription.css'
})
export class ClientInscription {

email = '';
phone = '';
firstName = '';
lastName = '';
password = '';

chargement = false;
erreur = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router
) {}

sInscrire(): void {

this.erreur = '';

if (
  !this.email.trim() ||
  !this.phone.trim() ||
  !this.firstName.trim() ||
  !this.lastName.trim() ||
  !this.password
) {
  this.erreur = 'Veuillez remplir tous les champs.';
  return;
}

if (this.password.length < 8) {
  this.erreur = 'Le mot de passe doit contenir au moins 8 caractères.';
  return;
}

this.chargement = true;

this.clientAuthService.inscrire({
  email: this.email.trim(),
  phone: this.phone.trim(),
  firstName: this.firstName.trim(),
  lastName: this.lastName.trim(),
  password: this.password
}).subscribe({
  next: () => {
    this.chargement = false;
    this.router.navigate(['/client']);
  },
  error: (error: any) => {
    console.error('Erreur inscription client :', error);

    this.chargement = false;

    if (error?.error?.error?.message) {
      this.erreur = error.error.error.message;
    } else {
      this.erreur = 'Impossible de créer votre compte. Veuillez réessayer.';
    }
  }
});

}

allerConnexion(): void {
this.router.navigate(['/client/connexion']);
}

retourAccueil(): void {
this.router.navigate(['/client']);
}
}