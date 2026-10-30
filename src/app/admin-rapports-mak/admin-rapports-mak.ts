
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import {
  Observable,
  EMPTY,
  from
} from 'rxjs';

import {
  catchError,
  finalize,
  take,
  timeout,
  switchMap
} from 'rxjs/operators';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  RapportsMakService,
  TypeRapportMak,
  FormatRapportMak,
  PeriodeRapportMak
} from '../services/rapports-mak';

interface ResumeRapportMak {
  libelle: string;
  valeur: string;
}

interface LigneRapportMak {
  [cle: string]: any;
}

interface TableauRapportMak {
  chemin: string;
  lignes: LigneRapportMak[];
}

interface InformationRapportMak {
  libelle: string;
  valeur: string;
}

@Component({
  selector: 'app-admin-rapports-mak',
  standalone: false,
  templateUrl: './admin-rapports-mak.html',
  styleUrl: './admin-rapports-mak.css'
})
export class AdminRapportsMak implements OnInit {

  rapportSelectionne: TypeRapportMak = 'SALES';
  formatSelectionne: FormatRapportMak = 'XLSX';

  dateFrom = '';
  dateTo = '';

  chargement = false;
  exportEnCours = false;
  apercuCharge = false;

  erreur = '';
  message = '';

  donneesRapport: any = null;
  donneesBrutes = '';

  resume: ResumeRapportMak[] = [];
  colonnes: string[] = [];
  lignes: LigneRapportMak[] = [];
  informations: InformationRapportMak[] = [];

  // ============================================================
  // PAGINATION
  // ============================================================

  pageActuelle = 1;
  taillePage = 5;

  readonly taillesPage: number[] = [5, 10, 25, 50, 100];

  private requeteEnCours = false;
  private signatureApercu = '';

  readonly typesRapports: {
    valeur: TypeRapportMak;
    libelle: string;
  }[] = [
    { valeur: 'SALES', libelle: 'Ventes' },
    { valeur: 'ORDERS', libelle: 'Commandes' },
    { valeur: 'PRODUCTS', libelle: 'Produits' },
    { valeur: 'INVENTORY', libelle: 'Inventaire' },
    { valeur: 'CUSTOMERS', libelle: 'Clients' },
    { valeur: 'PAYMENTS', libelle: 'Paiements' },
    { valeur: 'LOYALTY', libelle: 'Fidélité' }
  ];

  readonly formats: FormatRapportMak[] = [
    'CSV',
    'XLSX',
    'PDF'
  ];

  constructor(
    private rapportsService: RapportsMakService,
    private cdr: ChangeDetectorRef
  ) {}

  // ============================================================
  // INITIALISATION
  // ============================================================

  ngOnInit(): void {
    const aujourdHui = new Date();
    const debut = new Date(aujourdHui);

    debut.setDate(debut.getDate() - 29);

    this.dateFrom = this.formaterDateInput(debut);
    this.dateTo = this.formaterDateInput(aujourdHui);

    this.chargerRapport();
  }

  // ============================================================
  // INVALIDATION DE L'APERÇU
  // ============================================================

  invaliderApercu(): void {
    this.apercuCharge = false;
    this.signatureApercu = '';

    this.donneesRapport = null;
    this.donneesBrutes = '';

    this.resume = [];
    this.colonnes = [];
    this.lignes = [];
    this.informations = [];

    this.pageActuelle = 1;

    this.erreur = '';
    this.message =
      'Les critères ont changé. Vous pouvez afficher le rapport ou lancer directement son export.';

    this.cdr.detectChanges();
  }

  // ============================================================
  // CHARGEMENT DE L'APERÇU
  // ============================================================

  chargerRapport(): void {
    if (this.requeteEnCours || this.exportEnCours) {
      return;
    }

    this.erreur = '';
    this.message = '';
    this.apercuCharge = false;
    this.signatureApercu = '';

    if (
      this.rapportSelectionne !== 'INVENTORY' &&
      (!this.dateFrom || !this.dateTo)
    ) {
      this.erreur = 'Veuillez sélectionner une période.';
      this.cdr.detectChanges();
      return;
    }

    if (
      this.rapportSelectionne !== 'INVENTORY' &&
      this.dateFrom > this.dateTo
    ) {
      this.erreur =
        'La date de début doit précéder la date de fin.';

      this.cdr.detectChanges();
      return;
    }

    const periode: PeriodeRapportMak = {
      dateFrom: this.dateFrom
        ? `${this.dateFrom}T00:00:00.000Z`
        : undefined,

      dateTo: this.dateTo
        ? `${this.dateTo}T23:59:59.999Z`
        : undefined
    };

    this.requeteEnCours = true;
    this.chargement = true;

    this.donneesRapport = null;
    this.donneesBrutes = '';

    this.resume = [];
    this.colonnes = [];
    this.lignes = [];
    this.informations = [];

    this.pageActuelle = 1;

    this.cdr.detectChanges();

    this.obtenirRapport(periode).pipe(
      timeout(15000),
      take(1),

      catchError((error: any) => {
        this.erreur = this.extraireErreur(error);
        this.message = '';
        return EMPTY;
      }),

      finalize(() => {
        this.chargement = false;
        this.requeteEnCours = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (reponse: any) => {
        if (
          reponse === null ||
          reponse === undefined
        ) {
          this.erreur =
            'Aucune réponse reçue du serveur.';

          this.cdr.detectChanges();
          return;
        }

        if (reponse?.success === false) {
          this.erreur =
            reponse?.error?.message ??
            reponse?.message ??
            'Impossible de charger le rapport.';

          this.cdr.detectChanges();
          return;
        }

        const donnees = this.extrairePayload(reponse);

        if (
          donnees === null ||
          donnees === undefined
        ) {
          this.erreur =
            'Le serveur n’a retourné aucune donnée pour ce rapport.';

          this.cdr.detectChanges();
          return;
        }

        this.donneesRapport = donnees;
        this.donneesBrutes = this.serialiserJSON(donnees);

        this.resume = this.construireResume(donnees);
        this.construireTableau(donnees);

        this.informations =
          this.construireInformations(donnees);

        this.pageActuelle = 1;
        this.signatureApercu = this.creerSignatureFiltres();
        this.apercuCharge = true;

        if (this.apercuContientDonnees) {
          this.message =
            'Aperçu chargé. Vous pouvez exporter le rapport.';
        } else {
          this.message =
            'Aperçu reçu sans données tabulaires reconnues. Vous pouvez tenter l’export.';
        }

        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // SÉLECTION DU RAPPORT
  // ============================================================

  private obtenirRapport(
    periode: PeriodeRapportMak
  ): Observable<any> {
    switch (this.rapportSelectionne) {
      case 'SALES':
        return this.rapportsService.getSales(periode);

      case 'ORDERS':
        return this.rapportsService.getOrders(periode);

      case 'PRODUCTS':
        return this.rapportsService.getProducts(periode);

      case 'INVENTORY':
        return this.rapportsService.getInventory();

      case 'CUSTOMERS':
        return this.rapportsService.getCustomers(periode);

      case 'PAYMENTS':
        return this.rapportsService.getPayments(periode);

      case 'LOYALTY':
        return this.rapportsService.getLoyalty(periode);

      default:
        return EMPTY;
    }
  }

  // ============================================================
  // EXTRACTION DE LA RÉPONSE API
  // ============================================================

  private extrairePayload(reponse: any): any {
    if (
      reponse &&
      typeof reponse === 'object' &&
      !Array.isArray(reponse) &&
      reponse.success === true &&
      reponse.data !== undefined
    ) {
      return reponse.data;
    }

    if (
      reponse &&
      typeof reponse === 'object' &&
      !Array.isArray(reponse) &&
      Object.prototype.hasOwnProperty.call(reponse, 'data') &&
      Object.keys(reponse).every(cle =>
        ['data', 'message', 'statusCode'].includes(cle)
      )
    ) {
      return reponse.data;
    }

    return reponse;
  }

  private serialiserJSON(donnees: any): string {
    try {
      return JSON.stringify(donnees, null, 2);
    } catch {
      return 'Les données reçues ne peuvent pas être affichées en JSON.';
    }
  }

  // ============================================================
  // GESTION DES ERREURS
  // ============================================================

  private extraireErreur(error: any): string {
    if (error?.name === 'TimeoutError') {
      return 'Le serveur met trop de temps à répondre. Réessayez.';
    }

    const corps = error?.error;

    const message =
      corps?.error?.message ??
      corps?.message ??
      error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (
      typeof message === 'string' &&
      message.trim()
    ) {
      return message;
    }

    if (error?.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
    }

    if (error?.status) {
      return `La requête a échoué (HTTP ${error.status}).`;
    }

    return 'Une erreur est survenue lors de la requête.';
  }

  private gererErreurExport(
    error: any
  ): Observable<never> {
    const corps = error?.error;

    if (
      typeof Blob !== 'undefined' &&
      corps instanceof Blob
    ) {
      return from(corps.text()).pipe(
        switchMap((texte: string) => {
          let contenu: any;

          try {
            contenu = JSON.parse(texte);
          } catch {
            contenu = { message: texte };
          }

          this.erreur = this.extraireErreur({
            ...error,
            error: contenu
          });

          this.message = '';
          return EMPTY;
        }),

        catchError(() => {
          this.erreur = this.extraireErreur(error);
          this.message = '';
          return EMPTY;
        })
      );
    }

    this.erreur = this.extraireErreur(error);
    this.message = '';

    return EMPTY;
  }

  // ============================================================
  // INDICATEURS CLÉS
  // ============================================================

  private construireResume(
    donnees: any
  ): ResumeRapportMak[] {
    if (!donnees || typeof donnees !== 'object') {
      return [];
    }

    const resultat: ResumeRapportMak[] = [];

    const clesExclues = new Set([
      'id',
      'title',
      'from',
      'to',
      'date',
      'datefrom',
      'dateto',
      'createdat',
      'updatedat',
      'page',
      'limit',
      'totalpages',
      'statuscode',
      'success',
      'message'
    ]);

    const parcourir = (
      objet: any,
      profondeur = 0
    ): void => {
      if (
        !objet ||
        typeof objet !== 'object' ||
        profondeur > 2 ||
        Array.isArray(objet)
      ) {
        return;
      }

      for (const [cle, valeur] of Object.entries(objet)) {
        if (clesExclues.has(this.normaliserCle(cle))) {
          continue;
        }

        if (
          typeof valeur === 'number' &&
          Number.isFinite(valeur)
        ) {
          resultat.push({
            libelle: this.libelleChamp(cle),
            valeur: this.formaterValeur(cle, valeur)
          });
        } else if (
          valeur &&
          typeof valeur === 'object' &&
          !Array.isArray(valeur)
        ) {
          parcourir(valeur, profondeur + 1);
        }
      }
    };

    parcourir(donnees);

    const vus = new Set<string>();

    return resultat.filter(item => {
      const cle = `${item.libelle}|${item.valeur}`;

      if (vus.has(cle)) {
        return false;
      }

      vus.add(cle);
      return true;
    }).slice(0, 6);
  }

  // ============================================================
  // CONSTRUCTION DU TABLEAU
  // ============================================================

  private construireTableau(donnees: any): void {
    this.lignes = [];
    this.colonnes = [];

    if (Array.isArray(donnees)) {
      this.definirLignes(donnees);
      return;
    }

    if (!donnees || typeof donnees !== 'object') {
      return;
    }

    if (
      Array.isArray(donnees.headers) &&
      Array.isArray(donnees.rows)
    ) {
      this.colonnes = donnees.headers.map(
        (entete: any) => String(entete)
      );

      this.lignes = donnees.rows.map((ligne: any) => {
        if (Array.isArray(ligne)) {
          const objet: LigneRapportMak = {};

          this.colonnes.forEach((colonne, index) => {
            objet[colonne] = ligne[index];
          });

          return objet;
        }

        if (ligne && typeof ligne === 'object') {
          return ligne as LigneRapportMak;
        }

        return { valeur: ligne };
      });

      return;
    }

    const tableaux = this.collecterTableaux(donnees);

    if (tableaux.length === 0) {
      return;
    }

    tableaux.sort(
      (a, b) => this.scoreTableau(b) - this.scoreTableau(a)
    );

    this.definirLignes(tableaux[0].lignes);
  }

  private definirLignes(donnees: any[]): void {
    this.lignes = donnees
      .filter(ligne =>
        ligne !== null &&
        ligne !== undefined
      )
      .map(ligne => {
        if (
          typeof ligne === 'object' &&
          !Array.isArray(ligne)
        ) {
          return ligne as LigneRapportMak;
        }

        return { valeur: ligne };
      });

    const cles = new Set<string>();

    this.lignes.forEach(ligne => {
      Object.keys(ligne).forEach(cle => cles.add(cle));
    });

    this.colonnes = Array.from(cles);
    this.pageActuelle = 1;
  }

  private collecterTableaux(
    objet: any,
    chemin = '',
    profondeur = 0,
    resultat: TableauRapportMak[] = []
  ): TableauRapportMak[] {
    if (
      objet === null ||
      objet === undefined ||
      typeof objet !== 'object' ||
      profondeur > 8
    ) {
      return resultat;
    }

    if (Array.isArray(objet)) {
      if (objet.length > 0) {
        const lignes = objet
          .filter(element =>
            element !== null &&
            element !== undefined
          )
          .map(element => {
            if (
              typeof element === 'object' &&
              !Array.isArray(element)
            ) {
              return element as LigneRapportMak;
            }

            return { valeur: element };
          });

        if (lignes.length > 0) {
          resultat.push({ chemin, lignes });
        }
      }

      return resultat;
    }

    for (const [cle, valeur] of Object.entries(objet)) {
      if (valeur && typeof valeur === 'object') {
        const nouveauChemin = chemin
          ? `${chemin}.${cle}`
          : cle;

        this.collecterTableaux(
          valeur,
          nouveauChemin,
          profondeur + 1,
          resultat
        );
      }
    }

    return resultat;
  }

  private scoreTableau(
    tableau: TableauRapportMak
  ): number {
    const chemin = this.normaliserCle(tableau.chemin);

    const priorites: Record<TypeRapportMak, string[]> = {
      SALES: [
        'revenuebyday',
        'dailyrevenue',
        'salesbyday',
        'salesbydate',
        'dailysales',
        'sales',
        'rows',
        'records',
        'items',
        'results'
      ],
      ORDERS: [
        'orders',
        'commandes',
        'rows',
        'records',
        'items',
        'results'
      ],
      PRODUCTS: [
        'products',
        'produits',
        'rows',
        'records',
        'items',
        'results'
      ],
      INVENTORY: [
        'inventory',
        'inventaire',
        'stock',
        'products',
        'rows',
        'items',
        'results'
      ],
      CUSTOMERS: [
        'topcustomers',
        'topclients',
        'customers',
        'clients',
        'rows',
        'items',
        'results'
      ],
      PAYMENTS: [
        'payments',
        'paiements',
        'rows',
        'records',
        'items',
        'results'
      ],
      LOYALTY: [
        'loyaltycustomers',
        'loyalty',
        'customers',
        'clients',
        'rows',
        'items',
        'results'
      ]
    };

    const nombreColonnes = new Set(
      tableau.lignes.flatMap(ligne => Object.keys(ligne))
    ).size;

    let score =
      tableau.lignes.length * 2 +
      Math.min(nombreColonnes, 10);

    const prioritesRapport =
      priorites[this.rapportSelectionne] ?? [];

    const position = prioritesRapport.findIndex(cle =>
      chemin.includes(cle)
    );

    if (position !== -1) {
      score += 1000 - position * 10;
    }

    return score;
  }

  // ============================================================
  // INFORMATIONS SANS TABLEAU
  // ============================================================

  private construireInformations(
    donnees: any
  ): InformationRapportMak[] {
    const resultat: InformationRapportMak[] = [];

    const clesTechniques = new Set([
      'success',
      'message',
      'statuscode',
      'stack',
      'password',
      'token',
      'authorization'
    ]);

    const parcourir = (
      objet: any,
      profondeur = 0
    ): void => {
      if (
        !objet ||
        typeof objet !== 'object' ||
        Array.isArray(objet) ||
        profondeur > 2
      ) {
        return;
      }

      for (const [cle, valeur] of Object.entries(objet)) {
        if (clesTechniques.has(this.normaliserCle(cle))) {
          continue;
        }

        if (
          valeur === null ||
          valeur === undefined ||
          typeof valeur === 'function'
        ) {
          continue;
        }

        if (
          typeof valeur === 'object' &&
          !Array.isArray(valeur)
        ) {
          parcourir(valeur, profondeur + 1);
          continue;
        }

        resultat.push({
          libelle: this.libelleChamp(cle),
          valeur: this.formaterCellule(cle, valeur)
        });
      }
    };

    parcourir(donnees);

    const vus = new Set<string>();

    return resultat.filter(item => {
      const cle = `${item.libelle}|${item.valeur}`;

      if (vus.has(cle)) {
        return false;
      }

      vus.add(cle);
      return true;
    }).slice(0, 20);
  }

  // ============================================================
  // PAGINATION : CALCULS
  // ============================================================

  get lignesPagees(): LigneRapportMak[] {
    const debut = (this.pageActuelle - 1) * this.taillePage;

    return this.lignes.slice(
      debut,
      debut + this.taillePage
    );
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.lignes.length / this.taillePage)
    );
  }

  get debutLigne(): number {
    if (this.lignes.length === 0) {
      return 0;
    }

    return (this.pageActuelle - 1) * this.taillePage + 1;
  }

  get finLigne(): number {
    return Math.min(
      this.pageActuelle * this.taillePage,
      this.lignes.length
    );
  }

  get pagesVisibles(): number[] {
    const total = this.totalPages;

    let debut = Math.max(1, this.pageActuelle - 2);
    let fin = Math.min(total, debut + 4);

    debut = Math.max(1, fin - 4);

    const pages: number[] = [];

    for (let page = debut; page <= fin; page++) {
      pages.push(page);
    }

    return pages;
  }

  // ============================================================
  // PAGINATION : ACTIONS
  // ============================================================

  changerPage(page: number): void {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > this.totalPages ||
      page === this.pageActuelle
    ) {
      return;
    }

    this.pageActuelle = page;
    this.cdr.detectChanges();
  }

  pagePrecedente(): void {
    if (this.pageActuelle > 1) {
      this.changerPage(this.pageActuelle - 1);
    }
  }

  pageSuivante(): void {
    if (this.pageActuelle < this.totalPages) {
      this.changerPage(this.pageActuelle + 1);
    }
  }

  premierePage(): void {
    this.changerPage(1);
  }

  dernierePage(): void {
    this.changerPage(this.totalPages);
  }

  changerTaillePage(taille: number | string): void {
    const nouvelleTaille = Number(taille);

    if (
      !Number.isInteger(nouvelleTaille) ||
      !this.taillesPage.includes(nouvelleTaille)
    ) {
      return;
    }

    this.taillePage = nouvelleTaille;
    this.pageActuelle = 1;
    this.cdr.detectChanges();
  }

  // ============================================================
  // FORMATAGE GÉNÉRAL
  // ============================================================

  formaterCellule(cle: string, valeur: any): string {
    if (
      valeur === null ||
      valeur === undefined ||
      valeur === ''
    ) {
      return '—';
    }

    if (typeof valeur === 'boolean') {
      return valeur ? 'Oui' : 'Non';
    }

    if (typeof valeur === 'number') {
      return this.formaterValeur(cle, valeur);
    }

    if (typeof valeur === 'object') {
      try {
        return JSON.stringify(valeur);
      } catch {
        return String(valeur);
      }
    }

    return String(valeur);
  }

  formaterValeur(cle: string, valeur: number): string {
    const normalisee = this.normaliserCle(cle);

    const champsMonetaires = [
      'revenue',
      'amount',
      'price',
      'totalspent',
      'amountspent',
      'chiffreaffaires',
      'montant',
      'totalamount',
      'averageordervalue',
      'stockvalue',
      'inventoryvalue',
      'valeurstock',
      'totalrevenue',
      'salesamount',
      'netamount',
      'grossamount',
      'ca'
    ];

    const estMonetaire = champsMonetaires.some(champ =>
      normalisee.includes(champ)
    );

    const nombreFormate = this.formaterNombrePdf(valeur);

    return estMonetaire
      ? `${nombreFormate} FCFA`
      : nombreFormate;
  }

  libelleChamp(cle: string): string {
    const libelles: Record<string, string> = {
      title: 'Titre',

      date: 'Date',
      reportdate: 'Date du rapport',
      createdat: 'Date de commande',
      orderdate: 'Date de commande',
      updatedat: 'Date de modification',
      paidat: 'Date de paiement',
      deliveredat: 'Date de livraison',

      revenue: 'Chiffre d’affaires',
      totalrevenue: 'Chiffre d’affaires total',

      totalorders: 'Nombre de commandes',
      orderscount: 'Nombre de commandes',
      ordercount: 'Nombre de commandes',
      averageordervalue: 'Panier moyen',

      totalcustomers: 'Nombre de clients',
      customercount: 'Nombre de clients',
      totalproducts: 'Nombre de produits',
      lowstockcount: 'Stocks faibles',
      outofstockcount: 'Ruptures de stock',
      totalquantity: 'Quantité totale',

      totalpayments: 'Nombre de paiements',
      successfulpayments: 'Paiements réussis',
      failedpayments: 'Paiements échoués',
      totalpoints: 'Points de fidélité',

      from: 'Début de période',
      to: 'Fin de période',
      datefrom: 'Début de période',
      dateto: 'Fin de période',

      amount: 'Montant',
      total: 'Total',
      totalamount: 'Total',
      grandtotal: 'Total',
      totalprice: 'Prix total',
      quantity: 'Quantité',

      status: 'Statut',
      paymentmethod: 'Mode de paiement',
      fulfillmenttype: 'Type',
      ordertype: 'Type de commande',

      customername: 'Client',
      customerfirstname: 'Prénom du client',
      customerlastname: 'Nom du client',
      productname: 'Nom du produit',

      ordernumber: 'N° commande',
      orderreference: 'N° commande',
      reference: 'Référence',
      ordercode: 'N° commande',
      orderid: 'N° commande',
      customerid: 'Client',
      productid: 'Produit'
    };

    const cleNormalisee = this.normaliserCle(cle);

    return libelles[cleNormalisee] ??
      cle
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, lettre => lettre.toUpperCase());
  }

  // Publique pour le template HTML.
  normaliserCle(cle: string): string {
    return String(cle)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  // ============================================================
  // EXPORT PRINCIPAL
  // ============================================================

  exporterRapport(): void {
    if (this.requeteEnCours || this.exportEnCours) {
      return;
    }

    if (
      this.rapportSelectionne !== 'INVENTORY' &&
      (!this.dateFrom || !this.dateTo)
    ) {
      this.erreur = 'Veuillez sélectionner une période.';
      this.message = '';
      this.cdr.detectChanges();
      return;
    }

    if (
      this.rapportSelectionne !== 'INVENTORY' &&
      this.dateFrom > this.dateTo
    ) {
      this.erreur =
        'La date de début doit précéder la date de fin.';

      this.message = '';
      this.cdr.detectChanges();
      return;
    }

    // PDF : génération dans Angular, sans appeler l'export PDF du backend.
    if (this.formatSelectionne === 'PDF') {
      this.exporterPdfFrontend();
      return;
    }

    // CSV et XLSX continuent d'utiliser le service existant.
    this.exportEnCours = true;
    this.erreur = '';
    this.message = '';

    this.cdr.detectChanges();

    this.rapportsService.exportReport({
      report: this.rapportSelectionne,
      format: this.formatSelectionne,

      dateFrom: this.rapportSelectionne !== 'INVENTORY'
        ? `${this.dateFrom}T00:00:00.000Z`
        : undefined,

      dateTo: this.rapportSelectionne !== 'INVENTORY'
        ? `${this.dateTo}T23:59:59.999Z`
        : undefined
    }).pipe(
      timeout(30000),
      take(1),

      catchError((error: any) =>
        this.gererErreurExport(error)
      ),

      finalize(() => {
        this.exportEnCours = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (fichier: Blob) => {
        if (!(fichier instanceof Blob) || fichier.size === 0) {
          this.erreur =
            'Le serveur a retourné un fichier vide. Vérifiez le traitement de cet export côté backend.';

          this.message = '';
          this.cdr.detectChanges();
          return;
        }

        if (
          fichier.type.toLowerCase().includes('application/json')
        ) {
          from(fichier.text()).pipe(
            take(1)
          ).subscribe({
            next: (texte: string) => {
              let contenu: any;

              try {
                contenu = JSON.parse(texte);
              } catch {
                contenu = { message: texte };
              }

              this.erreur = this.extraireErreur({
                error: contenu
              });

              this.message = '';
              this.cdr.detectChanges();
            },

            error: () => {
              this.erreur =
                'Le serveur a retourné une réponse JSON au lieu du fichier demandé.';

              this.message = '';
              this.cdr.detectChanges();
            }
          });

          return;
        }

        this.telechargerFichier(fichier);

        this.message =
          `Export du rapport « ${this.titreRapport} » au format ${this.formatSelectionne} téléchargé.`;

        this.cdr.detectChanges();
      }
    });
  }

  // ============================================================
  // EXPORT PDF CÔTÉ FRONT-END
  // ============================================================

  private exporterPdfFrontend(): void {
    if (this.requeteEnCours || this.exportEnCours) {
      return;
    }

    this.exportEnCours = true;
    this.erreur = '';
    this.message = '';

    const periode: PeriodeRapportMak = {
      dateFrom: this.rapportSelectionne !== 'INVENTORY'
        ? `${this.dateFrom}T00:00:00.000Z`
        : undefined,

      dateTo: this.rapportSelectionne !== 'INVENTORY'
        ? `${this.dateTo}T23:59:59.999Z`
        : undefined
    };

    this.cdr.detectChanges();

    this.obtenirRapport(periode).pipe(
      timeout(30000),
      take(1),

      catchError((error: any) => {
        this.erreur = this.extraireErreur(error);
        this.message = '';
        return EMPTY;
      }),

      finalize(() => {
        this.exportEnCours = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (reponse: any) => {
        if (
          reponse === null ||
          reponse === undefined
        ) {
          this.erreur =
            'Aucune réponse reçue du serveur pour générer le PDF.';

          return;
        }

        if (reponse?.success === false) {
          this.erreur =
            reponse?.error?.message ??
            reponse?.message ??
            'Impossible de récupérer les données du rapport.';

          return;
        }

        const donnees = this.extrairePayload(reponse);

        if (
          donnees === null ||
          donnees === undefined
        ) {
          this.erreur =
            'Aucune donnée disponible pour générer le PDF.';

          return;
        }

        this.donneesRapport = donnees;
        this.donneesBrutes = this.serialiserJSON(donnees);

        this.resume = this.construireResume(donnees);
        this.construireTableau(donnees);
        this.informations =
          this.construireInformations(donnees);

        this.pageActuelle = 1;
        this.signatureApercu = this.creerSignatureFiltres();
        this.apercuCharge = true;

        const genere = this.genererPdfTableau();

        if (genere) {
          this.message =
            `Le rapport « ${this.titreRapport} » a été exporté en PDF.`;

          this.erreur = '';
        }
      }
    });
  }

  // ============================================================
  // GÉNÉRATION ET MISE EN PAGE PDF
  // ============================================================

  private genererPdfTableau(): boolean {
    const documentPdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const marge = 12;

    const largeurPage =
      documentPdf.internal.pageSize.getWidth();

    const hauteurPage =
      documentPdf.internal.pageSize.getHeight();

    const titre = `Rapport ${this.titreRapport.toLowerCase()}`;

    const periode = this.rapportEstInventaire
      ? 'État actuel de l’inventaire'
      : `Période : ${this.formaterDateLisible(this.dateFrom)} — ${this.formaterDateLisible(this.dateTo)}`;

    let colonnesPdf: string[];
    let lignesPdf: LigneRapportMak[];

    if (this.colonnes.length > 0 && this.lignes.length > 0) {
      colonnesPdf = [...this.colonnes];
      lignesPdf = [...this.lignes];
    } else if (this.informations.length > 0) {
      colonnesPdf = ['libelle', 'valeur'];

      lignesPdf = this.informations.map(info => ({
        libelle: info.libelle,
        valeur: info.valeur
      }));
    } else {
      this.erreur =
        'Aucune donnée disponible pour générer le PDF.';

      this.message = '';
      return false;
    }

    const entetes = colonnesPdf.map(colonne =>
      this.libelleChamp(colonne)
    );

    const corps = lignesPdf.map(ligne =>
      colonnesPdf.map(colonne =>
        this.formaterCellulePdf(colonne, ligne[colonne])
      )
    );

    const stylesColonnes: Record<number, any> = {};

    entetes.forEach((entete, index) => {
      const cle = this.normaliserCle(
        `${colonnesPdf[index]} ${entete}`
      );

      if (
        cle.includes('ordernumber') ||
        cle.includes('orderreference') ||
        cle.includes('ordercode') ||
        cle.includes('ncommande') ||
        cle.includes('referencecommande')
      ) {
        stylesColonnes[index] = {
          cellWidth: 58,
          halign: 'left'
        };
      } else if (
        cle.includes('customername') ||
        cle.includes('client') ||
        cle.includes('customer')
      ) {
        stylesColonnes[index] = {
          cellWidth: 52,
          halign: 'left'
        };
      } else if (
        cle.includes('status') ||
        cle.includes('statut')
      ) {
        stylesColonnes[index] = {
          cellWidth: 39,
          halign: 'center'
        };
      } else if (
        cle === 'type' ||
        cle.includes('fulfillmenttype') ||
        cle.includes('ordertype')
      ) {
        stylesColonnes[index] = {
          cellWidth: 33,
          halign: 'center'
        };
      } else if (
        this.estChampMonetairePdf(colonnesPdf[index]) ||
        this.estChampMonetairePdf(entetes[index])
      ) {
        stylesColonnes[index] = {
          cellWidth: 40,
          halign: 'right'
        };
      } else if (
        this.estChampDate(colonnesPdf[index]) ||
        this.estChampDate(entetes[index])
      ) {
        stylesColonnes[index] = {
          cellWidth: 31,
          halign: 'center'
        };
      }
    });

    autoTable(documentPdf, {
      head: [entetes],
      body: corps,

      startY: 27,

      margin: {
        top: 27,
        bottom: 17,
        left: marge,
        right: marge
      },

      tableWidth: 'auto',
      showHead: 'everyPage',
      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        valign: 'middle',
        lineWidth: 0.15,
        lineColor: [220, 226, 234],
        textColor: [51, 65, 85]
      },

      headStyles: {
        fillColor: [23, 59, 103],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        valign: 'middle',
        cellPadding: 3
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },

      columnStyles: stylesColonnes,

      didParseCell: (donneesCellule: any) => {
        if (donneesCellule.section === 'body') {
          const entete =
            entetes[donneesCellule.column.index] ?? '';

          const cle = this.normaliserCle(entete);

          if (
            cle.includes('statut') ||
            cle.includes('status')
          ) {
            donneesCellule.cell.styles.halign = 'center';
          }

          if (
            this.estChampMonetairePdf(entete)
          ) {
            donneesCellule.cell.styles.halign = 'right';
          }
        }
      },

      willDrawPage: () => {
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setFontSize(13);
        documentPdf.setTextColor(16, 43, 77);

        documentPdf.text(titre, marge, 10);

        documentPdf.setFont('helvetica', 'normal');
        documentPdf.setFontSize(8);
        documentPdf.setTextColor(100, 116, 139);

        documentPdf.text(
          `${periode} • ${lignesPdf.length} ligne(s) enregistrée(s)`,
          marge,
          17
        );

        documentPdf.setDrawColor(220, 226, 234);

        documentPdf.line(
          marge,
          21,
          largeurPage - marge,
          21
        );
      }
    });

    // Pied de page positionné sur chacune des pages.
    const nombrePages = documentPdf.getNumberOfPages();

    for (let page = 1; page <= nombrePages; page++) {
      documentPdf.setPage(page);

      documentPdf.setFont('helvetica', 'normal');
      documentPdf.setFontSize(8);
      documentPdf.setTextColor(100, 116, 139);

      documentPdf.text(
        `Document confidentiel — Généré le ${this.formaterDateLisible(this.formaterDateInput(new Date()))}`,
        marge,
        hauteurPage - 7
      );

      documentPdf.text(
        `Page ${page} sur ${nombrePages}`,
        largeurPage - marge,
        hauteurPage - 7,
        { align: 'right' }
      );
    }

    const nomFichier =
      `mak-mel-${this.rapportSelectionne.toLowerCase()}-` +
      `${this.formaterDateInput(new Date())}.pdf`;

    documentPdf.save(nomFichier);

    return true;
  }

  // ============================================================
  // FORMATAGE DES CELLULES DU PDF
  // ============================================================

  private formaterCellulePdf(
    cle: string,
    valeur: any
  ): string {
    if (
      valeur === null ||
      valeur === undefined ||
      valeur === ''
    ) {
      return '—';
    }

    if (this.estChampDate(cle)) {
      return this.formaterDateLisible(String(valeur));
    }

    if (typeof valeur === 'boolean') {
      return valeur ? 'Oui' : 'Non';
    }

    const cleMonetaire = this.estChampMonetairePdf(cle);

    // Les montants peuvent arriver sous forme de nombre
    // ou de texte déjà formaté par l'API.
    if (
      typeof valeur === 'number' ||
      cleMonetaire ||
      (
        typeof valeur === 'string' &&
        /FCFA/i.test(valeur)
      )
    ) {
      const montant = this.formaterMontantPdf(valeur);

      if (
        cleMonetaire ||
        (
          typeof valeur === 'string' &&
          /FCFA/i.test(valeur)
        )
      ) {
        return `${montant} FCFA`;
      }

      return montant;
    }

    if (typeof valeur === 'object') {
      try {
        return JSON.stringify(valeur);
      } catch {
        return String(valeur);
      }
    }

    // Ne pas tronquer les références ou numéros de commande.
    // Remplacer les espaces insécables dans les autres textes.
    return String(valeur)
      .replace(/[\u00A0\u202F]/g, ' ');
  }

  /**
   * Détermine si une colonne contient un montant monétaire.
   * Évite de confondre un nombre de commandes avec un montant.
   */
  private estChampMonetairePdf(cle: string): boolean {
    const normalisee = this.normaliserCle(cle);

    const champsMonetaires = [
      'amount',
      'montant',
      'revenue',
      'price',
      'chiffreaffaires',
      'stockvalue',
      'inventoryvalue',
      'valeurstock',
      'grandtotal',
      'totalamount',
      'totalprice',
      'totalspent',
      'amountspent',
      'salesamount',
      'netamount',
      'grossamount',
      'averageordervalue'
    ];

    if (
      normalisee === 'total' ||
      normalisee === 'ca' ||
      normalisee.endsWith('total')
    ) {
      return true;
    }

    return champsMonetaires.some(champ =>
      normalisee.includes(champ)
    );
  }

  /**
   * Convertit un montant reçu sous forme de nombre ou de texte
   * en montant numérique exploitable.
   */
  private formaterMontantPdf(valeur: number | string): string {
    if (typeof valeur === 'number') {
      if (!Number.isFinite(valeur)) {
        return String(valeur);
      }

      return this.formaterNombrePdf(valeur);
    }

    const texteOriginal = String(valeur ?? '').trim();

    if (!texteOriginal) {
      return '—';
    }

    // Normalisation des espaces et retrait de la devise.
    // Cela traite aussi les textes comportant des slashs
    // comme "1 /313 /000 FCFA".
    let texte = texteOriginal
      .replace(/[\u00A0\u202F]/g, ' ')
      .replace(/FCFA/gi, '')
      .replace(/\s+/g, '')
      .trim();

    if (!texte) {
      return '—';
    }

    const negatif = texte.startsWith('-');

    texte = texte.replace(/-/g, '');

    // Conserver un éventuel séparateur décimal final
    // s'il est suivi d'un ou de deux chiffres.
    const correspondanceDecimale =
      texte.match(/[.,](\d{1,2})$/);

    let nombre: number;

    if (correspondanceDecimale) {
      const separateur = correspondanceDecimale[0][0];
      const partieDecimale = correspondanceDecimale[1];

      const positionSeparateur = texte.lastIndexOf(separateur);

      const partieEntiereTexte =
        texte.slice(0, positionSeparateur);

      const partieEntiere =
        partieEntiereTexte.replace(/\D/g, '');

      const partieDecimaleNettoyee =
        partieDecimale.replace(/\D/g, '');

      if (!partieEntiere) {
        return texteOriginal.replace(/[\u00A0\u202F]/g, ' ');
      }

      nombre = Number(
        `${negatif ? '-' : ''}${partieEntiere}.${partieDecimaleNettoyee}`
      );
    } else {
      const chiffres = texte.replace(/\D/g, '');

      if (!chiffres) {
        return texteOriginal.replace(/[\u00A0\u202F]/g, ' ');
      }

      nombre = Number(`${negatif ? '-' : ''}${chiffres}`);
    }

    if (!Number.isFinite(nombre)) {
      return texteOriginal.replace(/[\u00A0\u202F]/g, ' ');
    }

    return this.formaterNombrePdf(nombre);
  }

  /**
   * Formate les nombres avec des espaces ordinaires entre
   * les milliers afin d'éviter les caractères mal affichés
   * par les polices standard de jsPDF.
   */
  private formaterNombrePdf(valeur: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2
    })
      .format(valeur)
      .replace(/[\u00A0\u202F]/g, ' ');
  }

  private estChampDate(cle: string): boolean {
    const normalisee = this.normaliserCle(cle);

    return (
      normalisee === 'date' ||
      normalisee.includes('date') ||
      normalisee === 'createdat' ||
      normalisee === 'updatedat' ||
      normalisee === 'paidat' ||
      normalisee === 'deliveredat' ||
      normalisee === 'completedat' ||
      normalisee === 'cancelledat' ||
      normalisee === 'timestamp'
    );
  }

  private formaterDateLisible(valeur: string): string {
    if (!valeur) {
      return '—';
    }

    // Préserve la date écrite par l'API au format ISO.
    const correspondance = valeur.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (correspondance) {
      return (
        `${correspondance[3]}/` +
        `${correspondance[2]}/` +
        `${correspondance[1]}`
      );
    }

    const date = new Date(valeur);

    if (Number.isNaN(date.getTime())) {
      return valeur;
    }

    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'UTC'
    }).format(date);
  }

  // ============================================================
  // TÉLÉCHARGEMENT CSV / XLSX
  // ============================================================

  private telechargerFichier(fichier: Blob): void {
    const extensions: Record<FormatRapportMak, string> = {
      CSV: 'csv',
      XLSX: 'xlsx',
      PDF: 'pdf'
    };

    const nom =
      `mak-mel-${this.rapportSelectionne.toLowerCase()}-` +
      `${this.formaterDateInput(new Date())}.` +
      extensions[this.formatSelectionne];

    const url = window.URL.createObjectURL(fichier);
    const lien = document.createElement('a');

    lien.href = url;
    lien.download = nom;
    lien.style.display = 'none';

    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get rapportEstInventaire(): boolean {
    return this.rapportSelectionne === 'INVENTORY';
  }

  get titreRapport(): string {
    return this.typesRapports.find(
      item => item.valeur === this.rapportSelectionne
    )?.libelle ?? 'Rapport';
  }

  get apercuContientDonnees(): boolean {
    return (
      this.lignes.length > 0 ||
      this.resume.length > 0 ||
      this.informations.length > 0
    );
  }

  get exportAutorise(): boolean {
    return !this.chargement && !this.exportEnCours;
  }

  // ============================================================
  // SIGNATURE DES FILTRES
  // ============================================================

  private creerSignatureFiltres(): string {
    return JSON.stringify({
      rapport: this.rapportSelectionne,
      dateFrom: this.rapportEstInventaire ? '' : this.dateFrom,
      dateTo: this.rapportEstInventaire ? '' : this.dateTo
    });
  }

  // ============================================================
  // DATE POUR LES INPUTS
  // ============================================================

  private formaterDateInput(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');

    return `${annee}-${mois}-${jour}`;
  }
}