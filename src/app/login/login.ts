import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  motDePasse = '';

  erreur = '';
  chargement = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // =====================================
  // CONNEXION ADMIN
  // =====================================

  seConnecter(): void {

    this.erreur = '';

    if (this.chargement) {
      return;
    }

    if (!this.email.trim() || !this.motDePasse) {
      this.erreur = 'Veuillez remplir tous les champs.';
      return;
    }

    this.chargement = true;

    this.auth.login(
      this.email.trim(),
      this.motDePasse
    ).subscribe({

      next: (response) => {

        this.chargement = false;

        if (!response?.success || !response.data) {
          this.erreur =
            response?.message || 'Échec de la connexion.';
          return;
        }

        const data = response.data;

        // =====================================
        // ÉTAPE 1 : AUTHENTIFICATION MFA
        // =====================================

        if (data.mfaRequired) {

          if (!data.mfaToken) {
            this.erreur =
              'Le serveur n’a pas fourni le jeton MFA.';
            return;
          }

          this.auth.setMfaToken(data.mfaToken);

          if (data.passwordChangeToken) {
            this.auth.setPasswordChangeToken(
              data.passwordChangeToken
            );
          }

          void this.router.navigate(['/mfa']);
          return;
        }

        // =====================================
        // ÉTAPE 2 : CHANGEMENT OBLIGATOIRE
        // DU MOT DE PASSE
        // =====================================

        if (data.passwordChangeToken) {

          this.auth.setPasswordChangeToken(
            data.passwordChangeToken
          );

          void this.router.navigate([
            '/changer-mot-de-passe'
          ]);

          return;
        }

        // =====================================
        // ÉTAPE 3 : VÉRIFIER LA RÉPONSE
        // =====================================

        if (!data.accessToken || !data.user) {
          this.erreur =
            response?.message ||
            'Réponse du serveur invalide.';
          return;
        }

        // =====================================
        // ÉTAPE 4 : ENREGISTRER LA SESSION
        // =====================================

        this.auth.saveSession(
          data.accessToken,
          data.user
        );

        // =====================================
        // ÉTAPE 5 : REDIRIGER APRÈS CONNEXION
        // =====================================

        const destination =
          this.obtenirDestinationApresConnexion();

        void this.router.navigateByUrl(destination)
          .then((success) => {

            if (!success) {
              this.erreur =
                'Connexion réussie, mais impossible d’ouvrir la page demandée.';
            }

          })
          .catch((error) => {

            console.error(
              'Erreur de navigation après connexion :',
              error
            );

            this.erreur =
              'Connexion réussie, mais impossible d’ouvrir la page demandée.';
          });

      },

      error: (error) => {

        this.chargement = false;

        console.error(
          'Erreur de connexion :',
          error.status,
          error.error
        );

        const code = error.error?.error?.code;
        const message = error.error?.error?.message;

        if (code === 'ACCOUNT_LOCKED') {

          this.erreur =
            message ||
            'Votre compte est temporairement verrouillé.';

        } else if (error.status === 401) {

          this.erreur =
            message ||
            'Email ou mot de passe incorrect.';

        } else if (error.status === 403) {

          this.erreur =
            message ||
            'Accès refusé. Vérifiez vos autorisations.';

        } else if (error.status === 429) {

          this.erreur =
            message ||
            'Trop de tentatives. Veuillez patienter.';

        } else {

          this.erreur =
            message ||
            'Une erreur est survenue lors de la connexion.';
        }

      }

    });
  }

  // =====================================
  // DÉTERMINER LA PAGE APRÈS CONNEXION
  // =====================================

  private obtenirDestinationApresConnexion(): string {

    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl');

    // Sans URL de retour, ouvrir le tableau de bord Admin.
    if (!returnUrl) {
      return '/admin';
    }

    // Accepter uniquement les URL internes à l'application.
    // Éviter notamment les URL externes et les URL commençant par //.
    if (
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//')
    ) {
      return '/admin';
    }

    // Ne pas rediriger à nouveau vers une page de connexion
    // ou vers une étape intermédiaire d'authentification.
    const chemin = returnUrl
      .split(/[?#]/)[0]
      .replace(/\/+$/, '') || '/';

    const destinationsInterdites = [
      '/login',
      '/connexion-admin',
      '/mfa',
      '/changer-mot-de-passe'
    ];

    if (destinationsInterdites.includes(chemin)) {
      return '/admin';
    }

    // Si une page protégée avait été demandée,
    // essayer d'y revenir après la connexion.
    return returnUrl;
  }
}