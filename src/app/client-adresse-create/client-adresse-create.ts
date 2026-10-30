

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-adresse-create',
standalone: false,
templateUrl: './client-adresse-create.html',
styleUrl: './client-adresse-create.css'
})
export class ClientAdresseCreate {

sauvegarde = false;

erreur = '';
succes = '';

form = {
label: '',
recipientName: '',
phone: '',
addressLine1: '',
addressLine2: '',
city: '',
region: '',
countryCode: 'TG',
latitude: null as number | null,
longitude: null as number | null,
isDefault: false
};

constructor(
private clientAuthService: ClientAuthService,
private router: Router
) {}

enregistrer(): void {

this.erreur = '';
this.succes = '';

if (
  !this.form.label.trim() ||
  !this.form.recipientName.trim() ||
  !this.form.phone.trim() ||
  !this.form.addressLine1.trim() ||
  !this.form.city.trim() ||
  !this.form.region.trim() ||
  !this.form.countryCode.trim()
) {

  this.erreur =
    'Veuillez remplir tous les champs obligatoires.';

  return;
}

this.sauvegarde = true;

const donnees = {

  label:
    this.form.label.trim(),

  recipientName:
    this.form.recipientName.trim(),

  phone:
    this.form.phone.trim(),

  addressLine1:
    this.form.addressLine1.trim(),

  addressLine2:
    this.form.addressLine2.trim(),

  city:
    this.form.city.trim(),

  region:
    this.form.region.trim(),

  countryCode:
    this.form.countryCode
      .trim()
      .toUpperCase(),

  latitude:
    this.form.latitude,

  longitude:
    this.form.longitude,

  isDefault:
    this.form.isDefault

};

this.clientAuthService
  .ajouterAdresse(donnees)
  .subscribe({

    next: () => {

      this.sauvegarde = false;

      this.succes =
        'Adresse ajoutée avec succès.';

      setTimeout(() => {

        this.router.navigate([
          '/client/adresses'
        ]);

      }, 800);
    },

    error: (error: any) => {

      console.error(
        'Erreur création adresse :',
        error
      );

      this.sauvegarde = false;

      if (error?.status === 401) {

        this.router.navigate([
          '/client/connexion'
        ]);

        return;
      }

      if (error?.error?.error?.message) {

        this.erreur =
          error.error.error.message;

      } else if (error?.error?.message) {

        this.erreur =
          error.error.message;

      } else {

        this.erreur =
          'Impossible de créer cette adresse.';
      }
    }

  });

}

annuler(): void {

this.router.navigate([
  '/client/adresses'
]);

}

}