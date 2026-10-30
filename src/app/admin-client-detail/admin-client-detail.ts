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
selector: 'app-admin-client-detail',
standalone: false,
templateUrl: './admin-client-detail.html',
styleUrl: './admin-client-detail.css'
})
export class AdminClientDetail implements OnInit {

private apiUrl =
'https://api.commecheznous.fr/api/v1/admin/customers';

client: any = null;

clientId = '';

chargement = true;

erreur = '';

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

this.changeDetectorRef.detectChanges();

this.http.get(
  this.apiUrl + '/' + this.clientId,
  {
    headers: this.getHeaders()
  }
).subscribe({

  next: (response: any) => {

    console.log(
      'Détail client :',
      response
    );

    this.client =
      response?.data ??
      response?.client ??
      response ??
      null;

    this.chargement = false;

    this.changeDetectorRef.detectChanges();
  },

  error: (error: any) => {

    console.error(
      'Erreur chargement client :',
      error
    );

    this.chargement = false;

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
        'Impossible de charger les informations du client.';
    }

    this.changeDetectorRef.detectChanges();
  }

});

}

obtenirNom(): string {

if (!this.client) {
  return 'Client';
}

const prenom =
  this.client.firstName ??
  this.client.firstname ??
  '';

const nom =
  this.client.lastName ??
  this.client.lastname ??
  '';

return `${prenom} ${nom}`.trim() ||
  'Client sans nom';

}

obtenirEmail(): string {

return this.client?.email ||
  'Non renseigné';

}

obtenirTelephone(): string {

return this.client?.phone ||
  'Non renseigné';

}

obtenirStatut(): string {

return this.client?.isActive === false
  ? 'Inactif'
  : 'Actif';

}

estActif(): boolean {

return this.client?.isActive !== false;

}

obtenirInitiale(): string {

const prenom =
  this.client?.firstName ||
  this.client?.firstname ||
  '';

const nom =
  this.client?.lastName ||
  this.client?.lastname ||
  '';

return (
  prenom ||
  nom ||
  'C'
).charAt(0).toUpperCase();

}

formaterDate(date: string | null): string {

if (!date) {
  return 'Non renseignée';
}

const valeur =
  new Date(date);

if (isNaN(valeur.getTime())) {
  return date;
}

return valeur.toLocaleDateString(
  'fr-FR',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
);

}

modifierClient(): void {

if (!this.clientId) {
  return;
}

this.router.navigate([
  '/admin/client/modifier',
  this.clientId
]);

}

retournerListe(): void {

this.router.navigate([
  '/admin/clients'
]);

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