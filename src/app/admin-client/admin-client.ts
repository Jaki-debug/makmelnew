
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';

import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-admin-client',
  standalone: false,
  templateUrl: './admin-client.html',
  styleUrl: './admin-client.css'
})
export class AdminClient implements OnInit {

  private apiUrl = 'https://api.commecheznous.fr/api/v1/admin/customers';

  clients: any[] = [];

  chargement = false;
  suppressionEnCours = false;

  erreur = '';
  succes = '';

  // Pagination intégrée
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  recherche = '';
  statut: string = '';

  constructor(
    private http: HttpClient,
    private auth: Auth,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Page AdminClient initialisée.');

    const token = this.auth.getToken();

    if (!token) {
      this.erreur =
        'Aucun jeton de connexion trouvé. Veuillez vous reconnecter.';
      this.chargement = false;
      return;
    }

    this.chargerClients();
  }

  // En-têtes d'authentification
  private obtenirHeaders(): HttpHeaders {
    const token = this.auth.getToken();

    return new HttpHeaders({
      Authorization: 'Bearer ' + token
    });
  }

  // Charger les clients depuis l'API
  chargerClients(): void {
    const token = this.auth.getToken();

    if (!token) {
      this.erreur =
        'Aucun jeton de connexion trouvé. Veuillez vous reconnecter.';
      this.chargement = false;
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.chargement = true;
    this.erreur = '';

    let params = new HttpParams()
      .set('page', this.page.toString())
      .set('limit', this.limit.toString());

    if (this.recherche.trim()) {
      params = params.set('search', this.recherche.trim());
    }

    if (this.statut === 'actif') {
      params = params.set('isActive', 'true');
    }

    if (this.statut === 'inactif') {
      params = params.set('isActive', 'false');
    }

    this.http.get(this.apiUrl, {
      params,
      headers: this.obtenirHeaders(),
      withCredentials: true
    }).subscribe({
      next: (response: any) => {
        console.log('Réponse API clients :', response);

        const donnees = response?.data ?? response;

        // Récupérer la liste des clients
        if (Array.isArray(donnees)) {
          this.clients = donnees;
        } else {
          this.clients =
            donnees?.items ??
            donnees?.clients ??
            donnees?.customers ??
            donnees?.results ??
            [];
        }

        // Récupérer les informations de pagination
        const pagination =
          donnees?.pagination ??
          response?.pagination ??
          {};

        this.total =
          Number(
            pagination?.total ??
            donnees?.total ??
            response?.total ??
            this.clients.length
          );

        this.totalPages = Math.max(
          1,
          Number(
            pagination?.totalPages ??
            pagination?.pages ??
            Math.ceil(this.total / this.limit)
          )
        );

        // Éviter de rester sur une page inexistante
        if (this.page > this.totalPages) {
          this.page = this.totalPages;
          this.chargement = false;
          this.chargerClients();
          return;
        }

        this.chargement = false;
        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        console.error('Erreur API clients :', error);

        this.chargement = false;

        if (error?.status === 0) {
          this.erreur =
            'Impossible de joindre le serveur API. Vérifiez que le backend fonctionne sur le port 3000.';
        } else if (error?.status === 401) {
          this.erreur =
            'Authentification refusée. Veuillez vous reconnecter.';
        } else if (error?.status === 403) {
          this.erreur =
            'Vous ne disposez pas des permissions nécessaires pour consulter les clients.';
        } else {
          this.erreur =
            error?.error?.error?.message ??
            error?.error?.message ??
            'Impossible de charger les clients.';
        }

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // Rechercher un client
  rechercher(): void {
    this.page = 1;
    this.chargerClients();
  }

  // Filtrer les clients par statut
  changerStatut(): void {
    this.page = 1;
    this.chargerClients();
  }

  // Modifier le nombre de clients par page
  changerLimite(nouvelleLimite: number | string): void {
    const valeur = Number(nouvelleLimite);

    if (!Number.isFinite(valeur) || valeur < 1) {
      return;
    }

    this.limit = valeur;
    this.page = 1;
    this.chargerClients();
  }

  // Naviguer vers une page précise
  changerPage(numeroPage: number): void {
    if (
      this.chargement ||
      numeroPage < 1 ||
      numeroPage > this.totalPages ||
      numeroPage === this.page
    ) {
      return;
    }

    this.page = numeroPage;
    this.chargerClients();
  }

  // Page précédente
  pagePrecedente(): void {
    this.changerPage(this.page - 1);
  }

  // Page suivante
  pageSuivante(): void {
    this.changerPage(this.page + 1);
  }

  // Aller à une page précise
  allerPage(numeroPage: number): void {
    this.changerPage(numeroPage);
  }

  // Générer les numéros de pages à afficher
  obtenirPages(): number[] {
    const pages: number[] = [];

    const debut = Math.max(1, this.page - 2);
    const fin = Math.min(this.totalPages, this.page + 2);

    for (let i = debut; i <= fin; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Consulter un client
  voirClient(client: any): void {
    if (!client?.id) {
      return;
    }

    this.router.navigate(['/admin/client', client.id]);
  }

  // Modifier un client
  modifierClient(client: any): void {
    if (!client?.id) {
      return;
    }

    this.router.navigate(['/admin/client/update', client.id]);
  }

  // Supprimer un client
  supprimerClient(client: any): void {
    if (!client?.id) {
      this.erreur = 'Identifiant du client introuvable.';
      return;
    }

    if (this.suppressionEnCours) {
      return;
    }

    const nom = this.obtenirNom(client);

    const confirmation = confirm(
      `Attention : cette opération peut anonymiser le compte du client.\n\n` +
      `Voulez-vous vraiment continuer pour ${nom} ?`
    );

    if (!confirmation) {
      return;
    }

    const token = this.auth.getToken();

    if (!token) {
      this.erreur =
        'Session expirée. Veuillez vous reconnecter.';
      return;
    }

    this.erreur = '';
    this.succes = '';
    this.suppressionEnCours = true;

    this.http.delete(
      `${this.apiUrl}/${encodeURIComponent(client.id)}`,
      {
        headers: this.obtenirHeaders(),
        withCredentials: true
      }
    ).subscribe({
      next: (response: any) => {
        console.log('Réponse suppression client :', response);

        this.suppressionEnCours = false;
        this.succes =
          `L'opération de suppression du client ${nom} a réussi.`;

        // Retirer le client de la liste affichée
        this.clients = this.clients.filter(
          c => c.id !== client.id
        );

        this.total = Math.max(0, this.total - 1);

        this.totalPages = Math.max(
          1,
          Math.ceil(this.total / this.limit)
        );

        // Revenir à la dernière page valide si nécessaire
        if (this.page > this.totalPages) {
          this.page = this.totalPages;
        }

        // Synchroniser les données avec le serveur
        this.chargerClients();
        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        console.error(
          'Erreur lors de la suppression du client :',
          error
        );

        this.suppressionEnCours = false;

        if (error?.status === 401) {
          this.erreur =
            'Authentification refusée. Veuillez vous reconnecter.';
        } else if (error?.status === 403) {
          this.erreur =
            'Vous ne disposez pas des permissions nécessaires pour supprimer ce client.';
        } else if (error?.status === 404) {
          this.erreur =
            'Ce client est introuvable ou a déjà été supprimé.';
        } else if (error?.status === 0) {
          this.erreur =
            'Impossible de joindre le serveur API.';
        } else {
          this.erreur =
            error?.error?.error?.message ??
            error?.error?.message ??
            'Impossible de supprimer ce client.';
        }

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // Nom complet du client
  obtenirNom(client: any): string {
    const prenom =
      client?.firstName ??
      client?.firstname ??
      '';

    const nom =
      client?.lastName ??
      client?.lastname ??
      '';

    return `${prenom} ${nom}`.trim() || 'Client sans nom';
  }

  // Téléphone
  obtenirTelephone(client: any): string {
    return client?.phone || 'Non renseigné';
  }

  // Email
  obtenirEmail(client: any): string {
    return client?.email || 'Non renseigné';
  }

  // Statut du client
  obtenirStatut(client: any): string {
    return client?.isActive === false ? 'Inactif' : 'Actif';
  }

  // Vérifier si le client est actif
  estActif(client: any): boolean {
    return client?.isActive !== false;
  }
}
