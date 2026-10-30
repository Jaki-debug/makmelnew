import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientAuthService } from '../services/client-auth';

@Component({
selector: 'app-client-connexion',
standalone: false,
templateUrl: './client-connexion.html',
styleUrl: './client-connexion.css'
})
export class ClientConnexion {
identifier = '';
password = '';
chargement = false;
erreur = '';

constructor(
private clientAuthService: ClientAuthService,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

seConnecter(): void {
if (!this.identifier.trim() || !this.password) {
this.erreur = 'Veuillez renseigner votre identifiant et votre mot de passe.';
return;
}

if (this.chargement) {
  return;
}

this.chargement = true;
this.erreur = '';

this.clientAuthService.connecter({
  identifier: this.identifier.trim(),
  password: this.password
}).subscribe({
  next: (response: any) => {
    const token =
      response?.data?.accessToken ||
      response?.accessToken ||
      response?.data?.token ||
      response?.token;

    if (!token) {
      this.chargement = false;
      this.erreur =
        'Connexion reçue, mais aucun token trouvé dans la réponse du serveur. Vérifiez le format de la réponse API.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.clientAuthService.setAccessToken(token);

    this.clientAuthService.getProfil().subscribe({
      next: (profilResponse: any) => {
        const profil =
          profilResponse?.data?.customer ||
          profilResponse?.data?.client ||
          profilResponse?.data ||
          profilResponse?.customer ||
          profilResponse?.client ||
          profilResponse;

        if (profil) {
          this.clientAuthService.setClientConnecte(profil);
        }

        this.chargement = false;
        this.changeDetectorRef.detectChanges();

        this.router.navigate(['/client']);
      },

      error: (error: any) => {
        this.chargement = false;

        this.erreur =
          error?.error?.message ||
          'La connexion a réussi, mais la récupération du profil a échoué. Vérifiez le token et la route /me de l’API.';

        this.changeDetectorRef.detectChanges();
      }
    });
  },

  error: (error: any) => {
    this.chargement = false;

    if (error?.status === 401) {
      this.erreur = 'Identifiant ou mot de passe incorrect.';
    } else if (error?.status === 400) {
      this.erreur =
        error?.error?.message ||
        'Les informations saisies sont invalides.';
    } else {
      this.erreur =
        error?.error?.message ||
        'Erreur de connexion au serveur. Vérifiez l’API et réessayez.';
    }

    this.changeDetectorRef.detectChanges();
  }
});

}

allerInscription(): void {
this.router.navigate(['/client/inscription']);
}

retourAccueil(): void {
this.router.navigate(['/client']);
}
}