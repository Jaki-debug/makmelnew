import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientPasserCommandes } from '../services/client-passer-commandes';

@Component({
  selector: 'app-client-commande-mak',
  standalone: false,
  templateUrl: './client-commande-mak.html',
  styleUrl: './client-commande-mak.css'
})
export class ClientCommandeMak implements OnInit {

  commandes: any[] = [];
  chargement = false;
  erreur = '';
  recherche = '';
  statutSelectionne = '';

  page = 1;
  limite = 20;

  constructor(
    private clientPasserCommandes: ClientPasserCommandes,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerCommandes();
  }

  chargerCommandes(): void {
    this.chargement = true;
    this.erreur = '';

    this.changeDetectorRef.detectChanges();

    this.clientPasserCommandes
      .recupererCommandes(this.page, this.limite)
      .subscribe({
        next: (response: any) => {
          const resultat =
            response?.data?.items ??
            response?.data?.orders ??
            response?.data ??
            response?.items ??
            response?.orders ??
            [];

          this.commandes = Array.isArray(resultat)
            ? resultat
            : [];

          this.chargement = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Erreur lors du chargement des commandes :',
            error
          );

          this.commandes = [];
          this.chargement = false;

          this.erreur = error?.status === 401
            ? 'Veuillez vous connecter pour consulter vos commandes.'
            : 'Impossible de charger vos commandes.';

          this.changeDetectorRef.detectChanges();

          if (error?.status === 401) {
            this.router.navigate(['/client/connexion']);
          }
        }
      });
  }

  get commandesFiltrees(): any[] {
    const terme = this.recherche.trim().toLowerCase();

    return this.commandes.filter((commande: any) => {
      const numero = String(
        commande.numero ??
        commande.orderNumber ??
        commande.id ??
        ''
      ).toLowerCase();

      const client = String(
        commande.client ??
        commande.customerName ??
        ''
      ).toLowerCase();

      const statut = String(
        commande.statut ??
        commande.status ??
        ''
      );

      const correspondRecherche =
        !terme ||
        numero.includes(terme) ||
        client.includes(terme);

      const correspondStatut =
        !this.statutSelectionne ||
        statut === this.statutSelectionne;

      return correspondRecherche && correspondStatut;
    });
  }

  voirDetails(commande: any): void {
    const id = commande.id ?? commande.orderId;

    if (id == null || id === '') {
      console.error(
        'Identifiant de commande introuvable.',
        commande
      );
      return;
    }

    // Utiliser la route de détail réservée au client.
    this.router.navigate(['/client/mes-commandes', id]);
  }
}