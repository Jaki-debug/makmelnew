import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  afficherSidebar = false;

  // Pages qui ne doivent pas afficher le layout Admin
  private readonly pagesSansBackoffice = [
    '/',
    '/login',
    '/connexion-admin',
    '/mfa',
    '/changer-mot-de-passe'
  ];

  constructor(private router: Router) {

    // Initialiser l'affichage avec l'URL courante
    this.mettreAJourAffichage(this.router.url);

    // Mettre à jour le layout à chaque navigation
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(event => {
        this.mettreAJourAffichage(
          event.urlAfterRedirects
        );
      });
  }

  // DÉTERMINER LE LAYOUT À AFFICHER

  private mettreAJourAffichage(url: string): void {

    // Retirer les paramètres et les fragments de l'URL
    const chemin = url
      .split('?')[0]
      .split('#')[0]
      .replace(/\/+$/, '') || '/';

    // Pas de sidebar sur les pages publiques,
    // le catalogue et les pages Client
    const estPageSansBackoffice =
      this.pagesSansBackoffice.includes(chemin) ||
      chemin.startsWith('/client');

    // Afficher la sidebar uniquement dans le backoffice
    this.afficherSidebar = !estPageSansBackoffice;
  }
}