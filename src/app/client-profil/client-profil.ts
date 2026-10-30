import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-profil',
standalone: false,
templateUrl: './client-profil.html',
styleUrl: './client-profil.css'
})
export class ClientProfil implements OnInit {

profil: any = null;

chargement = true;

erreur = '';

succes = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerProfil();
}

chargerProfil(): void {

this.chargement = true;
this.erreur = '';
this.succes = '';

this.changeDetectorRef.detectChanges();

this.clientAuthService.getProfil().subscribe({

  next: (response: any) => {

    this.profil =
      response?.data ??
      response;

    this.chargement = false;

    this.changeDetectorRef.detectChanges();
  },

  error: (error: any) => {

    console.error(
      'Erreur chargement profil :',
      error
    );

    this.chargement = false;

    if (error?.status === 401) {

      this.router.navigate([
        '/client/connexion'
      ]);

      return;
    }

    this.erreur =
      'Impossible de charger votre profil.';

    this.changeDetectorRef.detectChanges();
  }

});

}

modifierProfil(): void {

this.router.navigate([
  '/client/profil/modifier'
]);

}

allerAuxAdresses(): void {

this.router.navigate([
  '/client/adresses'
]);

}

retourCompte(): void {

this.router.navigate([
  '/client/compte'
]);

}

}