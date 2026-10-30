import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-profil-updatebyclient',
standalone: false,
templateUrl: './client-profil-updatebyclient.html',
styleUrl: './client-profil-updatebyclient.css'
})
export class ClientProfilUpdatebyclient implements OnInit {

chargement = true;
sauvegarde = false;

erreur = '';
succes = '';

form = {
firstName: '',
lastName: '',
email: '',
phone: ''
};

constructor(
private clientAuthService: ClientAuthService,
private router: Router
) {}

ngOnInit(): void {
this.chargerProfil();
}

chargerProfil(): void {
this.chargement = true;
this.erreur = '';

this.clientAuthService.getProfil().subscribe({
  next: (response: any) => {

    const profil = response?.data ?? response;

    this.form.firstName = profil?.firstName ?? '';
    this.form.lastName = profil?.lastName ?? '';
    this.form.email = profil?.email ?? '';
    this.form.phone = profil?.phone ?? '';

    this.chargement = false;
  },

  error: (error: any) => {
    console.error('Erreur chargement profil :', error);

    this.chargement = false;

    if (error?.status === 401) {
      this.router.navigate(['/client/connexion']);
      return;
    }

    this.erreur = 'Impossible de charger votre profil.';
  }
});

}

enregistrer(): void {
this.erreur = '';
this.succes = '';

if (
  !this.form.firstName.trim() ||
  !this.form.lastName.trim() ||
  !this.form.email.trim() ||
  !this.form.phone.trim()
) {
  this.erreur = 'Veuillez remplir tous les champs.';
  return;
}

this.sauvegarde = true;

this.clientAuthService.modifierProfil({
  firstName: this.form.firstName.trim(),
  lastName: this.form.lastName.trim(),
  email: this.form.email.trim(),
  phone: this.form.phone.trim()
}).subscribe({
  next: () => {
    this.sauvegarde = false;
    this.succes = 'Votre profil a été mis à jour.';

    setTimeout(() => {
      this.router.navigate(['/client/profil']);
    }, 1000);
  },

  error: (error: any) => {
    console.error('Erreur modification profil :', error);

    this.sauvegarde = false;

    if (error?.status === 401) {
      this.router.navigate(['/client/connexion']);
      return;
    }

    if (error?.error?.error?.message) {
      this.erreur = error.error.error.message;
    } else if (error?.error?.message) {
      this.erreur = error.error.message;
    } else {
      this.erreur = 'Impossible de modifier votre profil.';
    }
  }
});

}

annuler(): void {
this.router.navigate(['/client/profil']);
}
}