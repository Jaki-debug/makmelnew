import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import Chart from 'chart.js/auto';

import {
  DashboardMakService,
  DashboardPeriodeMak
} from '../services/dashboard-mak';

interface DashboardCarteMak {
  titre: string;
  valeur: string;
  description: string;
}

interface PointVenteMak {
  cle: string;
  libelle: string;
  montant: number;
}

interface StatutCommandeMak {
  libelle: string;
  nombre: number;
  pourcentage: number;
}

interface StatistiqueInventaireMak {
  titre: string;
  valeur: string;
}

interface ClientTopMak {
  nom: string;
  commandes: string;
  montant: string;
}

interface TableauDetecteMak {
  cle: string;
  lignes: any[];
}

@Component({
  selector: 'app-admin-dashboard-mak',
  standalone: false,
  templateUrl: './admin-dashboard-mak.html',
  styleUrl: './admin-dashboard-mak.css'
})
export class AdminDashboardMak implements OnInit, OnDestroy {

  @ViewChild('graphiqueVentes')
  graphiqueVentesElement?: ElementRef<HTMLCanvasElement>;

  @ViewChild('graphiqueCommandes')
  graphiqueCommandesElement?: ElementRef<HTMLCanvasElement>;

  @ViewChild('graphiqueInventaire')
  graphiqueInventaireElement?: ElementRef<HTMLCanvasElement>;

  chargement = false;
  erreurs: Record<string, string> = {};

  overview: any = null;
  ventes: any = null;
  commandes: any = null;
  inventaire: any = null;
  clients: any = null;

  dateFrom = '';
  dateTo = '';
  dateMiseAJour: Date | null = null;

  private requetesEnCours = 0;
  private renduGraphiquesPlanifie = false;
  private composantDetruit = false;

  private temporisateurGraphiques:
    ReturnType<typeof setTimeout> | null = null;

  private graphiqueVentes: Chart | null = null;
  private graphiqueCommandes: Chart | null = null;
  private graphiqueInventaire: Chart | null = null;

  constructor(
    private dashboardService: DashboardMakService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const aujourdHui = new Date();
    const debut = new Date(aujourdHui);

    debut.setDate(debut.getDate() - 29);

    this.dateFrom = this.formaterDateInput(debut);
    this.dateTo = this.formaterDateInput(aujourdHui);

    this.chargerDashboard();
  }

  ngOnDestroy(): void {
    this.composantDetruit = true;

    if (this.temporisateurGraphiques !== null) {
      clearTimeout(this.temporisateurGraphiques);
      this.temporisateurGraphiques = null;
    }

    this.detruireGraphiques();
  }

  // ============================================================
  // CHARGEMENT AUTOMATIQUE DU TABLEAU DE BORD
  // ============================================================

  chargerDashboard(): void {
    if (this.chargement) {
      return;
    }

    if (!this.dateFrom || !this.dateTo) {
      this.erreurs = {
        periode: 'Veuillez renseigner les deux dates.'
      };
      return;
    }

    if (this.dateFrom > this.dateTo) {
      this.erreurs = {
        periode: 'La date de début doit précéder la date de fin.'
      };
      return;
    }

    const periode: DashboardPeriodeMak = {
      dateFrom: `${this.dateFrom}T00:00:00.000Z`,
      dateTo: `${this.dateTo}T23:59:59.999Z`
    };

    this.chargement = true;
    this.erreurs = {};
    this.requetesEnCours = 5;

    this.cdr.detectChanges();

    this.chargerSection(
      'overview',
      this.dashboardService.getOverview(),
      data => this.overview = data,
      'Impossible de charger la vue d’ensemble.'
    );

    this.chargerSection(
      'ventes',
      this.dashboardService.getSales(periode),
      data => this.ventes = data,
      'Impossible de charger les statistiques des ventes.'
    );

    this.chargerSection(
      'commandes',
      this.dashboardService.getOrders(periode),
      data => this.commandes = data,
      'Impossible de charger les statistiques des commandes.'
    );

    this.chargerSection(
      'inventaire',
      this.dashboardService.getInventory(),
      data => this.inventaire = data,
      'Impossible de charger les statistiques du stock.'
    );

    this.chargerSection(
      'clients',
      this.dashboardService.getCustomers(periode),
      data => this.clients = data,
      'Impossible de charger les statistiques des clients.'
    );
  }

  private chargerSection(
    cle: string,
    requete: Observable<any>,
    appliquer: (data: any) => void,
    messageParDefaut: string
  ): void {
    requete.pipe(
      timeout(20000),

      catchError((erreur: any) => {
        this.erreurs[cle] = this.extraireErreur(
          erreur,
          messageParDefaut
        );

        console.error(`Erreur dashboard ${cle}:`, erreur);

        return of(null);
      }),

      finalize(() => {
        this.requetesEnCours--;

        if (this.requetesEnCours <= 0) {
          this.requetesEnCours = 0;
          this.chargement = false;
          this.dateMiseAJour = new Date();
        }

        this.cdr.detectChanges();
        this.actualiserGraphiques();
      })
    ).subscribe((reponse: any) => {
      if (reponse === null || reponse === undefined) {
        return;
      }

      if (reponse?.success === false) {
        this.erreurs[cle] =
          reponse?.error?.message ?? messageParDefaut;

        this.cdr.detectChanges();
        return;
      }

      const donnees = this.extrairePayload(reponse);

      appliquer(donnees);
      delete this.erreurs[cle];

      console.log(`Données dashboard ${cle}:`, reponse);

      this.cdr.detectChanges();
      this.actualiserGraphiques();
    });
  }

  private extrairePayload(reponse: any): any {
    let donnees = reponse;
    let niveau = 0;

    while (
      donnees &&
      typeof donnees === 'object' &&
      !Array.isArray(donnees) &&
      niveau < 5
    ) {
      if (donnees.data !== undefined) {
        donnees = donnees.data;
      } else if (donnees.result !== undefined) {
        donnees = donnees.result;
      } else if (donnees.payload !== undefined) {
        donnees = donnees.payload;
      } else {
        break;
      }

      niveau++;
    }

    return donnees;
  }

  private extraireErreur(
    erreur: any,
    messageParDefaut: string
  ): string {
    if (erreur?.name === 'TimeoutError') {
      return 'Le délai de réponse est dépassé. Réessayez.';
    }

    if (erreur?.status === 401) {
      return '401 : authentification refusée. Vérifiez que le token est envoyé par l’intercepteur HTTP.';
    }

    if (erreur?.status === 403) {
      return '403 : accès refusé. Le compte ne possède pas les autorisations nécessaires.';
    }

    const message =
      erreur?.error?.error?.message ??
      erreur?.error?.message ??
      erreur?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return typeof message === 'string' && message.trim()
      ? message
      : messageParDefaut;
  }

  // ============================================================
  // CARTES KPI
  // ============================================================

  get cartes(): DashboardCarteMak[] {
    return [
      {
        titre: 'Ventes du jour',
        valeur: this.valeurCarte(
          this.overview,
          [
            'salesToday',
            'todaySales',
            'todayRevenue',
            'revenueToday',
            'totalSalesToday',
            'todaySalesAmount',
            'ventesDuJour',
            'chiffreAffairesDuJour'
          ],
          true
        ),
        description: 'Chiffre d’affaires du jour'
      },
      {
        titre: 'Commandes du jour',
        valeur: this.valeurCarte(
          this.overview,
          [
            'ordersToday',
            'todayOrders',
            'totalOrdersToday',
            'todayOrdersCount',
            'commandesDuJour'
          ],
          false
        ),
        description: 'Commandes enregistrées aujourd’hui'
      },
      {
        titre: 'Chiffre d’affaires',
        valeur: this.valeurCarte(
          this.ventes,
          [
            'totalRevenue',
            'totalSales',
            'revenue',
            'salesTotal',
            'totalAmount',
            'amount',
            'chiffreAffaires',
            'ca',
            'total'
          ],
          true
        ),
        description: 'Sur la période sélectionnée'
      },
      {
        titre: 'Commandes enregistrées',
        valeur: this.valeurCarte(
          this.commandes,
          [
            'totalOrders',
            'ordersCount',
            'totalCount',
            'nombreCommandes',
            'commandesTotal',
            'count',
            'total'
          ],
          false
        ),
        description: 'Sur la période sélectionnée'
      },
      {
        titre: 'Clients',
        valeur: this.valeurCarte(
          this.clients,
          [
            'totalCustomers',
            'customersCount',
            'customerCount',
            'clientsTotal',
            'nombreClients',
            'totalCount',
            'count'
          ],
          false
        ),
        description: 'Données disponibles dans l’API'
      },
      {
        titre: 'Valeur du stock',
        valeur: this.valeurCarte(
          this.inventaire,
          [
            'totalStockValue',
            'inventoryValue',
            'stockValue',
            'totalInventoryValue',
            'inventoryAmount',
            'valeurStock',
            'valeurInventaire'
          ],
          true
        ),
        description: 'Valorisation de l’inventaire'
      }
    ];
  }

  private valeurCarte(
    donnees: any,
    cles: string[],
    monnaie: boolean
  ): string {
    const valeur = this.lireValeur(donnees, cles);

    if (valeur === null || valeur === undefined) {
      return '—';
    }

    return monnaie
      ? this.formaterFCFA(valeur)
      : this.formaterNombre(valeur);
  }

  // ============================================================
  // DONNÉES DU GRAPHIQUE DES VENTES
  // ============================================================

  get pointsVentes(): PointVenteMak[] {
    if (!this.ventes) {
      return [];
    }

    const clesDate = [
      'date',
      'saleDate',
      'createdAt',
      'transactionDate',
      'dateCreated',
      'dateLabel',
      'day',
      'dayDate',
      'period',
      'timestamp',
      'jour',
      'dateVente',
      'dateTransaction',
      'dateCreation',
      'dateJour',
      'label'
    ];

    const clesMontant = [
      'revenue',
      'amount',
      'sales',
      'totalSales',
      'totalRevenue',
      'salesAmount',
      'totalAmount',
      'grossSales',
      'netSales',
      'chiffreAffaires',
      'ca',
      'value',
      'montant',
      'montantTotal',
      'total'
    ];

    const serie = this.trouverStructureParCle(
      this.ventes,
      [
        'revenueByDay',
        'dailyRevenue',
        'salesByDay',
        'salesByDate',
        'dailySales',
        'revenueByDate',
        'historiqueVentes',
        'ventesParJour'
      ]
    );

    let lignes: any[] = Array.isArray(serie)
      ? serie
      : [];

    if (lignes.length === 0) {
      const tableaux = this.collecterTableaux(this.ventes);
      let meilleurScore = -1;

      for (const tableau of tableaux) {
        const valides = tableau.lignes.filter((ligne: any) =>
          ligne &&
          typeof ligne === 'object' &&
          this.lireValeurDirecte(ligne, clesDate) !== null &&
          this.convertirEnNombre(
            this.lireValeurDirecte(ligne, clesMontant)
          ) !== null
        );

        let score = valides.length;
        const cle = this.normaliserCle(tableau.cle);

        if (
          [
            'revenuebyday',
            'salesbyday',
            'salesbydate',
            'daily',
            'historique',
            'ventesparjour'
          ].some(fragment => cle.includes(fragment))
        ) {
          score += 100;
        }

        if (valides.length > 0 && score > meilleurScore) {
          meilleurScore = score;
          lignes = valides;
        }
      }
    }

    const groupes = new Map<string, PointVenteMak>();

    for (const ligne of lignes) {
      const dateBrute = this.lireValeurDirecte(
        ligne,
        clesDate
      );

      const montant = this.convertirEnNombre(
        this.lireValeurDirecte(ligne, clesMontant)
      );

      if (dateBrute === null || montant === null) {
        continue;
      }

      const texteDate = String(dateBrute);
      const cle = this.normaliserCleDate(texteDate);
      const existant = groupes.get(cle);

      if (existant) {
        existant.montant += montant;
      } else {
        groupes.set(cle, {
          cle,
          libelle: this.formaterLibelleDate(texteDate),
          montant
        });
      }
    }

    return Array.from(groupes.values())
      .sort((a, b) => a.cle.localeCompare(b.cle))
      .slice(-30);
  }

  // ============================================================
  // DONNÉES DU GRAPHIQUE DES COMMANDES
  // ============================================================

  get statutsCommandes(): StatutCommandeMak[] {
    const clesStatut = [
      'status',
      'statusName',
      'statut',
      'etat',
      'label',
      'name',
      'key'
    ];

    const clesNombre = [
      'count',
      'totalOrders',
      'ordersCount',
      'orderCount',
      'nombreCommandes',
      'total',
      'value',
      'nombre',
      'quantity'
    ];

    const serie = this.trouverStructureParCle(
      this.commandes,
      [
        'ordersByStatus',
        'statusCounts',
        'statusBreakdown',
        'byStatus',
        'repartitionParStatut',
        'commandesParStatut'
      ]
    );

    let resultat: {
      libelle: string;
      nombre: number;
    }[] = [];

    if (Array.isArray(serie)) {
      resultat = serie
        .map((ligne: any) => {
          const statut = this.lireValeurDirecte(
            ligne,
            clesStatut
          );

          const nombre = this.convertirEnNombre(
            this.lireValeurDirecte(ligne, clesNombre)
          );

          return statut === null || nombre === null
            ? null
            : {
                libelle: this.formaterStatut(String(statut)),
                nombre
              };
        })
        .filter(
          (
            item
          ): item is { libelle: string; nombre: number } =>
            item !== null
        );
    } else if (
      serie &&
      typeof serie === 'object' &&
      !Array.isArray(serie)
    ) {
      resultat = Object.entries(serie)
        .map(([cle, valeur]) => {
          const nombre = this.convertirEnNombre(valeur);

          return nombre === null
            ? null
            : {
                libelle: this.formaterStatut(cle),
                nombre
              };
        })
        .filter(
          (
            item
          ): item is { libelle: string; nombre: number } =>
            item !== null
        );
    }

    if (resultat.length === 0) {
      const tableaux = this.collecterTableaux(this.commandes);
      let meilleur: any[] = [];

      for (const tableau of tableaux) {
        const avecStatut = tableau.lignes.filter(
          (ligne: any) =>
            ligne &&
            typeof ligne === 'object' &&
            this.lireValeurDirecte(ligne, clesStatut) !== null
        );

        if (avecStatut.length > meilleur.length) {
          meilleur = avecStatut;
        }
      }

      if (meilleur.length > 0) {
        const comptes = new Map<string, number>();

        for (const ligne of meilleur) {
          const statut = String(
            this.lireValeurDirecte(ligne, clesStatut)
          );

          comptes.set(
            statut,
            (comptes.get(statut) ?? 0) + 1
          );
        }

        resultat = Array.from(comptes.entries()).map(
          ([statut, nombre]) => ({
            libelle: this.formaterStatut(statut),
            nombre
          })
        );
      }
    }

    const total = resultat.reduce(
      (somme, item) => somme + item.nombre,
      0
    );

    return resultat
      .filter(item => item.nombre >= 0)
      .map(item => ({
        ...item,
        pourcentage: total > 0
          ? Math.round(item.nombre / total * 100)
          : 0
      }));
  }

  get totalCommandesStatuts(): number {
    return this.statutsCommandes.reduce(
      (total, item) => total + item.nombre,
      0
    );
  }

  // ============================================================
  // DONNÉES DU GRAPHIQUE D'INVENTAIRE
  // ============================================================

  get statistiquesInventaire(): StatistiqueInventaireMak[] {
    const configurations = [
      {
        titre: 'Produits suivis',
        cles: [
          'totalProducts',
          'productsCount',
          'productCount',
          'nombreProduits',
          'trackedProducts'
        ]
      },
      {
        titre: 'Stock faible',
        cles: [
          'lowStockCount',
          'lowStockProducts',
          'lowStock',
          'stockFaible',
          'produitsEnAlerte',
          'itemsLowStock'
        ]
      },
      {
        titre: 'En rupture',
        cles: [
          'outOfStockCount',
          'outOfStock',
          'ruptureStock',
          'ruptures',
          'stockOutCount',
          'produitsRupture',
          'itemsOutOfStock'
        ]
      },
      {
        titre: 'Quantité en stock',
        cles: [
          'totalQuantity',
          'totalUnits',
          'stockQuantity',
          'quantityInStock',
          'quantiteStock',
          'totalStockQuantity',
          'unitesEnStock'
        ]
      }
    ];

    return configurations
      .map(configuration => {
        const valeur = this.lireValeur(
          this.inventaire,
          configuration.cles
        );

        return valeur === null || valeur === undefined
          ? null
          : {
              titre: configuration.titre,
              valeur: this.formaterNombre(valeur)
            };
      })
      .filter(
        (item): item is StatistiqueInventaireMak =>
          item !== null
      );
  }

  get donneesGraphiqueInventaire(): number[] | null {
    const total = this.convertirEnNombre(
      this.lireValeur(this.inventaire, [
        'totalProducts',
        'productsCount',
        'productCount',
        'nombreProduits',
        'trackedProducts'
      ])
    );

    const faible = this.convertirEnNombre(
      this.lireValeur(this.inventaire, [
        'lowStockCount',
        'lowStockProducts',
        'lowStock',
        'stockFaible',
        'produitsEnAlerte',
        'itemsLowStock'
      ])
    );

    const rupture = this.convertirEnNombre(
      this.lireValeur(this.inventaire, [
        'outOfStockCount',
        'outOfStock',
        'ruptureStock',
        'ruptures',
        'stockOutCount',
        'produitsRupture',
        'itemsOutOfStock'
      ])
    );

    if (
      total === null ||
      faible === null ||
      rupture === null
    ) {
      return null;
    }

    return [
      Math.max(0, total - faible - rupture),
      faible,
      rupture
    ];
  }

  // ============================================================
  // TOP 5 DES CLIENTS
  // ============================================================

  get topClients(): ClientTopMak[] {
    const clesNom = [
      'customerName',
      'clientName',
      'fullName',
      'name',
      'nom',
      'customer',
      'client'
    ];

    const clesMontant = [
      'totalSpent',
      'amountSpent',
      'totalPurchases',
      'totalAmount',
      'totalRevenue',
      'revenue',
      'chiffreAffaires',
      'montantTotal',
      'depenses'
    ];

    const clesCommandes = [
      'ordersCount',
      'totalOrders',
      'orderCount',
      'nombreCommandes',
      'commandes',
      'count'
    ];

    const serie = this.trouverStructureParCle(
      this.clients,
      [
        'topCustomers',
        'topClients',
        'bestCustomers',
        'bestClients',
        'meilleursClients',
        'clientsTop'
      ]
    );

    let candidats: any[] = Array.isArray(serie)
      ? serie
      : [];

    if (candidats.length === 0) {
      let meilleurScore = -1;

      for (const tableau of this.collecterTableaux(this.clients)) {
        const valides = tableau.lignes.filter((item: any) => {
          const nom = this.lireValeur(item, clesNom);

          return nom !== null && (
            this.lireValeur(item, clesMontant) !== null ||
            this.lireValeur(item, clesCommandes) !== null
          );
        });

        let score = valides.length;
        const cle = this.normaliserCle(tableau.cle);

        if (
          cle.includes('top') ||
          cle.includes('best') ||
          cle.includes('meilleur')
        ) {
          score += 100;
        }

        if (valides.length > 0 && score > meilleurScore) {
          meilleurScore = score;
          candidats = valides;
        }
      }
    }

    return candidats.slice(0, 5).map((client: any) => {
      const prenom = this.lireValeurDirecte(
        client,
        ['firstName', 'prenom']
      );

      const nomFamille = this.lireValeurDirecte(
        client,
        ['lastName', 'surname', 'nomFamille']
      );

      const nomBrut = this.lireValeur(client, clesNom);
      const montant = this.lireValeur(client, clesMontant);
      const nombre = this.lireValeur(client, clesCommandes);

      return {
        nom: (
          nomBrut !== null
            ? String(nomBrut)
            : `${prenom ?? ''} ${nomFamille ?? ''}`.trim()
        ) || 'Client',

        commandes: nombre === null
          ? '—'
          : this.formaterNombre(nombre),

        montant: montant === null
          ? '—'
          : this.formaterFCFA(montant)
      };
    });
  }

  // ============================================================
  // ACTUALISATION AUTOMATIQUE DES GRAPHIQUES
  // ============================================================

  private actualiserGraphiques(): void {
    if (
      this.composantDetruit ||
      this.renduGraphiquesPlanifie
    ) {
      return;
    }

    this.renduGraphiquesPlanifie = true;
    this.cdr.detectChanges();

    this.temporisateurGraphiques = setTimeout(() => {
      this.temporisateurGraphiques = null;
      this.renduGraphiquesPlanifie = false;

      if (this.composantDetruit) {
        return;
      }

      this.cdr.detectChanges();

      this.creerGraphiqueVentes();
      this.creerGraphiqueCommandes();
      this.creerGraphiqueInventaire();
    }, 0);
  }

  private creerGraphiqueVentes(): void {
    const canvas =
      this.graphiqueVentesElement?.nativeElement ??
      document.getElementById(
        'graphiqueVentesMak'
      ) as HTMLCanvasElement | null;

    const points = this.pointsVentes;

    if (!canvas || points.length === 0) {
      this.graphiqueVentes?.destroy();
      this.graphiqueVentes = null;
      return;
    }

    this.graphiqueVentes?.destroy();

    this.graphiqueVentes = new Chart(canvas, {
      type: 'line',

      data: {
        labels: points.map(point => point.libelle),

        datasets: [{
          label: 'Chiffre d’affaires (FCFA)',
          data: points.map(point => point.montant),

          borderColor: '#3559D8',
          backgroundColor: 'rgba(53, 89, 216, 0.12)',

          borderWidth: 3,
          pointRadius: points.length > 24 ? 1.5 : 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#3559D8',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,

          fill: true,
          tension: 0.35
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400
        },

        interaction: {
          intersect: false,
          mode: 'index'
        },

        plugins: {
          legend: {
            display: true,
            position: 'top',

            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 18
            }
          },

          tooltip: {
            callbacks: {
              label: context =>
                `${context.dataset.label}: ${
                  this.formaterFCFA(context.raw)
                }`
            }
          }
        },

        scales: {
          y: {
            beginAtZero: true,

            ticks: {
              callback: valeur =>
                new Intl.NumberFormat('fr-FR', {
                  notation: 'compact'
                }).format(Number(valeur))
            },

            grid: {
              color: '#EDF0F6'
            }
          },

          x: {
            grid: {
              display: false
            },

            ticks: {
              maxTicksLimit: 10,
              maxRotation: 0
            }
          }
        }
      }
    });
  }

  private creerGraphiqueCommandes(): void {
    const canvas =
      this.graphiqueCommandesElement?.nativeElement ??
      document.getElementById(
        'graphiqueCommandesMak'
      ) as HTMLCanvasElement | null;

    const donnees = this.statutsCommandes.filter(
      item => item.nombre > 0
    );

    if (!canvas || donnees.length === 0) {
      this.graphiqueCommandes?.destroy();
      this.graphiqueCommandes = null;
      return;
    }

    this.graphiqueCommandes?.destroy();

    this.graphiqueCommandes = new Chart(canvas, {
      type: 'doughnut',

      data: {
        labels: donnees.map(item => item.libelle),

        datasets: [{
          label: 'Commandes',

          data: donnees.map(item => item.nombre),

          backgroundColor: [
            '#3559D8',
            '#12A477',
            '#F0A43C',
            '#E05260',
            '#8B5CF6',
            '#64748B',
            '#0EA5E9',
            '#D946A8'
          ],

          borderColor: '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '63%',

        animation: {
          duration: 400
        },

        plugins: {
          legend: {
            display: true,
            position: 'bottom',

            labels: {
              usePointStyle: true,
              padding: 16,
              boxWidth: 8
            }
          },

          tooltip: {
            callbacks: {
              label: context => {
                const total = donnees.reduce(
                  (sum, item) => sum + item.nombre,
                  0
                );

                const valeur = Number(context.raw ?? 0);

                const pourcentage = total > 0
                  ? Math.round(valeur / total * 100)
                  : 0;

                return `${context.label}: ${valeur} (${pourcentage} %)`;
              }
            }
          }
        }
      }
    });
  }

  private creerGraphiqueInventaire(): void {
    const canvas =
      this.graphiqueInventaireElement?.nativeElement ??
      document.getElementById(
        'graphiqueInventaireMak'
      ) as HTMLCanvasElement | null;

    const donnees = this.donneesGraphiqueInventaire;

    if (!canvas || donnees === null) {
      this.graphiqueInventaire?.destroy();
      this.graphiqueInventaire = null;
      return;
    }

    this.graphiqueInventaire?.destroy();

    this.graphiqueInventaire = new Chart(canvas, {
      type: 'doughnut',

      data: {
        labels: [
          'Stock disponible',
          'Stock faible',
          'En rupture'
        ],

        datasets: [{
          label: 'Produits',

          data: donnees,

          backgroundColor: [
            '#12A477',
            '#F0A43C',
            '#E05260'
          ],

          borderColor: '#FFFFFF',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '63%',

        animation: {
          duration: 400
        },

        plugins: {
          legend: {
            display: true,
            position: 'bottom',

            labels: {
              usePointStyle: true,
              padding: 16,
              boxWidth: 8
            }
          },

          tooltip: {
            callbacks: {
              label: context =>
                `${context.label}: ${
                  Number(context.raw ?? 0)
                } produit(s)`
            }
          }
        }
      }
    });
  }

  private detruireGraphiques(): void {
    this.graphiqueVentes?.destroy();
    this.graphiqueCommandes?.destroy();
    this.graphiqueInventaire?.destroy();

    this.graphiqueVentes = null;
    this.graphiqueCommandes = null;
    this.graphiqueInventaire = null;
  }

  // ============================================================
  // OUTILS DE LECTURE DES RÉPONSES API
  // ============================================================

  private lireValeur(
    donnees: any,
    cles: string[]
  ): any {
    if (!donnees || typeof donnees !== 'object') {
      return null;
    }

    for (const cle of cles) {
      const valeur = this.trouverValeurRecursif(
        donnees,
        this.normaliserCle(cle)
      );

      if (
        valeur !== undefined &&
        valeur !== null &&
        valeur !== ''
      ) {
        return valeur;
      }
    }

    return null;
  }

  private lireValeurDirecte(
    objet: any,
    cles: string[]
  ): any {
    if (!objet || typeof objet !== 'object') {
      return null;
    }

    for (const recherche of cles) {
      const rechercheNormalisee =
        this.normaliserCle(recherche);

      for (const [cle, valeur] of Object.entries(objet)) {
        if (
          this.normaliserCle(cle) === rechercheNormalisee &&
          valeur !== undefined &&
          valeur !== null &&
          valeur !== '' &&
          typeof valeur !== 'object'
        ) {
          return valeur;
        }
      }
    }

    return null;
  }

  private trouverValeurRecursif(
    objet: any,
    cleRecherchee: string,
    profondeur = 0
  ): any {
    if (
      objet === null ||
      typeof objet !== 'object' ||
      profondeur > 8
    ) {
      return undefined;
    }

    if (Array.isArray(objet)) {
      for (const element of objet) {
        const resultat = this.trouverValeurRecursif(
          element,
          cleRecherchee,
          profondeur + 1
        );

        if (resultat !== undefined) {
          return resultat;
        }
      }

      return undefined;
    }

    for (const [cle, valeur] of Object.entries(objet)) {
      if (
        this.normaliserCle(cle) === cleRecherchee &&
        (typeof valeur !== 'object' || valeur === null)
      ) {
        return valeur;
      }
    }

    for (const valeur of Object.values(objet)) {
      if (valeur && typeof valeur === 'object') {
        const resultat = this.trouverValeurRecursif(
          valeur,
          cleRecherchee,
          profondeur + 1
        );

        if (resultat !== undefined) {
          return resultat;
        }
      }
    }

    return undefined;
  }

  private trouverStructureParCle(
    objet: any,
    cles: string[],
    profondeur = 0
  ): any {
    if (
      !objet ||
      typeof objet !== 'object' ||
      profondeur > 8
    ) {
      return null;
    }

    const normalisees = cles.map(
      cle => this.normaliserCle(cle)
    );

    if (!Array.isArray(objet)) {
      for (const [cle, valeur] of Object.entries(objet)) {
        if (
          normalisees.includes(this.normaliserCle(cle)) &&
          valeur &&
          typeof valeur === 'object'
        ) {
          return valeur;
        }
      }
    }

    for (const valeur of Object.values(objet)) {
      if (valeur && typeof valeur === 'object') {
        const resultat = this.trouverStructureParCle(
          valeur,
          cles,
          profondeur + 1
        );

        if (resultat !== null) {
          return resultat;
        }
      }
    }

    return null;
  }

  private collecterTableaux(
    objet: any,
    cleParent = '',
    profondeur = 0,
    resultat: TableauDetecteMak[] = []
  ): TableauDetecteMak[] {
    if (
      objet === null ||
      typeof objet !== 'object' ||
      profondeur > 8
    ) {
      return resultat;
    }

    if (Array.isArray(objet)) {
      resultat.push({
        cle: cleParent,
        lignes: objet
      });

      objet.forEach((element: any) => {
        if (element && typeof element === 'object') {
          this.collecterTableaux(
            element,
            cleParent,
            profondeur + 1,
            resultat
          );
        }
      });

      return resultat;
    }

    for (const [cle, valeur] of Object.entries(objet)) {
      if (valeur && typeof valeur === 'object') {
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

  private normaliserCle(cle: string): string {
    return String(cle)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private normaliserCleDate(dateBrute: string): string {
    const iso = dateBrute
      .trim()
      .match(/^(\d{4}-\d{2}-\d{2})/);

    if (iso) {
      return iso[1];
    }

    const locale = dateBrute
      .trim()
      .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (locale) {
      return `${locale[3]}-${locale[2]}-${locale[1]}`;
    }

    const date = new Date(dateBrute);

    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;
    }

    return dateBrute;
  }

  // ============================================================
  // FORMATAGE
  // ============================================================

  private convertirEnNombre(valeur: any): number | null {
    if (typeof valeur === 'number') {
      return Number.isFinite(valeur) ? valeur : null;
    }

    if (typeof valeur !== 'string' || !valeur.trim()) {
      return null;
    }

    let texte = valeur
      .trim()
      .replace(/\s/g, '')
      .replace(/[^\d,.-]/g, '');

    if (!texte || !/\d/.test(texte)) {
      return null;
    }

    if (texte.includes(',') && texte.includes('.')) {
      texte = texte.lastIndexOf(',') > texte.lastIndexOf('.')
        ? texte.replace(/\./g, '').replace(',', '.')
        : texte.replace(/,/g, '');
    } else if (texte.includes(',')) {
      const morceaux = texte.split(',');

      texte = morceaux.length > 2
        ? morceaux.join('')
        : morceaux[1]?.length === 3
          ? morceaux.join('')
          : texte.replace(',', '.');
    } else if (texte.split('.').length > 2) {
      texte = texte.replace(/\./g, '');
    }

    const nombre = Number(texte);

    return Number.isFinite(nombre) ? nombre : null;
  }

  formaterFCFA(valeur: any): string {
    const nombre = this.convertirEnNombre(valeur);

    if (nombre === null) {
      return this.formaterNombre(valeur);
    }

    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2
    }).format(nombre)} FCFA`;
  }

  formaterNombre(valeur: any): string {
    if (
      valeur === null ||
      valeur === undefined ||
      valeur === ''
    ) {
      return '—';
    }

    const nombre = this.convertirEnNombre(valeur);

    return nombre === null
      ? String(valeur)
      : new Intl.NumberFormat('fr-FR', {
          maximumFractionDigits: 2
        }).format(nombre);
  }

  private formaterStatut(statut: string): string {
    const normalise = this.normaliserCle(statut);

    const libelles: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmées',
      processing: 'En préparation',
      readyforpickup: 'Prêtes au retrait',
      outfordelivery: 'En livraison',
      delivered: 'Livrées',
      completed: 'Terminées',
      cancelled: 'Annulées',
      canceled: 'Annulées',
      refunded: 'Remboursées',
      failed: 'Échouées',
      enattente: 'En attente',
      confirme: 'Confirmées',
      annule: 'Annulées',
      livre: 'Livrées'
    };

    return libelles[normalise] ??
      statut
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^./, lettre => lettre.toUpperCase());
  }

  private formaterLibelleDate(libelle: string): string {
    const iso = libelle.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (iso) {
      return `${iso[3]}/${iso[2]}`;
    }

    const locale = libelle.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

    if (locale) {
      return `${locale[1]}/${locale[2]}`;
    }

    const date = new Date(libelle);

    return Number.isNaN(date.getTime())
      ? libelle
      : date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit'
        });
  }

  private formaterDateInput(date: Date): string {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  }

  get nombreErreurs(): number {
    return Object.keys(this.erreurs).length;
  }

  nomSection(cle: string): string {
    const noms: Record<string, string> = {
      overview: 'Vue d’ensemble',
      ventes: 'Ventes',
      commandes: 'Commandes',
      inventaire: 'Inventaire',
      clients: 'Clients',
      periode: 'Période'
    };

    return noms[cle] ?? cle;
  }
}