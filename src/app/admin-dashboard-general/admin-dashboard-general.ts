
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';

import {
  catchError,
  finalize,
  takeUntil,
  timeout
} from 'rxjs/operators';

import Chart from 'chart.js/auto';
import { DashboardGeneral } from '../services/dashboard-general';

interface Indicateur {
  label: string;
  valeur: string;
  description: string;
  icone: string;
  classe: string;
}

interface PointGraphique {
  label: string;
  value: number;
}

interface TableauCandidat {
  cle: string;
  lignes: unknown[];
}

interface Repartition {
  labels: string[];
  valeurs: number[];
  titre: string;
  sousTitre: string;
}

type CleDashboard =
  | 'overview'
  | 'sales'
  | 'orders'
  | 'inventory'
  | 'customers';

@Component({
  selector: 'app-admin-dashboard-general',
  standalone: false,
  templateUrl: './admin-dashboard-general.html',
  styleUrl: './admin-dashboard-general.css'
})
export class AdminDashboardGeneral
  implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('commandesChart')
  commandesCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('repartitionChart')
  repartitionCanvas!: ElementRef<HTMLCanvasElement>;

  chargement = false;
  actualisationEnCours = false;
  vueInitialisee = false;

  erreursApi: string[] = [];
  derniereActualisation: Date | null = null;

  private donnees: Partial<Record<CleDashboard, unknown>> = {};

  private readonly destruction$ = new Subject<void>();

  private requetesEnCours = 0;

  private graphiqueCommandes:
    Chart<'line', number[], string> | null = null;

  private graphiqueRepartition:
    Chart<'doughnut', number[], string> | null = null;

  donneesCommandesDisponibles = false;
  donneesRepartitionDisponibles = false;

  titreGraphique = 'Évolution des commandes';
  sousTitreGraphique = 'Suivi de l’activité sur la période disponible';
  libelleAxeGraphique = 'Nombre de commandes';
  libelleSerieGraphique = 'Commandes';

  titreRepartition = 'Répartition des commandes';
  sousTitreRepartition = 'Répartition par statut lorsque disponible';

  private serieCommandes: PointGraphique[] = [];

  private repartition: Repartition = {
    labels: [],
    valeurs: [],
    titre: 'Répartition des commandes',
    sousTitre: 'Aucune répartition disponible'
  };

  statistiques: Indicateur[] = [
    {
      label: 'Commandes',
      valeur: '—',
      description: 'Total disponible dans l’API',
      icone: 'CMD',
      classe: 'orders-icon'
    },
    {
      label: 'Clients',
      valeur: '—',
      description: 'Clients enregistrés',
      icone: 'CL',
      classe: 'clients-icon'
    },
    {
      label: 'Produits',
      valeur: '—',
      description: 'Produits référencés',
      icone: 'PR',
      classe: 'products-icon'
    },
    {
      label: 'Chiffre d’affaires',
      valeur: '—',
      description: 'Données financières disponibles',
      icone: 'CA',
      classe: 'revenue-icon'
    }
  ];

  constructor(
    private dashboardService: DashboardGeneral,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerStatistiques();
  }

  ngAfterViewInit(): void {
    this.vueInitialisee = true;
    this.initialiserGraphiques();
    this.mettreAJourGraphiques();
  }

  /**
   * Charge les statistiques en parallèle.
   * La page reste visible pendant les requêtes.
   */
  chargerStatistiques(): void {
    if (this.actualisationEnCours) {
      return;
    }

    this.actualisationEnCours = true;
    this.erreursApi = [];

    const requetes: {
      module: string;
      cle: CleDashboard;
      requete: Observable<unknown>;
    }[] = [
      {
        module: 'Vue d’ensemble',
        cle: 'overview',
        requete: this.dashboardService.getOverview()
      },
      {
        module: 'Statistiques des ventes',
        cle: 'sales',
        requete: this.dashboardService.getSales()
      },
      {
        module: 'Statistiques des commandes',
        cle: 'orders',
        requete: this.dashboardService.getOrders()
      },
      {
        module: 'Statistiques de stock',
        cle: 'inventory',
        requete: this.dashboardService.getInventory()
      },
      {
        module: 'Statistiques des clients',
        cle: 'customers',
        requete: this.dashboardService.getCustomers()
      }
    ];

    this.requetesEnCours = requetes.length;

    for (const element of requetes) {
      this.chargerEndpoint(
        element.module,
        element.cle,
        element.requete
      );
    }
  }

  /**
   * Traite chaque requête indépendamment.
   */
  private chargerEndpoint(
    module: string,
    cle: CleDashboard,
    requete: Observable<unknown>
  ): void {
    requete.pipe(
      timeout(12000),

      catchError((erreur) => {
        this.signalerErreur(module, erreur);
        return of(null);
      }),

      takeUntil(this.destruction$),

      finalize(() => {
        this.requetesEnCours--;

        if (this.requetesEnCours <= 0) {
          this.requetesEnCours = 0;
          this.actualisationEnCours = false;
        }
      })
    ).subscribe({
      next: (reponse) => {
        if (reponse === null || reponse === undefined) {
          return;
        }

        this.donnees[cle] = this.extraireData(reponse);

        this.preparerIndicateurs();
        this.preparerDonneesGraphiques();

        this.derniereActualisation = new Date();

        if (this.vueInitialisee) {
          this.mettreAJourGraphiques();
        }
      }
    });
  }

  /**
   * Accepte les réponses enveloppées par l'API :
   * { success: true, data: ... }
   */
  private extraireData(reponse: unknown): unknown {
    if (
      reponse !== null &&
      typeof reponse === 'object' &&
      !Array.isArray(reponse)
    ) {
      const objet = reponse as Record<string, unknown>;

      if (
        objet['success'] === true &&
        'data' in objet
      ) {
        return objet['data'];
      }
    }

    return reponse;
  }

  private signalerErreur(
    module: string,
    erreur: unknown
  ): void {
    console.error(`Erreur API — ${module} :`, erreur);

    if (!this.erreursApi.includes(module)) {
      this.erreursApi.push(module);
    }
  }

  /**
   * Indicateurs principaux.
   */
  private preparerIndicateurs(): void {
    const commandes = this.trouverNombre(
      [this.donnees['overview'], this.donnees['orders']],
      [
        'totalOrders',
        'ordersCount',
        'orderCount',
        'totalOrderCount',
        'totalCommandes',
        'commandesTotal'
      ]
    );

    const clients = this.trouverNombre(
      [this.donnees['overview'], this.donnees['customers']],
      [
        'totalCustomers',
        'customersCount',
        'customerCount',
        'totalClients',
        'clientsCount',
        'clientCount'
      ]
    );

    const produits = this.trouverNombre(
      [this.donnees['overview'], this.donnees['inventory']],
      [
        'totalProducts',
        'productsCount',
        'productCount',
        'totalProduits',
        'produitsTotal'
      ]
    );

    const chiffreAffaires = this.trouverNombre(
      [this.donnees['overview'], this.donnees['sales']],
      [
        'totalRevenue',
        'totalSales',
        'revenue',
        'salesAmount',
        'chiffreAffaires',
        'totalRevenueAmount'
      ]
    );

    this.statistiques = [
      {
        label: 'Commandes',
        valeur: this.formaterNombre(commandes),
        description: 'Total disponible dans l’API',
        icone: 'CMD',
        classe: 'orders-icon'
      },
      {
        label: 'Clients',
        valeur: this.formaterNombre(clients),
        description: 'Clients enregistrés',
        icone: 'CL',
        classe: 'clients-icon'
      },
      {
        label: 'Produits',
        valeur: this.formaterNombre(produits),
        description: 'Produits référencés',
        icone: 'PR',
        classe: 'products-icon'
      },
      {
        label: 'Chiffre d’affaires',
        valeur: this.formaterMontant(chiffreAffaires),
        description: 'Total remonté par l’API',
        icone: 'CA',
        classe: 'revenue-icon'
      }
    ];
  }

  private trouverNombre(
    sources: unknown[],
    cles: string[]
  ): number | null {
    for (const cle of cles) {
      for (const source of sources) {
        const resultat = this.rechercherNombre(
          source,
          this.normaliserCle(cle)
        );

        if (resultat !== null) {
          return resultat;
        }
      }
    }

    return null;
  }

  private rechercherNombre(
    valeur: unknown,
    cleRecherchee: string,
    profondeur = 0
  ): number | null {
    if (
      valeur === null ||
      valeur === undefined ||
      typeof valeur !== 'object' ||
      Array.isArray(valeur) ||
      profondeur > 4
    ) {
      return null;
    }

    const objet = valeur as Record<string, unknown>;

    for (const [cle, contenu] of Object.entries(objet)) {
      if (this.normaliserCle(cle) === cleRecherchee) {
        const nombre = this.convertirNombre(contenu);

        if (nombre !== null) {
          return nombre;
        }
      }
    }

    for (const contenu of Object.values(objet)) {
      if (
        contenu !== null &&
        typeof contenu === 'object' &&
        !Array.isArray(contenu)
      ) {
        const resultat = this.rechercherNombre(
          contenu,
          cleRecherchee,
          profondeur + 1
        );

        if (resultat !== null) {
          return resultat;
        }
      }
    }

    return null;
  }

  private convertirNombre(valeur: unknown): number | null {
    if (
      typeof valeur === 'number' &&
      Number.isFinite(valeur)
    ) {
      return valeur;
    }

    if (
      typeof valeur === 'string' &&
      valeur.trim() !== ''
    ) {
      const nombre = Number(
        valeur.trim().replace(/\s/g, '')
      );

      return Number.isFinite(nombre) ? nombre : null;
    }

    return null;
  }

  private formaterNombre(valeur: number | null): string {
    if (valeur === null) {
      return '—';
    }

    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(valeur);
  }

  private formaterMontant(valeur: number | null): string {
    if (valeur === null) {
      return '—';
    }

    return `${this.formaterNombre(valeur)} FCFA`;
  }

  /**
   * Prépare les séries de données des graphiques.
   */
  private preparerDonneesGraphiques(): void {
    const serieCommandes = this.extraireSerieTemporelle(
      this.donnees['orders'],
      [
        'ordersCount',
        'orderCount',
        'totalOrders',
        'orders',
        'count',
        'quantity'
      ]
    );

    const serieVentes = this.extraireSerieTemporelle(
      this.donnees['sales'],
      [
        'revenue',
        'totalRevenue',
        'salesAmount',
        'amount',
        'value',
        'total'
      ]
    );

    if (serieCommandes.length > 0) {
      this.serieCommandes = serieCommandes;
      this.titreGraphique = 'Évolution des commandes';
      this.sousTitreGraphique = 'Commandes par période disponible';
      this.libelleAxeGraphique = 'Nombre de commandes';
      this.libelleSerieGraphique = 'Commandes';
    } else if (serieVentes.length > 0) {
      this.serieCommandes = serieVentes;
      this.titreGraphique = 'Évolution des ventes';
      this.sousTitreGraphique = 'Ventes par période disponible';
      this.libelleAxeGraphique = 'Montant des ventes';
      this.libelleSerieGraphique = 'Ventes';
    }

    this.donneesCommandesDisponibles =
      this.serieCommandes.length > 0;

    this.repartition = this.extraireRepartition([
      this.donnees['overview'],
      this.donnees['orders'],
      this.donnees['sales']
    ]);

    this.donneesRepartitionDisponibles =
      this.repartition.labels.length > 0;

    this.titreRepartition = this.repartition.titre;
    this.sousTitreRepartition = this.repartition.sousTitre;
  }

  /**
   * Cherche les tableaux de séries temporelles dans la réponse.
   */
  private extraireSerieTemporelle(
    source: unknown,
    clesValeurs: string[]
  ): PointGraphique[] {
    const candidats = this.collecterTableaux(source)
      .filter(candidat =>
        this.cleContient(candidat.cle, [
          'monthlyOrders',
          'ordersByMonth',
          'monthly',
          'evolution',
          'trend',
          'series',
          'byDate',
          'byDay',
          'byMonth',
          'byPeriod',
          'daily',
          'history',
          'items',
          'results',
          'data'
        ])
      )
      .sort(
        (a, b) =>
          this.scoreTableau(b.cle) -
          this.scoreTableau(a.cle)
      );

    for (const candidat of candidats) {
      const points: PointGraphique[] = [];

      for (const ligne of candidat.lignes) {
        const objet = this.enregistrerObjet(ligne);

        if (!objet) {
          continue;
        }

        const libelle = this.lireLibelle(objet);

        if (
          !libelle ||
          !this.estLibelleTemporel(
            libelle.label,
            libelle.cle
          )
        ) {
          continue;
        }

        const nombre = this.trouverNombreDirect(
          objet,
          clesValeurs
        );

        if (nombre !== null) {
          points.push({
            label: libelle.label,
            value: nombre
          });
        }
      }

      if (points.length > 0) {
        return points;
      }
    }

    return [];
  }

  private collecterTableaux(
    source: unknown,
    cleParente = '',
    profondeur = 0,
    resultat: TableauCandidat[] = []
  ): TableauCandidat[] {
    if (
      source === null ||
      source === undefined ||
      profondeur > 4
    ) {
      return resultat;
    }

    if (Array.isArray(source)) {
      if (source.length <= 500) {
        resultat.push({
          cle: cleParente,
          lignes: source
        });
      }

      return resultat;
    }

    if (typeof source !== 'object') {
      return resultat;
    }

    for (const [cle, valeur] of Object.entries(
      source as Record<string, unknown>
    )) {
      if (
        valeur !== null &&
        typeof valeur === 'object'
      ) {
        this.collecterTableaux(
          valeur,
          cle,
          profondeur + 1,
          resultat
        );
      }
    }

    return resultat;
  }

  private lireLibelle(
    objet: Record<string, unknown>
  ): { label: string; cle: string } | null {
    const cles = [
      'month',
      'date',
      'day',
      'period',
      'label',
      'name',
      'formattedDate',
      'x'
    ];

    for (const cleRecherchee of cles) {
      for (const [cle, valeur] of Object.entries(objet)) {
        if (
          this.normaliserCle(cle) ===
            this.normaliserCle(cleRecherchee) &&
          (
            typeof valeur === 'string' ||
            typeof valeur === 'number'
          )
        ) {
          return {
            label: String(valeur),
            cle
          };
        }
      }
    }

    return null;
  }

  private estLibelleTemporel(
    label: string,
    cle: string
  ): boolean {
    const nomCle = this.normaliserCle(cle);
    const texte = this.normaliserCle(label);

    if (
      nomCle.includes('date') ||
      nomCle.includes('month') ||
      nomCle.includes('day') ||
      nomCle.includes('period')
    ) {
      return true;
    }

    if (
      /^\d{4}[-/]\d{1,2}/.test(label) ||
      /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(label) ||
      /^\d{4}$/.test(label)
    ) {
      return true;
    }

    return [
      'janvier', 'janv', 'january', 'jan',
      'fevrier', 'fevr', 'february', 'feb',
      'mars', 'march', 'mar',
      'avril', 'avr', 'april', 'apr',
      'mai', 'may',
      'juin', 'june', 'jun',
      'juillet', 'juil', 'july', 'jul',
      'aout', 'august', 'aug',
      'septembre', 'sept', 'september',
      'octobre', 'oct', 'october',
      'novembre', 'nov', 'november',
      'decembre', 'dec', 'december'
    ].some(mois => texte.includes(mois));
  }

  private trouverNombreDirect(
    objet: Record<string, unknown>,
    cles: string[]
  ): number | null {
    for (const cleRecherchee of cles) {
      for (const [cle, valeur] of Object.entries(objet)) {
        if (
          this.normaliserCle(cle) ===
          this.normaliserCle(cleRecherchee)
        ) {
          const nombre = this.convertirNombre(valeur);

          if (nombre !== null) {
            return nombre;
          }
        }
      }
    }

    return null;
  }

  /**
   * Cherche une répartition réelle par activité ou par statut.
   */
  private extraireRepartition(
    sources: unknown[]
  ): Repartition {
    const clesPrioritaires = [
      'activityDistribution',
      'byActivity',
      'activityBreakdown',
      'ordersByActivity',
      'statusDistribution',
      'ordersByStatus',
      'byStatus',
      'statusBreakdown',
      'distribution',
      'breakdown',
      'statuses',
      'activities'
    ];

    for (const source of sources) {
      const candidats = this.collecterTableaux(source)
        .filter(candidat =>
          this.cleContient(
            candidat.cle,
            clesPrioritaires
          )
        )
        .sort(
          (a, b) =>
            this.scoreRepartition(b.cle) -
            this.scoreRepartition(a.cle)
        );

      for (const candidat of candidats) {
        const labels: string[] = [];
        const valeurs: number[] = [];

        for (const ligne of candidat.lignes) {
          const objet = this.enregistrerObjet(ligne);

          if (!objet) {
            continue;
          }

          const libelle = this.lireLibelleRepartition(objet);

          if (!libelle) {
            continue;
          }

          const nombre = this.trouverNombreDirect(
            objet,
            [
              'count',
              'totalOrders',
              'orderCount',
              'orders',
              'quantity',
              'total',
              'value',
              'revenue',
              'amount'
            ]
          );

          if (nombre === null || nombre < 0) {
            continue;
          }

          labels.push(libelle.label);
          valeurs.push(nombre);
        }

        if (labels.length > 0) {
          const contientActivites = labels.some(label => {
            const nom = this.normaliserCle(label);

            return (
              nom.includes('makmel') ||
              nom.includes('commecheznous')
            );
          });

          return {
            labels,
            valeurs,
            titre: contientActivites
              ? 'Répartition des activités'
              : 'Répartition des commandes',
            sousTitre: contientActivites
              ? 'Répartition par plateforme'
              : 'Répartition par statut disponible'
          };
        }
      }
    }

    return {
      labels: [],
      valeurs: [],
      titre: 'Répartition des commandes',
      sousTitre: 'Aucune répartition compatible disponible'
    };
  }

  private lireLibelleRepartition(
    objet: Record<string, unknown>
  ): { label: string; cle: string } | null {
    const cles = [
      'status',
      'state',
      'activity',
      'platform',
      'name',
      'label',
      'type',
      'key'
    ];

    for (const cleRecherchee of cles) {
      for (const [cle, valeur] of Object.entries(objet)) {
        if (
          this.normaliserCle(cle) ===
            this.normaliserCle(cleRecherchee) &&
          (
            typeof valeur === 'string' ||
            typeof valeur === 'number'
          )
        ) {
          return {
            label: String(valeur),
            cle
          };
        }
      }
    }

    return null;
  }

  private scoreTableau(cle: string): number {
    const nom = this.normaliserCle(cle);

    if (
      nom.includes('monthlyorders') ||
      nom.includes('ordersbymonth') ||
      nom.includes('bydate') ||
      nom.includes('bymonth')
    ) {
      return 100;
    }

    if (
      nom.includes('evolution') ||
      nom.includes('trend') ||
      nom.includes('series') ||
      nom.includes('byperiod')
    ) {
      return 80;
    }

    if (
      nom.includes('byday') ||
      nom.includes('daily') ||
      nom.includes('monthly') ||
      nom.includes('history')
    ) {
      return 60;
    }

    return 10;
  }

  private scoreRepartition(cle: string): number {
    const nom = this.normaliserCle(cle);

    if (
      nom.includes('activitydistribution') ||
      nom.includes('ordersbyactivity') ||
      nom.includes('activitybreakdown') ||
      nom.includes('byactivity')
    ) {
      return 100;
    }

    if (
      nom.includes('statusdistribution') ||
      nom.includes('ordersbystatus') ||
      nom.includes('statusbreakdown') ||
      nom.includes('bystatus')
    ) {
      return 90;
    }

    if (
      nom.includes('distribution') ||
      nom.includes('breakdown')
    ) {
      return 70;
    }

    return 50;
  }

  private cleContient(
    cle: string,
    valeurs: string[]
  ): boolean {
    const nom = this.normaliserCle(cle);

    return valeurs.some(valeur =>
      nom.includes(this.normaliserCle(valeur))
    );
  }

  private enregistrerObjet(
    valeur: unknown
  ): Record<string, unknown> | null {
    if (
      valeur === null ||
      typeof valeur !== 'object' ||
      Array.isArray(valeur)
    ) {
      return null;
    }

    return valeur as Record<string, unknown>;
  }

  private normaliserCle(valeur: string): string {
    return valeur
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  /**
   * Initialise Chart.js une seule fois.
   */
  private initialiserGraphiques(): void {
    if (
      !this.commandesCanvas?.nativeElement ||
      !this.repartitionCanvas?.nativeElement
    ) {
      return;
    }

    const contexteCommandes =
      this.commandesCanvas.nativeElement.getContext('2d');

    const contexteRepartition =
      this.repartitionCanvas.nativeElement.getContext('2d');

    if (!contexteCommandes || !contexteRepartition) {
      return;
    }

    this.graphiqueCommandes = new Chart<
      'line',
      number[],
      string
    >(contexteCommandes, {
      type: 'line',

      data: {
        labels: [],
        datasets: [
          {
            label: 'Commandes',
            data: [],
            borderColor: '#2855a6',
            backgroundColor: 'rgba(40, 85, 166, 0.10)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#2855a6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          intersect: false,
          mode: 'index'
        },

        plugins: {
          legend: {
            display: false,
            position: 'top'
          }
        },

        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.15)'
            },
            title: {
              display: true,
              text: this.libelleAxeGraphique
            }
          },

          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    this.graphiqueRepartition = new Chart<
      'doughnut',
      number[],
      string
    >(contexteRepartition, {
      type: 'doughnut',

      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [
              '#2855a6',
              '#18a58b',
              '#e9a23b',
              '#8b5cf6',
              '#dc5265',
              '#64748b'
            ],
            hoverOffset: 7,
            borderWidth: 3,
            borderColor: '#ffffff'
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',

        plugins: {
          legend: {
            display: false,
            position: 'bottom'
          },
          tooltip: {
            enabled: false
          }
        }
      }
    });
  }

  /**
   * Met à jour les données sans recréer les graphiques.
   */
  private mettreAJourGraphiques(): void {
    if (
      !this.graphiqueCommandes ||
      !this.graphiqueRepartition
    ) {
      return;
    }

    this.graphiqueCommandes.data.labels =
      this.serieCommandes.map(point => point.label);

    const serie = this.graphiqueCommandes.data.datasets[0];

    if (serie) {
      serie.label = this.libelleSerieGraphique;
      serie.data = this.serieCommandes.map(point => point.value);
    }

    const echelleY =
      this.graphiqueCommandes.options.scales?.['y'];

    if (echelleY && typeof echelleY === 'object') {
      echelleY.title = {
        display: true,
        text: this.libelleAxeGraphique
      };
    }

    const legendeCourbe =
      this.graphiqueCommandes.options.plugins?.legend;

    if (legendeCourbe) {
      legendeCourbe.display = this.donneesCommandesDisponibles;
    }

    this.graphiqueCommandes.update('none');

    this.graphiqueRepartition.data.labels =
      this.repartition.labels;

    const serieRepartition =
      this.graphiqueRepartition.data.datasets[0];

    if (serieRepartition) {
      serieRepartition.data = this.repartition.valeurs;
    }

    const legendeAnneau =
      this.graphiqueRepartition.options.plugins?.legend;

    if (legendeAnneau) {
      legendeAnneau.display = this.donneesRepartitionDisponibles;
    }

    const tooltipAnneau =
      this.graphiqueRepartition.options.plugins?.tooltip;

    if (tooltipAnneau) {
      tooltipAnneau.enabled = this.donneesRepartitionDisponibles;
    }

    this.graphiqueRepartition.update('none');
  }

  ouvrirDashboardMak(): void {
    this.router.navigate(['/admin-dashboard-mak']);
  }

  get affichageDerniereActualisation(): string {
    if (!this.derniereActualisation) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(this.derniereActualisation);
  }

  ngOnDestroy(): void {
    this.destruction$.next();
    this.destruction$.complete();

    this.graphiqueCommandes?.destroy();
    this.graphiqueRepartition?.destroy();
  }
}
