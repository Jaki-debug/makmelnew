
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import {
  Subject,
  Subscription,
  of
} from 'rxjs';

import {
  debounceTime,
  switchMap,
  catchError,
  finalize,
  tap
} from 'rxjs/operators';

import { CommandesService } from '../services/commandes';

@Component({
  selector: 'app-commandes-recu-mak',
  standalone: false,
  templateUrl: './commandes-recu-mak.html',
  styleUrl: './commandes-recu-mak.css'
})
export class CommandesRecuMak implements OnInit, OnDestroy {

  commandes: any[] = [];

  chargement = false;
  erreur = '';

  recherche = '';
  statut = '';
  typeReception = '';
  dateFrom = '';
  dateTo = '';

  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  private rechercheSubject = new Subject<void>();
  private requeteSubject = new Subject<void>();

  private rechercheSubscription?: Subscription;
  private requeteSubscription?: Subscription;

  constructor(
    private commandesService: CommandesService,
    private router: Router
  ) {}

  // ==========================================
  // INITIALISATION
  // ==========================================

  ngOnInit(): void {
    this.initialiserFluxRequetes();
    this.initialiserRechercheAutomatique();

    // Une seule requête initiale.
    this.chargerCommandes();
  }

  ngOnDestroy(): void {
    this.rechercheSubscription?.unsubscribe();
    this.requeteSubscription?.unsubscribe();

    this.rechercheSubject.complete();
    this.requeteSubject.complete();
  }

  // ==========================================
  // FLUX CENTRAL DES REQUÊTES
  // ==========================================

  /**
   * Centralise les chargements.
   *
   * switchMap désabonne la requête précédente lorsqu'un
   * nouveau chargement est demandé, afin d'éviter plusieurs
   * requêtes concurrentes inutiles.
   */
  private initialiserFluxRequetes(): void {
    this.requeteSubscription = this.requeteSubject
      .pipe(
        switchMap(() => this.executerRequete())
      )
      .subscribe();
  }

  /**
   * Toutes les saisies rapides sont regroupées.
   */
  private initialiserRechercheAutomatique(): void {
    this.rechercheSubscription = this.rechercheSubject
      .pipe(
        debounceTime(250)
      )
      .subscribe(() => {
        this.page = 1;
        this.requeteSubject.next();
      });
  }

  /**
   * Annule une recherche différée avant une action immédiate.
   */
  private annulerRechercheDifferee(): void {
    this.rechercheSubscription?.unsubscribe();
    this.rechercheSubject.complete();

    this.rechercheSubject = new Subject<void>();

    this.initialiserRechercheAutomatique();
  }

  /**
   * Appelée lors de la saisie dans le champ de recherche.
   */
  rechercheChange(): void {
    this.rechercheSubject.next();
  }

  // ==========================================
  // REQUÊTE API
  // ==========================================

  private executerRequete() {
    this.chargement = true;
    this.erreur = '';

    return this.commandesService.lister({
      page: this.page,
      limit: this.limit,
      search: this.recherche.trim(),
      status: this.statut,
      fulfillmentType: this.typeReception,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo
    }).pipe(

      tap((reponse: any) => {
        this.traiterReponse(reponse);
      }),

      catchError((erreurHttp: any) => {
        console.error(
          'Erreur de chargement des commandes :',
          erreurHttp
        );

        this.erreur =
          erreurHttp?.error?.message ??
          erreurHttp?.error?.error?.message ??
          'Impossible de charger les commandes. Vérifie que le serveur API est démarré.';

        this.commandes = [];
        this.total = 0;
        this.totalPages = 0;

        return of(null);
      }),

      finalize(() => {
        this.chargement = false;
      })
    );
  }

  // ==========================================
  // TRAITEMENT DE LA RÉPONSE API
  // ==========================================

  private traiterReponse(reponse: any): void {
    if (reponse === null || reponse === undefined) {
      return;
    }

    const resultat = reponse?.data ?? reponse;

    let liste: any[] = [];

    if (Array.isArray(resultat)) {
      liste = resultat;
    } else {
      const donnees =
        resultat?.items ??
        resultat?.orders ??
        resultat?.results ??
        resultat?.data ??
        [];

      liste = Array.isArray(donnees) ? donnees : [];
    }

    this.commandes = liste;

    this.total = Number(
      resultat?.meta?.total ??
      resultat?.pagination?.total ??
      resultat?.total ??
      liste.length
    );

    this.totalPages = Number(
      resultat?.meta?.totalPages ??
      resultat?.pagination?.totalPages ??
      Math.ceil(this.total / this.limit)
    );

    // Évite une pagination incohérente si le résultat diminue.
    if (this.totalPages > 0 && this.page > this.totalPages) {
      this.page = this.totalPages;
    }
  }

  // ==========================================
  // CHARGEMENT ET ACTUALISATION
  // ==========================================

  chargerCommandes(): void {
    this.requeteSubject.next();
  }

  /**
   * Recherche immédiate lorsque le bouton est utilisé.
   */
  rechercher(): void {
    this.annulerRechercheDifferee();
    this.page = 1;
    this.chargerCommandes();
  }

  /**
   * Réinitialise tous les filtres.
   */
  reinitialiserFiltres(): void {
    this.annulerRechercheDifferee();

    this.recherche = '';
    this.statut = '';
    this.typeReception = '';
    this.dateFrom = '';
    this.dateTo = '';

    this.page = 1;

    this.chargerCommandes();
  }

  /**
   * Recharge la liste après modification d'un filtre.
   */
  changerFiltres(): void {
    this.annulerRechercheDifferee();
    this.page = 1;

    this.chargerCommandes();
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  allerPage(nouvellePage: number): void {
    if (nouvellePage < 1) {
      return;
    }

    if (
      this.totalPages > 0 &&
      nouvellePage > this.totalPages
    ) {
      return;
    }

    if (nouvellePage === this.page) {
      return;
    }

    this.annulerRechercheDifferee();

    this.page = nouvellePage;
    this.chargerCommandes();
  }

  pagePrecedente(): void {
    this.allerPage(this.page - 1);
  }

  pageSuivante(): void {
    this.allerPage(this.page + 1);
  }

  /**
   * Modifie le nombre de commandes par page.
   */
  changerLimite(): void {
    this.annulerRechercheDifferee();

    this.page = 1;

    if (this.limit < 1) {
      this.limit = 20;
    }

    this.chargerCommandes();
  }

  // ==========================================
  // NAVIGATION VERS LE DÉTAIL
  // ==========================================

  ouvrirDetail(commande: any): void {
    const id = commande?.id;

    if (id === undefined || id === null || id === '') {
      this.erreur =
        'Impossible d’ouvrir le détail : identifiant de commande introuvable.';
      return;
    }

    this.router.navigate([
      '/commandes-recu-mak',
      id
    ]).then(navigationReussie => {
      if (!navigationReussie) {
        console.error(
          'La navigation vers le détail de la commande a échoué.'
        );
      }
    });
  }

  voirDetails(commande: any): void {
    this.ouvrirDetail(commande);
  }

  fermerDetail(): void {
    this.router.navigate(['/commandes-recu-mak']);
  }

  // ==========================================
  // NUMÉRO DE COMMANDE
  // ==========================================

  numeroCommande(commande: any): string {
    return String(
      commande?.orderNumber ??
      commande?.order_number ??
      commande?.numeroCommande ??
      commande?.numero_commande ??
      commande?.reference ??
      commande?.id ??
      '—'
    );
  }

  // ==========================================
  // INFORMATIONS CLIENT
  // ==========================================

  nomClient(commande: any): string {
    const client = commande?.customer ?? commande?.user;

    if (client) {
      const nom = [
        client.firstName ?? client.first_name,
        client.lastName ?? client.last_name
      ].filter(Boolean).join(' ');

      return nom ||
        client.name ||
        client.fullName ||
        client.full_name ||
        client.email ||
        'Client non renseigné';
    }

    const nomCommande = [
      commande?.customerFirstName ??
        commande?.customer_first_name,
      commande?.customerLastName ??
        commande?.customer_last_name
    ].filter(Boolean).join(' ');

    return commande?.customerName ??
      commande?.customer_name ??
      commande?.clientNom ??
      (nomCommande || 'Client non renseigné');
  }

  telephoneClient(commande: any): string {
    const client = commande?.customer ?? commande?.user;

    return client?.phone ??
      client?.telephone ??
      commande?.customerPhone ??
      commande?.customer_phone ??
      '—';
  }

  emailClient(commande: any): string {
    const client = commande?.customer ?? commande?.user;

    return client?.email ??
      commande?.customerEmail ??
      commande?.customer_email ??
      commande?.clientEmail ??
      '—';
  }

  // ==========================================
  // MONTANT ET STATUT
  // ==========================================

  montant(commande: any): number {
    return Number(
      commande?.totalAmount ??
      commande?.total_amount ??
      commande?.total ??
      commande?.montantTotal ??
      commande?.amount ??
      0
    );
  }

  statutLibelle(statut: string): string {
    const libelles: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      PROCESSING: 'En préparation',
      READY: 'Prête',
      READY_FOR_PICKUP: 'Prête au retrait',
      OUT_FOR_DELIVERY: 'En livraison',
      DELIVERY: 'En livraison',
      DELIVERED: 'Livrée',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée'
    };

    return libelles[statut] ?? statut ?? 'Non renseigné';
  }

  getStatutLabel(statut: string): string {
    return this.statutLibelle(statut);
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      PENDING: 'status-pending',
      CONFIRMED: 'status-confirmed',
      PROCESSING: 'status-processing',
      READY: 'status-ready',
      READY_FOR_PICKUP: 'status-ready',
      OUT_FOR_DELIVERY: 'status-delivery',
      DELIVERY: 'status-delivery',
      DELIVERED: 'status-delivered',
      COMPLETED: 'status-delivered',
      CANCELLED: 'status-cancelled',
      REFUNDED: 'status-refunded'
    };

    return classes[statut] ?? 'status-default';
  }

  // ==========================================
  // MODE DE RÉCEPTION ET DATE
  // ==========================================

  typeReceptionLibelle(type: string): string {
    const libelles: Record<string, string> = {
      DELIVERY: 'Livraison',
      PICKUP: 'Retrait'
    };

    return libelles[type] ?? type ?? '—';
  }

  dateCommande(commande: any): string {
    return commande?.createdAt ??
      commande?.created_at ??
      commande?.orderDate ??
      commande?.order_date ??
      '';
  }

  // ==========================================
  // PAIEMENT ET ADRESSE
  // ==========================================

  methodePaiement(commande: any): string {
    const methode =
      commande?.paymentMethod ??
      commande?.payment_method ??
      commande?.payment?.method ??
      '';

    const libelles: Record<string, string> = {
      MOBILE_MONEY: 'Mobile Money',
      CARD: 'Carte bancaire',
      CASH_ON_DELIVERY: 'Paiement à la livraison'
    };

    return (libelles[methode] ?? methode) || '—';
  }

  adresseLivraison(commande: any): string {
    const adresse =
      commande?.shippingAddress ??
      commande?.shipping_address ??
      commande?.deliveryAddress ??
      commande?.delivery_address ??
      commande?.address;

    if (typeof adresse === 'string') {
      return adresse || '—';
    }

    if (adresse && typeof adresse === 'object') {
      return [
        adresse.addressLine1 ??
          adresse.address_line1 ??
          adresse.address,
        adresse.addressLine2 ??
          adresse.address_line2,
        adresse.city,
        adresse.region,
        adresse.country
      ].filter(Boolean).join(', ') || '—';
    }

    return '—';
  }

  // ==========================================
  // ARTICLES DE LA COMMANDE
  // ==========================================

  articlesCommande(commande: any): any[] {
    const articles =
      commande?.items ??
      commande?.orderItems ??
      commande?.order_items ??
      commande?.products ??
      [];

    return Array.isArray(articles) ? articles : [];
  }

  nomArticle(article: any): string {
    return article?.product?.name ??
      article?.productName ??
      article?.product_name ??
      article?.name ??
      article?.title ??
      'Article';
  }

  quantiteArticle(article: any): number {
    return Number(
      article?.quantity ??
      article?.qty ??
      1
    );
  }

  prixArticle(article: any): number {
    return Number(
      article?.unitPrice ??
      article?.unit_price ??
      article?.price ??
      article?.product?.price ??
      0
    );
  }

  sousTotalArticle(article: any): number {
    const sousTotal =
      article?.subtotal ??
      article?.subTotal ??
      article?.total;

    if (sousTotal !== undefined && sousTotal !== null) {
      return Number(sousTotal);
    }

    return this.quantiteArticle(article) *
      this.prixArticle(article);
  }

  // ==========================================
  // STATISTIQUES
  // ==========================================

  compterStatut(statutRecherche: string): number {
    return this.commandes.filter(
      commande =>
        String(commande?.status ?? '').toUpperCase() ===
        statutRecherche
    ).length;
  }

  compterTerminees(): number {
    return this.commandes.filter(commande => {
      const statut = String(
        commande?.status ?? ''
      ).toUpperCase();

      return statut === 'COMPLETED' ||
        statut === 'DELIVERED';
    }).length;
  }

  get totalCommandes(): number {
    return this.total;
  }

  get commandesEnAttente(): number {
    return this.compterStatut('PENDING');
  }

  get commandesLivrees(): number {
    return this.compterTerminees();
  }

  // ==========================================
  // TRACKBY POUR LE HTML
  // ==========================================

  trackByCommande(
    index: number,
    commande: any
  ): string {
    return String(
      commande?.id ??
      commande?.orderNumber ??
      commande?.order_number ??
      index
    );
  }
}
