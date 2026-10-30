import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import {
ActivatedRoute,
Router
} from '@angular/router';

import {
HttpClient,
HttpHeaders
} from '@angular/common/http';

@Component({
selector: 'app-admin-client-update',
standalone: false,
templateUrl: './admin-client-update.html',
styleUrl: './admin-client-update.css'
})
export class AdminClientUpdate implements OnInit {

private apiUrl =
'https://api.commecheznous.fr/api/v1/admin/customers';

clientId = '';

chargement = true;

sauvegarde = false;

erreur = '';

succes = '';

form = {
email: '',
phone: '',
firstName: '',
lastName: '',
isActive: true
};

constructor(
private http: HttpClient,
private route: ActivatedRoute,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {

this.clientId =
  this.route.snapshot.paramMap.get('id') || '';

if (!this.clientId) {

  this.erreur =
    'Identifiant du client introuvable.';

  this.chargement = false;

  this.changeDetectorRef.detectChanges();

  return;
}

this.chargerClient();

}

chargerClient(): void {

this.chargement = true;

this.erreur = '';

this.http.get(
  this.apiUrl + '/' + this.clientId,
  {
    headers: this.getHeaders()
  }
).subscribe({

  next: (response: any) => {

    console.log(
      'Client à modifier :',
      response
    );

    const client =
      response?.data ??
      response?.client ??
      response ??
      null;

    if (!client) {

      this.erreur =
        'Informations du client introuvables.';

      this.chargement = false;

      this.changeDetectorRef.detectChanges();

      return;
    }

    this.form = {
      email: client.email || '',
      phone: client.phone || '',
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      isActive: client.isActive !== false
    };

    this.chargement = false;

    this.changeDetectorRef.detectChanges();
  },

  error: (error: any) => {

    console.error(
      'Erreur chargement client :',
      error
    );

    this.chargement = false;

    this.traiterErreur(error);
  }

});

}

enregistrer(): void {

this.erreur = '';

this.succes = '';

if (
  !this.form.email.trim() ||
  !this.form.phone.trim() ||
  !this.form.firstName.trim() ||
  !this.form.lastName.trim()
) {

  this.erreur =
    'Veuillez remplir tous les champs obligatoires.';

  this.changeDetectorRef.detectChanges();

  return;
}

this.sauvegarde = true;

this.changeDetectorRef.detectChanges();

const donnees = {
  email: this.form.email.trim(),
  phone: this.form.phone.trim(),
  firstName: this.form.firstName.trim(),
  lastName: this.form.lastName.trim(),
  isActive: this.form.isActive
};

this.http.patch(
  this.apiUrl + '/' + this.clientId,
  donnees,
  {
    headers: this.getHeaders()
  }
).subscribe({

  next: (response: any) => {

    console.log(
      'Client modifié :',
      response
    );

    this.sauvegarde = false;

    this.succes =
      'Les informations du client ont été modifiées avec succès.';

    this.changeDetectorRef.detectChanges();

    setTimeout(() => {

      this.router.navigate([
        '/admin/client',
        this.clientId
      ]);

    }, 800);
  },

  error: (error: any) => {

    console.error(
      'Erreur modification client :',
      error
    );

    this.sauvegarde = false;

    this.traiterErreur(error);
  }

});

}

annuler(): void {

this.router.navigate([
  '/admin/client',
  this.clientId
]);

}

traiterErreur(error: any): void {

if (error?.status === 401) {

  this.erreur =
    'Votre session administrateur a expiré.';

} else if (error?.status === 403) {

  this.erreur =
    'Vous n’avez pas les permissions nécessaires.';

} else if (error?.status === 404) {

  this.erreur =
    'Client introuvable.';

} else if (
  error?.status === 400
) {

  if (error?.error?.error?.message) {

    this.erreur =
      error.error.error.message;

  } else {

    this.erreur =
      'Les données envoyées sont invalides.';
  }

} else if (
  error?.error?.error?.message
) {

  this.erreur =
    error.error.error.message;

} else if (
  error?.error?.message
) {

  this.erreur =
    error.error.message;

} else {

  this.erreur =
    'Impossible de modifier le client.';
}

this.changeDetectorRef.detectChanges();

}

private getHeaders(): HttpHeaders {

const token =
  localStorage.getItem(
    'accessToken'
  );

if (!token) {
  return new HttpHeaders();
}

return new HttpHeaders({
  Authorization:
    'Bearer ' + token
});

}
}