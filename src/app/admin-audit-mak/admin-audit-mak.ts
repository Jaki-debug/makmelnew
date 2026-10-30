
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';

import {
  Subscription,
  of
} from 'rxjs';

import {
  catchError,
  finalize,
  take,
  timeout
} from 'rxjs/operators';

import {
  AuditAction,
  AuditLogFilters,
  AuditMakService
} from '../services/audit-mak';

import { UserService } from '../services/user';
import { Auth } from '../services/auth';
import { ClientAuthService } from '../services/client-auth';

// ============================================================
// MODÈLE D'UNE ENTRÉE D'AUDIT
// ============================================================

interface AuditLog {
  id?: string;
  _id?: string;
  action?: string;
  module?: string;

  userId?: string;
  customerId?: string;
  actorId?: string;
  authorId?: string;
  adminId?: string;

  entityType?: string;
  entityId?: string;
  entityName?: string;
  entity?: any;

  createdAt?: string;
  timestamp?: string;

  user?: any;
  customer?: any;
  actor?: any;
  author?: any;
  admin?: any;

  roles?: any[];
  roleId?: string;

  details?: any;
  before?: any;
  after?: any;
  beforeData?: any;
  afterData?: any;
  oldValues?: any;
  newValues?: any;

  [key: string]: any;
}

@Component({
  selector: 'app-admin-audit-mak',
  standalone: false,
  templateUrl: './admin-audit-mak.html',
  styleUrls: ['./admin-audit-mak.css']
})
export class AdminAuditMak implements OnInit, OnDestroy, AfterViewChecked {

  // ============================================================
  // DONNÉES
  // ============================================================

  journaux: AuditLog[] = [];

  /** Liste complète des clients utilisée pour l'autocomplétion et l'affichage des noms. */
  clientsDisponibles: any[] = [];

  journalSelectionne: AuditLog | null = null;

  chargement = false;

  // Utilisé par le template pour le chargement bloquant.
  // Les détails distants sont maintenant chargés en arrière-plan.
  chargementDetail = false;
  chargementDetailEnArrierePlan = false;

  erreur = '';
  erreurDetail = '';

  detailOuvert = false;

  /** Référence de la modale native, pour l'afficher dans la top layer du navigateur. */
  @ViewChild('auditDetailDialog', { static: true })
  private auditDetailDialog?: ElementRef<HTMLDialogElement>;

  page = 1;
  limite = 10;

  total = 0;
  totalConnu = false;
  pageSuivanteDisponible = false;

  // ============================================================
  // UTILISATEURS ET RÔLES
  // ============================================================

  private utilisateurConnecte: any = null;

  private utilisateursParId = new Map<string, any>();
  private libellesRoles = new Map<string, string>();

  private identifiantsEnCours = new Set<string>();
  private identifiantsDejaRecherches = new Set<string>();

  // Les lignes de la liste d'audit ne contiennent pas toujours l'objet client.
  // On charge donc les détails des journaux client manquants et on enrichit la ligne.
  private identifiantsAuditsClientEnCours = new Set<string>();
  private identifiantsAuditsClientTraites = new Set<string>();

  // ============================================================
  // ABONNEMENTS
  // ============================================================

  private listeSubscription: Subscription | null = null;
  private detailSubscription: Subscription | null = null;
  private utilisateursSubscription: Subscription | null = null;
  private rolesSubscription: Subscription | null = null;
  private clientsSubscription: Subscription | null = null;

  private readonly abonnementsAuteurs = new Subscription();

  private detruit = false;

  // ============================================================
  // FILTRES
  // ============================================================

  // FILTRES
// ============================================================

action = '';
module = '';
userId = '';
customerId = '';
customerIdSelectionne = '';
private libelleClientSelectionne = '';
entityType = '';
  entityId = '';
  dateFrom = '';
  dateTo = '';

  // Suggestions instantanées affichées pendant la saisie.
  suggestionsUtilisateursOuvertes = false;
  suggestionsClientsOuvertes = false;
  private readonly nombreSuggestionsMax = 8;

  readonly actions: {
    valeur: AuditAction;
    libelle: string;
  }[] = [
    { valeur: 'CREATE', libelle: 'Création' },
    { valeur: 'UPDATE', libelle: 'Modification' },
    { valeur: 'DELETE', libelle: 'Suppression' },
    { valeur: 'LOGIN', libelle: 'Connexion' },
    { valeur: 'LOGOUT', libelle: 'Déconnexion' },
    {
      valeur: 'PASSWORD_CHANGE',
      libelle: 'Changement de mot de passe'
    },
    { valeur: 'PAYMENT', libelle: 'Paiement' },
    { valeur: 'REFUND', libelle: 'Remboursement' },
    {
      valeur: 'ORDER_STATUS_CHANGE',
      libelle: 'Changement de statut de commande'
    },
    {
      valeur: 'STOCK_ADJUSTMENT',
      libelle: 'Ajustement de stock'
    },
    { valeur: 'EXPORT', libelle: 'Exportation' },
    { valeur: 'OTHER', libelle: 'Autre' }
  ];

  readonly modules: { valeur: string; libelle: string }[] = [
    { valeur: 'auth', libelle: 'Authentification' },
    { valeur: 'customer-auth', libelle: 'Authentification client' },
    { valeur: 'users', libelle: 'Utilisateurs' },
    { valeur: 'customers', libelle: 'Clients' },
    { valeur: 'products', libelle: 'Produits' },
    { valeur: 'orders', libelle: 'Commandes' },
    { valeur: 'inventory', libelle: 'Inventaire' },
    { valeur: 'stock', libelle: 'Stock' },
    { valeur: 'categories', libelle: 'Catégories' },
    { valeur: 'payments', libelle: 'Paiements' },
    { valeur: 'refunds', libelle: 'Remboursements' },
    { valeur: 'roles', libelle: 'Rôles et permissions' },
    { valeur: 'permissions', libelle: 'Permissions' },
    { valeur: 'reports', libelle: 'Rapports' },
    { valeur: 'exports', libelle: 'Exports' },
    { valeur: 'delivery', libelle: 'Livraison' },
    { valeur: 'reservations', libelle: 'Réservations' },
    { valeur: 'restaurants', libelle: 'Restaurants' },
    { valeur: 'residences', libelle: 'Résidences' }
  ];

  get modulesDisponibles(): { valeur: string; libelle: string }[] {
    const parValeur = new Map<string, { valeur: string; libelle: string }>();

    for (const module of this.modules) {
      parValeur.set(module.valeur.toLowerCase(), module);
    }

    for (const journal of this.journaux) {
      const valeur = this.texteValide(journal.module);
      if (valeur && !parValeur.has(valeur.toLowerCase())) {
        parValeur.set(valeur.toLowerCase(), {
          valeur,
          libelle: this.libelleModule(valeur)
        });
      }
    }

    return Array.from(parValeur.values()).sort((a, b) =>
      a.libelle.localeCompare(b.libelle, 'fr')
    );
  }

  get optionsClients(): { valeur: string; libelle: string }[] {
    const options = new Map<string, { valeur: string; libelle: string }>();

    // Priorité à la vraie liste des clients récupérée depuis l'API.
    for (const client of this.clientsDisponibles) {
      const id = this.texteValide(
        client?.id ?? client?._id ?? client?.uuid ?? client?.customerId
      );
      const prenom = this.texteValide(client?.firstName ?? client?.firstname ?? client?.first_name);
      const nom = this.texteValide(client?.lastName ?? client?.lastname ?? client?.last_name);
      const nomComplet = [prenom, nom]
        .filter((partie): partie is string => !!partie)
        .join(' ')
        .trim();
      const libelle = nomComplet ||
        this.texteValide(client?.fullName ?? client?.fullname ?? client?.displayName ?? client?.name) ||
        this.texteValide(client?.email);

      if (id && libelle && !this.estIdentifiantTechnique(libelle)) {
        options.set(id.toLowerCase(), { valeur: id, libelle });
      }
    }

    // Compléter avec les noms déjà inclus dans les journaux, si besoin.
    for (const journal of this.journaux) {
      const client = journal.customer ?? journal['client'];
      const id = this.texteValide(
        journal.customerId ?? client?.id ?? client?._id ?? client?.uuid
      );
      const libelle = this.nomObjetLisible(client) ??
        this.texteValide(
          journal['customerName'] ?? journal['clientName'] ??
          journal['customerFullName']
        ) ??
        this.texteValide(client?.email);

      if (id && libelle && !this.estIdentifiantTechnique(libelle) && !options.has(id.toLowerCase())) {
        options.set(id.toLowerCase(), { valeur: id, libelle });
      }
    }

    return Array.from(options.values()).sort((a, b) =>
      a.libelle.localeCompare(b.libelle, 'fr')
    );
  }

  /** Suggestions d'utilisateurs filtrées au fur et à mesure de la saisie. */
  get utilisateursSuggeres(): any[] {
    const recherche = this.userId.trim().toLocaleLowerCase('fr');
    if (!recherche) return [];

    return this.optionsUtilisateurs
      .filter((utilisateur: any) => {
        const nom = this.nomOptionUtilisateur(utilisateur).toLocaleLowerCase('fr');
        const email = this.texteValide(utilisateur?.email)?.toLocaleLowerCase('fr') ?? '';
        const username = this.texteValide(utilisateur?.username)?.toLocaleLowerCase('fr') ?? '';
        return nom.includes(recherche) || email.includes(recherche) || username.includes(recherche);
      })
      .slice(0, this.nombreSuggestionsMax);
  }

  /** Suggestions de clients filtrées au fur et à mesure de la saisie. */
  get clientsSuggeres(): { valeur: string; libelle: string }[] {
    const recherche = this.customerId.trim().toLocaleLowerCase('fr');
    if (!recherche) return [];

    return this.optionsClients
      .filter(client => client.libelle.toLocaleLowerCase('fr').includes(recherche))
      .slice(0, this.nombreSuggestionsMax);
  }

  choisirUtilisateur(utilisateur: any): void {
    this.userId = this.nomOptionUtilisateur(utilisateur);
    this.suggestionsUtilisateursOuvertes = false;
  }
choisirClient(client: { valeur: string; libelle: string }): void {
  this.customerId = client.libelle;
  this.customerIdSelectionne = client.valeur;
  this.libelleClientSelectionne = client.libelle;
  this.suggestionsClientsOuvertes = false;
}

gererSaisieClient(valeur: string): void {
  this.customerId = valeur;

  if (
    valeur.trim().toLocaleLowerCase('fr') !==
    this.libelleClientSelectionne.trim().toLocaleLowerCase('fr')
  ) {
    this.customerIdSelectionne = '';
    this.libelleClientSelectionne = '';
  }

  this.suggestionsClientsOuvertes = true;
}

  fermerSuggestionsUtilisateur(): void {
    // Le délai laisse le clic sur une suggestion être traité avant la fermeture.
    setTimeout(() => {
      this.suggestionsUtilisateursOuvertes = false;
      if (!this.detruit) this.cdr.detectChanges();
    }, 120);
  }

  fermerSuggestionsClient(): void {
    setTimeout(() => {
      this.suggestionsClientsOuvertes = false;
      if (!this.detruit) this.cdr.detectChanges();
    }, 120);
  }

  get optionsEntites(): { valeur: string; libelle: string }[] {
    const options = new Map<string, { valeur: string; libelle: string }>();

    for (const journal of this.journaux) {
      const id = this.texteValide(journal.entityId ?? journal.entity?.id ?? journal.entity?._id);
      const libelle = this.valeurEntite(journal);

      if (id && libelle && libelle !== 'Élément concerné non renseigné') {
        options.set(id.toLowerCase(), { valeur: libelle, libelle });
      }
    }

    return Array.from(options.values()).sort((a, b) =>
      a.libelle.localeCompare(b.libelle, 'fr')
    );
  }

  readonly limites: number[] = [10, 20, 50, 100];

  constructor(
    private auditService: AuditMakService,
    private userService: UserService,
    private auth: Auth,
    private clientAuthService: ClientAuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // ============================================================
  // INITIALISATION
  // ============================================================

  ngOnInit(): void {
    try {
      this.utilisateurConnecte =
        this.auth.getUtilisateur();

      this.ajouterUtilisateur(this.utilisateurConnecte);
    } catch {
      this.utilisateurConnecte = null;
    }

    this.chargerJournaux();
    this.chargerUtilisateurs();
    this.chargerRoles();
    this.chargerClients();
  }

  /**
   * Une fenêtre <dialog> ouverte via showModal() rejoint la couche supérieure
   * du navigateur et reste donc au-dessus du sidebar.
   */
  ngAfterViewChecked(): void {
    if (!this.detailOuvert) {
      return;
    }

    const dialog = this.auditDetailDialog?.nativeElement;

    if (dialog && !dialog.open) {
      this.ouvrirDialogueDetails();
    }
  }

  ngOnDestroy(): void {
    const dialog = this.auditDetailDialog?.nativeElement;

    if (dialog?.open) {
      dialog.close();
    }

    this.detruit = true;

    this.listeSubscription?.unsubscribe();
    this.detailSubscription?.unsubscribe();
    this.utilisateursSubscription?.unsubscribe();
    this.rolesSubscription?.unsubscribe();
    this.clientsSubscription?.unsubscribe();

    this.abonnementsAuteurs.unsubscribe();
  }

  // ============================================================
  // INDICATEURS
  // ============================================================

  get debutResultats(): number {
    return this.journaux.length === 0
      ? 0
      : (this.page - 1) * this.limite + 1;
  }

  get finResultats(): number {
    return (this.page - 1) * this.limite +
      this.journaux.length;
  }

  get nombreAuteursIdentifies(): number {
    const noms = new Set<string>();

    for (const journal of this.journaux) {
      const nom = this.nomAuteur(journal);

      if (
        nom &&
        nom !== 'Auteur non renseigné' &&
        nom !== 'Client'
      ) {
        noms.add(nom.toLowerCase());
      }
    }

    return noms.size;
  }

  /** Suggestions de noms pour le filtre, sans exposer les identifiants. */
  get optionsUtilisateurs(): any[] {
    const uniques = new Map<string, any>();
    for (const utilisateur of this.utilisateursParId.values()) {
      const libelle = this.nomOptionUtilisateur(utilisateur);
      if (libelle && libelle !== 'Utilisateur') {
        uniques.set(libelle.toLowerCase(), utilisateur);
      }
    }
    return Array.from(uniques.values());
  }

  nomOptionUtilisateur(utilisateur: any): string {
    const nom = this.nomCompletObjet(utilisateur) ??
      this.texteValide(
        utilisateur?.fullName ?? utilisateur?.fullname ??
        utilisateur?.displayName ?? utilisateur?.name ??
        utilisateur?.username ?? utilisateur?.email
      );
    return nom ?? 'Utilisateur';
  }

  /** Convertit un nom sélectionné en ID API si l'utilisateur est connu. */
  private valeurFiltreUtilisateur(): string | undefined {
    const saisie = this.userId.trim();
    if (!saisie) return undefined;

    for (const utilisateur of this.utilisateursParId.values()) {
      const nom = this.nomOptionUtilisateur(utilisateur);
      const email = this.texteValide(utilisateur?.email);
      const username = this.texteValide(utilisateur?.username);
      const id = this.identifiantObjetUtilisateur(utilisateur);

      if ([nom, email, username, id].some(
        valeur => valeur?.toLowerCase() === saisie.toLowerCase()
      )) {
        return id ?? saisie;
      }
    }

    return saisie;
  }

  /** Convertit un nom d'objet visible en référence API si l'objet est connu. */
  private valeurFiltreEntite(): string | undefined {
    const saisie = this.entityId.trim();
    if (!saisie) return undefined;

    for (const journal of this.journaux) {
      const nom = this.valeurEntite(journal);
      const id = this.texteValide(journal.entityId ?? journal.entity?.id ?? journal.entity?._id);
      const reference = this.texteValide(journal.entity?.reference ?? journal['reference']);
      if (id && [nom, reference].some(
        valeur => valeur?.toLowerCase() === saisie.toLowerCase()
      )) {
        return id;
      }
    }

    return saisie;
  }

  /** Convertit un nom de client en référence API si les données sont présentes. */
  private valeurFiltreClient(): string | undefined {
    const saisie = this.customerId.trim();
    if (!saisie) return undefined;

    if (
  this.customerIdSelectionne &&
  saisie.toLocaleLowerCase('fr') ===
    this.libelleClientSelectionne.trim().toLocaleLowerCase('fr')
) {
  return this.customerIdSelectionne;
}

    // Chercher d'abord dans la liste complète des clients chargée depuis l'API.
    for (const client of this.clientsDisponibles) {
      const id = this.texteValide(
        client?.id ?? client?._id ?? client?.uuid ?? client?.customerId
      );
      const nom = this.nomObjetLisible(client) ??
        this.texteValide(client?.firstName || client?.lastName
          ? `${client?.firstName ?? ''} ${client?.lastName ?? ''}`.trim()
          : null);
      const email = this.texteValide(client?.email);

      if (id && [nom, email, id].some(
        valeur => valeur?.toLowerCase() === saisie.toLowerCase()
      )) {
        return id;
      }
    }

    // Secours : utiliser les clients déjà présents dans les journaux.
    for (const journal of this.journaux) {
      const client = journal.customer ?? journal['client'];
      const nom = this.nomObjetLisible(client) ??
        this.texteValide(journal['customerName'] ?? journal['clientName'] ?? journal['customerFullName']);
      const email = this.texteValide(client?.email);
      const id = this.texteValide(journal.customerId ?? client?.id ?? client?._id ?? client?.uuid);

      if (id && [nom, email, id].some(
        valeur => valeur?.toLowerCase() === saisie.toLowerCase()
      )) {
        return id;
      }
    }

    return saisie;
  }

  /** Charge la liste globale des clients afin que les suggestions ne dépendent pas des journaux affichés. */
  private chargerClients(): void {
    this.clientsSubscription?.unsubscribe();
    this.clientsSubscription = this.clientAuthService.listerClients().pipe(
      timeout(12000),
      take(1),
      catchError((error) => {
        console.error('Impossible de charger la liste des clients.', error);
        return of(null);
      })
    ).subscribe({
      next: (reponse: any) => {
        if (!reponse || this.detruit) return;

        const candidats = [
          reponse?.data?.customers,
          reponse?.data?.clients,
          reponse?.data?.items,
          reponse?.data?.results,
          reponse?.customers,
          reponse?.clients,
          reponse?.items,
          reponse?.results,
          reponse?.data,
          reponse
        ];

        const liste = candidats.find((valeur) => Array.isArray(valeur));
        this.clientsDisponibles = Array.isArray(liste) ? liste : [];

        // Les noms clients sont disponibles pour le tableau et les suggestions.
        if (!this.detruit) {
          this.cdr.detectChanges();
          this.chargerNomsClientsManquants(this.journaux);
        }
      }
    });
  }

  // ============================================================
  // CHARGEMENT DES UTILISATEURS
  // ============================================================

  private chargerUtilisateurs(): void {
    this.utilisateursSubscription =
      this.userService.getUsers(1, 100).pipe(
        timeout(12000),
        take(1),
        catchError(() => of(null))
      ).subscribe({
        next: (reponse: any) => {
          if (
            reponse?.success &&
            Array.isArray(reponse.data)
          ) {
            for (const utilisateur of reponse.data) {
              this.ajouterUtilisateur(utilisateur);
            }
          }

          this.resoudreAuteursManquants(this.journaux);

          const journalDetail = this.journalSelectionne;

          if (journalDetail) {
            this.resoudreAuteursManquants([journalDetail]);
          }

          if (!this.detruit) {
            this.cdr.detectChanges();
          }
        }
      });
  }

  private ajouterUtilisateur(utilisateur: any): void {
    if (
      !utilisateur ||
      typeof utilisateur !== 'object'
    ) {
      return;
    }

    const id =
      utilisateur.id ??
      utilisateur._id ??
      utilisateur.uuid ??
      utilisateur.userId;

    if (
      id === null ||
      id === undefined ||
      !String(id).trim()
    ) {
      return;
    }

    this.utilisateursParId.set(
      String(id).toLowerCase(),
      utilisateur
    );
  }

  private extraireUtilisateur(reponse: any): any {
    const candidats = [
      reponse?.data?.user,
      reponse?.data?.data,
      reponse?.data,
      reponse?.user,
      reponse
    ];

    for (const candidat of candidats) {
      if (
        candidat &&
        typeof candidat === 'object' &&
        !Array.isArray(candidat) &&
        (
          candidat.id ||
          candidat._id ||
          candidat.uuid ||
          candidat.userId
        )
      ) {
        return candidat;
      }
    }

    return null;
  }

  private resoudreAuteursManquants(
    journaux: AuditLog[]
  ): void {
    if (!journaux?.length || this.detruit) {
      return;
    }

    const identifiants = new Set<string>();

    for (const journal of journaux) {
      if (this.auteurPossedeNom(journal)) {
        continue;
      }

      if (
        journal.customerId &&
        !journal.userId &&
        !journal.actorId &&
        !journal.authorId &&
        !journal.adminId
      ) {
        continue;
      }

      const id = this.identifiantUtilisateurAuteur(journal);

      if (!id) {
        continue;
      }

      const cle = id.toLowerCase();

      if (
        this.utilisateursParId.has(cle) ||
        this.identifiantsEnCours.has(cle) ||
        this.identifiantsDejaRecherches.has(cle)
      ) {
        continue;
      }

      identifiants.add(id);
    }

    for (const id of identifiants) {
      this.chargerUtilisateurParId(id);
    }
  }

  private chargerUtilisateurParId(id: string): void {
    const cle = id.toLowerCase();

    if (
      this.detruit ||
      this.identifiantsEnCours.has(cle) ||
      this.identifiantsDejaRecherches.has(cle)
    ) {
      return;
    }

    this.identifiantsEnCours.add(cle);
    this.identifiantsDejaRecherches.add(cle);

    const abonnement =
      this.userService.getUser(id).pipe(
        timeout(10000),
        take(1),
        catchError(() => of(null)),
        finalize(() => {
          this.identifiantsEnCours.delete(cle);

          if (!this.detruit) {
            this.cdr.detectChanges();
          }
        })
      ).subscribe({
        next: (reponse: any) => {
          if (!reponse || this.detruit) {
            return;
          }

          const utilisateur =
            this.extraireUtilisateur(reponse);

          if (utilisateur) {
            this.ajouterUtilisateur(utilisateur);
          }

          this.cdr.detectChanges();
        }
      });

    this.abonnementsAuteurs.add(abonnement);
  }

  // ============================================================
  // CHARGEMENT DES RÔLES
  // ============================================================

  private chargerRoles(): void {
    this.rolesSubscription =
      this.userService.getRolesSelect().pipe(
        timeout(12000),
        take(1),
        catchError(() => of(null))
      ).subscribe({
        next: (reponse: any) => {
          if (
            reponse?.success &&
            Array.isArray(reponse.data)
          ) {
            for (const role of reponse.data) {
              if (!role?.id || !role?.label) {
                continue;
              }

              const id = String(role.id).toLowerCase();
              const libelle = String(role.label);

              this.libellesRoles.set(id, libelle);
              this.libellesRoles.set(
                libelle.toLowerCase(),
                libelle
              );

              if (role.code) {
                this.libellesRoles.set(
                  String(role.code).toLowerCase(),
                  libelle
                );
              }

              if (role.name) {
                this.libellesRoles.set(
                  String(role.name).toLowerCase(),
                  libelle
                );
              }
            }
          }

          if (!this.detruit) {
            this.cdr.detectChanges();
          }
        }
      });
  }

  // ============================================================
  // CHARGEMENT DU JOURNAL
  // ============================================================

  chargerJournaux(): void {
    if (
      this.dateFrom &&
      this.dateTo &&
      this.dateFrom > this.dateTo
    ) {
      this.erreur =
        'La date de début doit précéder la date de fin.';
      return;
    }

    this.listeSubscription?.unsubscribe();
    this.listeSubscription = null;

    this.chargement = true;
    this.erreur = '';

    const filtres: AuditLogFilters = {
      page: this.page,
      limit: this.limite,

      action: this.action
        ? this.action as AuditAction
        : undefined,

      module: this.module.trim() || undefined,
      userId: this.valeurFiltreUtilisateur(),
      customerId: this.valeurFiltreClient(),
      entityType: this.entityType.trim() || undefined,
      entityId: this.valeurFiltreEntite(),
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined
    };

    this.cdr.detectChanges();

    this.listeSubscription =
      this.auditService.getAuditLogs(filtres).pipe(
        timeout(15000),
        take(1),
        finalize(() => {
          this.chargement = false;

          if (!this.detruit) {
            this.cdr.detectChanges();
          }
        })
      ).subscribe({
        next: (reponse: any) => {
          if (reponse?.success === false) {
            this.erreur =
              reponse?.error?.message ??
              reponse?.message ??
              'Impossible de charger le journal d’audit.';

            this.journaux = [];
            this.total = 0;
            this.totalConnu = false;
            this.pageSuivanteDisponible = false;

            this.cdr.detectChanges();
            return;
          }

          const donnees = reponse?.data ?? reponse;

          this.journaux = this.extraireListe(donnees);
          this.synchroniserModules(this.journaux);

          const totalApi = this.extraireTotal(
            reponse,
            donnees
          );

          this.totalConnu = totalApi !== null;
          this.total = totalApi ?? this.journaux.length;

          this.pageSuivanteDisponible = this.totalConnu
            ? this.page * this.limite < this.total
            : this.journaux.length === this.limite;

          this.resoudreAuteursManquants(this.journaux);
          this.chargerNomsClientsManquants(this.journaux);

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          this.erreur = this.extraireErreur(error);

          this.journaux = [];
          this.total = 0;
          this.totalConnu = false;
          this.pageSuivanteDisponible = false;

          this.cdr.detectChanges();
        }
      });
  }

  // Ajoute automatiquement au menu les modules réellement renvoyés par l'API.
  // Cela permet de sélectionner aussi les modules qui ne figurent pas dans
  // la liste initiale (par exemple un nouveau module ajouté au back-end).
  private synchroniserModules(journaux: AuditLog[]): void {
    const existants = new Set(
      this.modules.map(element => element.valeur.toLowerCase())
    );

    for (const journal of journaux ?? []) {
      const valeur = this.texteValide(journal.module);
      if (!valeur) continue;

      const cle = valeur.toLowerCase();
      if (existants.has(cle)) continue;

      this.modules.push({
        valeur,
        libelle: this.libelleModule(valeur)
      });
      existants.add(cle);
    }

    this.modules.sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
  }

  // ============================================================
  // EXTRACTION DES RÉSULTATS
  // ============================================================

  private extraireListe(donnees: any): AuditLog[] {
    if (Array.isArray(donnees)) {
      return donnees;
    }

    if (!donnees || typeof donnees !== 'object') {
      return [];
    }

    const candidats = [
      donnees.items,
      donnees.logs,
      donnees.auditLogs,
      donnees.results,
      donnees.records,
      donnees.data
    ];

    for (const candidat of candidats) {
      if (Array.isArray(candidat)) {
        return candidat;
      }
    }

    return [];
  }

  private extraireTotal(
    reponse: any,
    donnees: any
  ): number | null {
    const candidats = [
      reponse?.total,
      reponse?.totalItems,
      reponse?.meta?.total,
      reponse?.pagination?.total,
      reponse?.data?.meta?.total,
      reponse?.data?.pagination?.total,
      donnees?.total,
      donnees?.totalItems,
      donnees?.meta?.total,
      donnees?.pagination?.total
    ];

    const totalTrouve = candidats.find(
      valeur =>
        typeof valeur === 'number' &&
        Number.isFinite(valeur) &&
        valeur >= 0
    );

    return typeof totalTrouve === 'number'
      ? totalTrouve
      : null;
  }

  /**
   * Certaines réponses de la liste ne contiennent que customerId.
   * La fenêtre Détails, elle, récupère l'objet customer complet via
   * getAuditLogById(). On applique la même requête aux lignes client
   * dont le nom n'est pas encore disponible, puis on remplace la ligne
   * dans le tableau pour que le prénom et le nom apparaissent sans clic.
   */
  private chargerNomsClientsManquants(journaux: AuditLog[]): void {
    for (const journal of journaux ?? []) {
    if (!journal || this.detruit) continue;

    const module = String(journal.module ?? '').toLowerCase();
    const client = journal.customer ?? journal['client'];
    const ligneClient = Boolean(
      journal.customerId ||
      client ||
      module.includes('customer') ||
      module.includes('client')
    );

    if (!ligneClient) continue;

    const nomActuel = this.nomAuteur(journal);
    const nomManquant =
      nomActuel === 'Client' ||
      nomActuel === 'Auteur non renseigné' ||
      nomActuel.includes('@') ||
      this.estIdentifiantTechnique(nomActuel);

    if (!nomManquant) continue;

    const id = this.texteValide(journal.id ?? journal._id);
    if (!id) continue;

    const cle = id.toLowerCase();
    if (
      this.identifiantsAuditsClientEnCours.has(cle) ||
      this.identifiantsAuditsClientTraites.has(cle)
    ) {
      continue;
    }

    this.identifiantsAuditsClientEnCours.add(cle);
    this.identifiantsAuditsClientTraites.add(cle);

    const abonnement = this.auditService.getAuditLogById(id).pipe(
      timeout(8000),
      take(1),
      catchError(() => of(null)),
      finalize(() => {
        this.identifiantsAuditsClientEnCours.delete(cle);
        if (!this.detruit) this.cdr.detectChanges();
      })
    ).subscribe({
      next: (reponse: any) => {
        if (!reponse || reponse?.success === false || this.detruit) return;

        const details = this.extraireObjetDetail(reponse);
        if (!details || typeof details !== 'object' || Array.isArray(details)) return;

        const journalEnrichi: AuditLog = {
          ...journal,
          ...details
        };

        // Ne remplace la ligne que si le nom a effectivement été récupéré.
        const nomEnrichi = this.nomAuteur(journalEnrichi);
        const nomToujoursManquant =
          nomEnrichi === 'Client' ||
          nomEnrichi === 'Auteur non renseigné' ||
          nomEnrichi.includes('@') ||
          this.estIdentifiantTechnique(nomEnrichi);

        if (nomToujoursManquant) return;

        const index = this.journaux.findIndex(ligne => {
          const ligneId = this.texteValide(ligne.id ?? ligne._id);
          return ligneId?.toLowerCase() === cle;
        });

        if (index !== -1) {
          const nouvelleListe = [...this.journaux];
          nouvelleListe[index] = journalEnrichi;
          this.journaux = nouvelleListe;
        }

        this.cdr.detectChanges();
      }
    });

    this.abonnementsAuteurs.add(abonnement);
    }
  }

  // ============================================================
  // GESTION DES ERREURS
  // ============================================================

  private extraireErreur(error: any): string {
    if (
      error?.name === 'TimeoutError' ||
      error?.name === 'TimeoutErrorImpl'
    ) {
      return 'La requête a dépassé le délai d’attente. Vérifiez la connexion et la réponse du serveur.';
    }

    const message =
      error?.error?.error?.message ??
      error?.error?.message ??
      error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (
      typeof message === 'string' &&
      message.trim() &&
      message !== 'Timeout has occurred'
    ) {
      return message;
    }

    if (error?.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez la connexion.';
    }

    if (error?.status === 401) {
      return 'Votre session a expiré ou vous devez vous connecter.';
    }

    if (error?.status === 403) {
      return 'Vous ne disposez pas des permissions nécessaires pour consulter le journal.';
    }

    if (error?.status === 429) {
      return 'Trop de requêtes. Patientez avant de réessayer.';
    }

    if (error?.status >= 500) {
      return 'Le serveur rencontre un problème. Réessayez ultérieurement.';
    }

    return 'Une erreur est survenue lors du chargement du journal.';
  }

  // ============================================================
  // FILTRES
  // ============================================================

  appliquerFiltres(): void {
    this.suggestionsUtilisateursOuvertes = false;
    this.suggestionsClientsOuvertes = false;

    if (
      this.dateFrom &&
      this.dateTo &&
      this.dateFrom > this.dateTo
    ) {
      this.erreur =
        'La date de début doit précéder la date de fin.';
      return;
    }

    this.page = 1;
    this.total = 0;
    this.totalConnu = false;
    this.pageSuivanteDisponible = false;

    this.chargerJournaux();
  }

  reinitialiserFiltres(): void {
    this.suggestionsUtilisateursOuvertes = false;
    this.suggestionsClientsOuvertes = false;
    this.action = '';
    this.module = '';
    this.userId = '';
    this.customerId = '';
    this.entityType = '';
    this.entityId = '';
    this.dateFrom = '';
    this.dateTo = '';

    this.page = 1;
    this.total = 0;
    this.totalConnu = false;
    this.pageSuivanteDisponible = false;

    this.chargerJournaux();
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  pagePrecedente(): void {
    if (this.page <= 1 || this.chargement) {
      return;
    }

    this.page--;
    this.chargerJournaux();
  }

  pageSuivante(): void {
    if (
      !this.pageSuivanteDisponible ||
      this.chargement
    ) {
      return;
    }

    this.page++;
    this.chargerJournaux();
  }

  changerLimite(valeur: number | string): void {
    const nouvelleLimite = Number(valeur);

    if (
      !this.limites.includes(nouvelleLimite) ||
      nouvelleLimite === this.limite
    ) {
      return;
    }

    this.limite = nouvelleLimite;
    this.page = 1;
    this.chargerJournaux();
  }

  // ============================================================
  // DÉTAIL D'UNE ENTRÉE
  // ============================================================

  private ouvrirDialogueDetails(): void {
    const dialog = this.auditDetailDialog?.nativeElement;

    if (!dialog) {
      const message = 'La fenêtre de détails est introuvable dans le HTML. Remplacez ensemble le HTML et le TypeScript fournis.';
      this.erreur = message;
      this.erreurDetail = message;
      console.error(message);
      return;
    }

    if (dialog.open) {
      return;
    }

    try {
      // showModal() place la fenêtre dans la couche supérieure du navigateur,
      // au-dessus du menu latéral et des autres éléments de la page.
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        // Repli pour les environnements qui ne prennent pas en charge showModal().
        dialog.setAttribute('open', '');
      }
    } catch (error) {
      console.error('Impossible d’ouvrir la fenêtre de détails.', error);
      // Repli visible : ne pas laisser l'erreur enfermée dans une fenêtre invisible.
      try {
        dialog.setAttribute('open', '');
      } catch (fallbackError) {
        console.error('Échec du mode de repli de la fenêtre de détails.', fallbackError);
      }
      const message = 'La fenêtre de détails n’a pas pu être ouverte normalement. Vérifiez que le HTML, le CSS et le TypeScript proviennent du même dossier corrigé.';
      this.erreur = message;
      this.erreurDetail = message;
    }
  }

  ouvrirDetail(journal: AuditLog): void {
    this.detailSubscription?.unsubscribe();
    this.detailSubscription = null;

    this.journalSelectionne = journal;
    this.detailOuvert = true;
    this.erreurDetail = '';
    this.chargementDetail = false;
    this.chargementDetailEnArrierePlan = false;

    // Met à jour les liaisons Angular, puis ouvre le dialogue natif.
    this.cdr.detectChanges();
    this.ouvrirDialogueDetails();

    if (this.detailsLocauxSuffisants(journal)) {
      this.resoudreAuteursManquants([journal]);
      this.cdr.detectChanges();
      return;
    }

    const id = journal.id ?? journal._id;

    if (!id) {
      this.erreurDetail =
        'Les informations complémentaires ne peuvent pas être récupérées : référence indisponible.';
      this.cdr.detectChanges();
      return;
    }

    // Les données déjà disponibles restent visibles pendant la requête.
    this.chargementDetailEnArrierePlan = true;
    this.cdr.detectChanges();

    this.detailSubscription =
      this.auditService.getAuditLogById(id).pipe(
        timeout(8000),
        take(1),
        finalize(() => {
          this.chargementDetail = false;
          this.chargementDetailEnArrierePlan = false;

          if (!this.detruit) {
            this.cdr.detectChanges();
          }
        })
      ).subscribe({
        next: (reponse: any) => {
          if (!this.detailOuvert || this.detruit) {
            return;
          }

          if (reponse?.success === false) {
            this.erreurDetail =
              reponse?.error?.message ??
              reponse?.message ??
              'Impossible de charger les détails complémentaires.';
            this.cdr.detectChanges();
            return;
          }

          const details = this.extraireObjetDetail(reponse);

          if (
            !details ||
            typeof details !== 'object' ||
            Array.isArray(details)
          ) {
            this.erreurDetail =
              'Le serveur n’a pas retourné de détails exploitables.';
            this.cdr.detectChanges();
            return;
          }

          // Conserver une référence non nullable pour le traitement suivant.
          const journalMisAJour: AuditLog = {
            ...journal,
            ...details
          };

          this.journalSelectionne = journalMisAJour;
          this.resoudreAuteursManquants([journalMisAJour]);
          this.cdr.detectChanges();
        },

        error: (error: any) => {
          if (!this.detruit && this.detailOuvert) {
            if (
              error?.name === 'TimeoutError' ||
              error?.name === 'TimeoutErrorImpl'
            ) {
              this.erreurDetail =
                'Les détails complémentaires prennent trop de temps à répondre. Les informations déjà disponibles restent affichées.';
            } else {
              this.erreurDetail = this.extraireErreur(error);
            }

            this.cdr.detectChanges();
          }
        }
      });
  }

  private detailsLocauxSuffisants(
    journal: AuditLog
  ): boolean {
    const avant = this.valeursAvant(journal);
    const apres = this.valeursApres(journal);

    if (
      this.donneeDisponible(avant) ||
      this.donneeDisponible(apres)
    ) {
      return true;
    }

    const action = String(
      journal.action ?? ''
    ).toUpperCase();

    // Ces opérations peuvent avoir un historique avant/après.
    // Si ces données ne sont pas fournies dans la liste, on
    // récupère le détail de l'entrée.
    const actionsAvecHistorique = [
      'CREATE',
      'UPDATE',
      'DELETE',
      'STOCK_ADJUSTMENT',
      'ORDER_STATUS_CHANGE',
      'PAYMENT',
      'REFUND'
    ];

    if (actionsAvecHistorique.includes(action)) {
      return false;
    }

    // Pour les autres opérations, les détails présents suffisent.
    return this.donneeDisponible(journal.details);
  }

  private donneeDisponible(valeur: any): boolean {
    if (
      valeur === null ||
      valeur === undefined ||
      valeur === ''
    ) {
      return false;
    }

    if (typeof valeur === 'string') {
      return valeur.trim().length > 0;
    }

    if (Array.isArray(valeur)) {
      return valeur.length > 0;
    }

    if (typeof valeur === 'object') {
      return Object.keys(valeur).length > 0;
    }

    return true;
  }

  private extraireObjetDetail(reponse: any): any {
    const candidats = [
      reponse?.data?.auditLog,
      reponse?.data?.log,
      reponse?.data?.data,
      reponse?.auditLog,
      reponse?.log,
      reponse?.data,
      reponse
    ];

    for (const candidat of candidats) {
      if (
        candidat &&
        typeof candidat === 'object' &&
        !Array.isArray(candidat) &&
        (
          candidat.id ||
          candidat._id ||
          candidat.action ||
          candidat.entityType ||
          candidat.before ||
          candidat.after ||
          candidat.beforeData ||
          candidat.afterData ||
          candidat.details
        )
      ) {
        return candidat;
      }
    }

    return null;
  }

  /** Ferme la modale si l'utilisateur clique sur la zone assombrie. */
  fermerDetailSurFond(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fermerDetail();
    }
  }

  fermerDetail(): void {
    this.detailSubscription?.unsubscribe();
    this.detailSubscription = null;

    const dialog = this.auditDetailDialog?.nativeElement;
    if (dialog?.open) {
      dialog.close();
    }

    this.detailOuvert = false;
    this.journalSelectionne = null;
    this.erreurDetail = '';
    this.chargementDetail = false;
    this.chargementDetailEnArrierePlan = false;

    if (!this.detruit) {
      this.cdr.detectChanges();
    }
  }

  // ============================================================
  // AUTEUR : NOM AFFICHABLE
  // ============================================================

  private trouverClientParId(idValeur: any): any | null {
    const id = this.texteValide(idValeur);
    if (!id) return null;

    const cle = id.toLowerCase();
    return this.clientsDisponibles.find((client: any) => {
      const identifiants = [client?.id, client?._id, client?.uuid, client?.customerId];
      return identifiants.some((valeur: any) =>
        valeur !== null && valeur !== undefined && String(valeur).toLowerCase() === cle
      );
    }) ?? null;
  }

  nomAuteur(journal: AuditLog): string {
    const auteur = this.obtenirObjetAuteur(journal);

    const nomDirect = this.nomCompletObjet(auteur);

    if (nomDirect) {
      return nomDirect;
    }

    // Les journaux peuvent contenir uniquement customerId ; retrouver alors
    // le prénom et le nom dans la liste complète des clients récupérée par l'API.
    const idClient = this.texteValide(
      journal.customerId ?? journal['clientId'] ??
      journal.customer?.id ?? journal.customer?._id ??
      journal['client']?.id ?? journal['client']?._id
    );
    const clientTrouve = this.trouverClientParId(idClient);
    const nomClientTrouve = this.nomCompletObjet(clientTrouve) ?? this.nomObjetLisible(clientTrouve);

    if (nomClientTrouve) {
      return nomClientTrouve;
    }

    const prenom = this.texteValide(
      journal['userFirstName'] ??
      journal['userFirstname'] ??
      journal['authorFirstName'] ??
      journal['customerFirstName'] ??
      journal['actorFirstName']
    );

    const nom = this.texteValide(
      journal['userLastName'] ??
      journal['userLastname'] ??
      journal['authorLastName'] ??
      journal['customerLastName'] ??
      journal['actorLastName']
    );

    const nomCombine = [prenom, nom]
      .filter((partie): partie is string => !!partie)
      .join(' ')
      .trim();

    if (nomCombine) {
      return nomCombine;
    }

    const id = this.identifiantUtilisateurAuteur(journal);

    if (id) {
      const utilisateur = this.utilisateursParId.get(
        id.toLowerCase()
      );

      const nomUtilisateur = this.nomCompletObjet(utilisateur);

      if (nomUtilisateur) {
        return nomUtilisateur;
      }
    }

    const noms = [
      auteur?.fullName,
      auteur?.fullname,
      auteur?.displayName,
      auteur?.name,
      journal['authorName'],
      journal['userName'],
      journal['customerName'],
      journal['actorName']
    ];

    for (const valeur of noms) {
      const nomDisponible = this.texteValide(valeur);

      if (
        nomDisponible &&
        !this.estIdentifiantTechnique(nomDisponible) &&
        !/^\d{4,}$/.test(nomDisponible)
      ) {
        return nomDisponible;
      }
    }

    if (id) {
      const utilisateur = this.utilisateursParId.get(
        id.toLowerCase()
      );

      const email = this.texteValide(utilisateur?.email);

      if (email) {
        return email;
      }
    }

    if (
      journal.customerId &&
      !journal.userId &&
      !journal.actorId
    ) {
      const client = journal.customer;
      const nomClient = this.nomCompletObjet(client);

      if (nomClient) {
        return nomClient;
      }

      const emailClient = this.texteValide(client?.email);

      if (emailClient) {
        return emailClient;
      }

      return 'Client';
    }

    const idConnecte =
      this.identifiantObjetUtilisateur(this.utilisateurConnecte);

    if (
      id &&
      idConnecte &&
      id.toLowerCase() === idConnecte.toLowerCase()
    ) {
      const nomConnecte =
        this.nomCompletObjet(this.utilisateurConnecte);

      if (nomConnecte) {
        return nomConnecte;
      }

      const emailConnecte =
        this.texteValide(this.utilisateurConnecte?.email);

      if (emailConnecte) {
        return emailConnecte;
      }
    }

    return 'Auteur non renseigné';
  }

  // ============================================================
  // AUTEUR : RÔLE
  // ============================================================

  roleAuteur(journal: AuditLog): string {
    const auteur = this.obtenirObjetAuteur(journal);
    const id = this.identifiantUtilisateurAuteur(journal);

    const utilisateur = id
      ? this.utilisateursParId.get(id.toLowerCase())
      : undefined;

    const roles =
      auteur?.roles ??
      utilisateur?.roles ??
      journal.roles ??
      journal['authorRoles'] ??
      journal['userRoles'];

    if (Array.isArray(roles) && roles.length > 0) {
      const libelles = roles
        .map((role: any) => this.libelleRole(role))
        .filter(
          (role: string | null): role is string => !!role
        );

      if (libelles.length > 0) {
        return Array.from(new Set(libelles)).join(', ');
      }
    }

    const roleDirect =
      journal['roleName'] ??
      journal['authorRole'] ??
      journal['userRole'] ??
      journal['actorRole'] ??
      journal['role'];

    if (roleDirect) {
      const libelle = this.libelleRole(roleDirect);

      if (libelle) {
        return libelle;
      }
    }

    const roleId =
      auteur?.roleId ??
      utilisateur?.roleId ??
      journal.roleId;

    if (roleId) {
      const libelle = this.libelleRole(roleId);

      if (libelle) {
        return libelle;
      }
    }

    const idConnecte =
      this.identifiantObjetUtilisateur(this.utilisateurConnecte);

    if (
      id &&
      idConnecte &&
      id.toLowerCase() === idConnecte.toLowerCase()
    ) {
      const rolesConnecte = this.utilisateurConnecte?.roles;

      if (Array.isArray(rolesConnecte)) {
        const libellesConnecte = rolesConnecte
          .map((role: any) => this.libelleRole(role))
          .filter(
            (role: string | null): role is string => !!role
          );

        if (libellesConnecte.length > 0) {
          return Array.from(new Set(libellesConnecte)).join(', ');
        }
      }
    }

    if (
      journal.customerId &&
      !journal.userId &&
      !journal.actorId
    ) {
      return 'Client';
    }

    return 'Rôle non renseigné';
  }

  private libelleRole(role: any): string | null {
    if (
      role === null ||
      role === undefined ||
      role === ''
    ) {
      return null;
    }

    if (typeof role === 'object') {
      const nom =
        role.label ??
        role.name ??
        role.roleName ??
        role.displayName ??
        role.title;

      if (nom) {
        return this.normaliserRole(String(nom));
      }

      const id =
        role.id ??
        role._id ??
        role.uuid ??
        role.roleId;

      if (id) {
        return this.libellesRoles.get(
          String(id).toLowerCase()
        ) ?? null;
      }

      return null;
    }

    const valeur = String(role).trim();

    if (!valeur || this.estUuid(valeur)) {
      return null;
    }

    const libelle = this.libellesRoles.get(
      valeur.toLowerCase()
    );

    if (libelle) {
      return this.normaliserRole(libelle);
    }

    return this.normaliserRole(valeur);
  }

  private normaliserRole(role: string): string {
    const valeur = role.trim();

    const code = valeur
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toUpperCase();

    if (
      code === 'SUPER ADMIN' ||
      code === 'SUPERADMIN' ||
      code === 'SUPER ADMINISTRATOR' ||
      code === 'SUPER ADMINISTRATEUR'
    ) {
      return 'Super administrateur';
    }

    if (code.includes('GESTIONNAIRE BOUTIQUE')) {
      return 'Gestionnaire boutique';
    }

    if (code.includes('GESTIONNAIRE')) {
      return 'Gestionnaire';
    }

    if (code === 'ADMIN' || code === 'ADMINISTRATEUR') {
      return 'Administrateur';
    }

    if (code.includes('COMPTABLE')) {
      return 'Comptable';
    }

    if (code.includes('MARKETING')) {
      return 'Marketing';
    }

    if (code.includes('CLIENT')) {
      return 'Client';
    }

    return valeur
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, lettre => lettre.toUpperCase());
  }

  // ============================================================
  // ENTITÉ : INTITULÉ LISIBLE
  // ============================================================

  valeurEntite(journal: AuditLog): string {
    const entite = journal.entity ?? journal['resource'];

    const nomReel =
      journal.entityName ??
      entite?.name ??
      entite?.label ??
      entite?.title ??
      journal['resourceName'] ??
      journal['productName'] ??
      journal['orderNumber'] ??
      journal['reference'] ??
      journal['targetName'] ??
      journal['objectName'] ??
      journal['itemName'] ??
      entite?.fullName ??
      entite?.displayName ??
      entite?.number;

    if (
      nomReel !== undefined &&
      nomReel !== null &&
      String(nomReel).trim() &&
      !this.estIdentifiantTechnique(String(nomReel)) &&
      !/^\d{4,}$/.test(String(nomReel).trim())
    ) {
      return String(nomReel).trim();
    }

    const type = String(
      journal.entityType ??
      entite?.type ??
      ''
    ).trim();

    const typeLisible = this.typeEntiteLisible(type);

    if (this.estTypeUtilisateur(type)) {
      const idEntite = this.texteValide(
        journal.entityId ?? entite?.id
      );

      if (idEntite) {
        const utilisateur = this.utilisateursParId.get(
          idEntite.toLowerCase()
        );

        const nomUtilisateur =
          this.nomCompletObjet(utilisateur);

        if (nomUtilisateur) {
          return `${typeLisible} : ${nomUtilisateur}`;
        }
      }

      const idAuteur =
        this.identifiantUtilisateurAuteur(journal);

      if (
        idAuteur &&
        idEntite &&
        idAuteur.toLowerCase() === idEntite.toLowerCase()
      ) {
        const nomAuteur = this.nomAuteur(journal);

        if (nomAuteur !== 'Auteur non renseigné') {
          return `${typeLisible} : ${nomAuteur}`;
        }
      }
    }

    if (this.estTypeClient(type)) {
      const client = journal.customer ?? entite ?? journal['client'];
      const nomClient = this.nomCompletObjet(client) ??
        this.texteValide(client?.name ?? client?.fullName ?? client?.displayName ?? journal['customerName'] ?? journal['clientName']);

      if (nomClient) {
        return `Compte client : ${nomClient}`;
      }

      const emailClient = this.texteValide(client?.email);

      if (emailClient) {
        return `Compte client : ${emailClient}`;
      }
    }

    return typeLisible || 'Élément concerné non renseigné';
  }

  typeEntiteLisible(
    type: string | null | undefined
  ): string {
    if (!type) {
      return 'Non renseigné';
    }

    const types: Record<string, string> = {
      user: 'Compte utilisateur',
      utilisateur: 'Compte utilisateur',
      customer: 'Compte client',
      client: 'Compte client',
      product: 'Produit',
      order: 'Commande',
      inventoryitem: 'Article d’inventaire',
      category: 'Catégorie',
      payment: 'Paiement',
      refund: 'Remboursement',
      role: 'Rôle',
      permission: 'Permission',
      userrole: 'Rôle utilisateur',
      stockmovement: 'Mouvement de stock',
      inventorymovement: 'Mouvement de stock',
      address: 'Adresse',
      session: 'Session',
      cart: 'Panier',
      review: 'Avis',
      delivery: 'Livraison',
      coupon: 'Code promotionnel',
      reservation: 'Réservation',
      restaurant: 'Restaurant',
      residence: 'Résidence'
    };

    const cle = type
      .replace(/[\s_-]+/g, '')
      .toLowerCase();

    if (types[cle]) {
      return types[cle];
    }

    const normalise = type
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();

    return normalise
      ? normalise.charAt(0).toUpperCase() + normalise.slice(1)
      : 'Élément concerné';
  }

  libelleModule(module: string | undefined): string {
    if (!module) {
      return 'Non renseigné';
    }

    const modules: Record<string, string> = {
      auth: 'Authentification',
      'customer-auth': 'Authentification client',
      users: 'Utilisateurs',
      customers: 'Clients',
      products: 'Produits',
      orders: 'Commandes',
      inventory: 'Inventaire',
      stock: 'Stock',
      categories: 'Catégories',
      payments: 'Paiements',
      refunds: 'Remboursements',
      roles: 'Rôles et permissions',
      permissions: 'Permissions',
      reports: 'Rapports',
      exports: 'Exports',
      delivery: 'Livraison',
      reservations: 'Réservations',
      restaurants: 'Restaurants',
      residences: 'Résidences'
    };

    const cle = module.trim().toLowerCase();
    if (modules[cle]) return modules[cle];

    return module
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, lettre => lettre.toLocaleUpperCase('fr-FR'));
  }

  descriptionOperation(journal: AuditLog): string {
    const action = String(
      journal.action ?? ''
    ).toUpperCase();

    const entite = this.valeurEntite(journal);

    switch (action) {
      case 'LOGIN':
        return `Connexion au compte : ${entite}`;

      case 'LOGOUT':
        return `Déconnexion du compte : ${entite}`;

      case 'CREATE':
        return `Création : ${entite}`;

      case 'UPDATE':
        return `Modification : ${entite}`;

      case 'DELETE':
        return `Suppression : ${entite}`;

      case 'PASSWORD_CHANGE':
        return 'Changement de mot de passe';

      case 'PAYMENT':
        return `Paiement : ${entite}`;

      case 'REFUND':
        return `Remboursement : ${entite}`;

      case 'ORDER_STATUS_CHANGE':
        return `Changement de statut : ${entite}`;

      case 'STOCK_ADJUSTMENT':
        return `Ajustement de stock : ${entite}`;

      case 'EXPORT':
        return `Exportation : ${entite}`;

      default:
        return `Opération sur : ${entite}`;
    }
  }

  private estTypeUtilisateur(type: string): boolean {
    return [
      'user',
      'utilisateur'
    ].includes(type.toLowerCase());
  }

  private estTypeClient(type: string): boolean {
    return [
      'customer',
      'client'
    ].includes(type.toLowerCase());
  }

  // ============================================================
  // UTILITAIRES AUTEUR
  // ============================================================

  private obtenirObjetAuteur(journal: AuditLog): any {
    return journal.user ??
      journal.customer ??
      journal.actor ??
      journal.author ??
      journal.admin ??
      null;
  }

  private auteurPossedeNom(
    journal: AuditLog
  ): boolean {
    const auteur = this.obtenirObjetAuteur(journal);

    if (this.nomCompletObjet(auteur)) {
      return true;
    }

    const idClient = this.texteValide(
      journal.customerId ?? journal['clientId'] ??
      journal.customer?.id ?? journal.customer?._id ??
      journal['client']?.id ?? journal['client']?._id
    );
    if (this.nomCompletObjet(this.trouverClientParId(idClient))) {
      return true;
    }

    const prenom = this.texteValide(
      journal['userFirstName'] ??
      journal['authorFirstName'] ??
      journal['customerFirstName'] ??
      auteur?.firstName
    );

    const nom = this.texteValide(
      journal['userLastName'] ??
      journal['authorLastName'] ??
      journal['customerLastName'] ??
      auteur?.lastName
    );

    if (prenom || nom) {
      return true;
    }

    const id = this.identifiantUtilisateurAuteur(journal);

    if (id) {
      const utilisateur = this.utilisateursParId.get(
        id.toLowerCase()
      );

      if (this.nomCompletObjet(utilisateur)) {
        return true;
      }
    }

    const noms = [
      auteur?.fullName,
      auteur?.displayName,
      auteur?.name,
      journal['authorName'],
      journal['userName'],
      journal['customerName'],
      journal['actorName']
    ];

    return noms.some(
      valeur => !!this.texteValide(valeur)
    );
  }

  private identifiantUtilisateurAuteur(
    journal: AuditLog
  ): string | null {
    const auteur = this.obtenirObjetAuteur(journal);

    const valeurs = [
      journal.userId,
      journal.actorId,
      journal.authorId,
      journal.adminId,
      auteur?.id,
      auteur?._id,
      auteur?.uuid,
      auteur?.userId
    ];

    for (const valeur of valeurs) {
      const id = this.texteValide(valeur);

      if (id) {
        return id;
      }
    }

    if (
      typeof auteur === 'string' &&
      this.estUuid(auteur)
    ) {
      return auteur;
    }

    return null;
  }

  private identifiantObjetUtilisateur(
    utilisateur: any
  ): string | null {
    if (
      !utilisateur ||
      typeof utilisateur !== 'object'
    ) {
      return null;
    }

    const valeurs = [
      utilisateur.id,
      utilisateur._id,
      utilisateur.uuid,
      utilisateur.userId,
      utilisateur.sub
    ];

    for (const valeur of valeurs) {
      const id = this.texteValide(valeur);

      if (id) {
        return id;
      }
    }

    return null;
  }

  private nomCompletObjet(objet: any): string | null {
    if (!objet || typeof objet !== 'object') {
      return null;
    }

    const prenom = this.texteValide(
      objet.firstName ??
      objet.firstname ??
      objet.first_name ??
      objet.givenName
    );

    const nom = this.texteValide(
      objet.lastName ??
      objet.lastname ??
      objet.last_name ??
      objet.familyName
    );

    const resultat = [prenom, nom]
      .filter((partie): partie is string => !!partie)
      .join(' ')
      .trim();

    return resultat || null;
  }

  private texteValide(valeur: any): string | null {
    if (
      typeof valeur !== 'string' &&
      typeof valeur !== 'number'
    ) {
      return null;
    }

    const texte = String(valeur).trim();

    return texte ? texte : null;
  }

  private estUuid(valeur: string): boolean {
    // UUID et identifiants MongoDB ObjectId : ne jamais les afficher tels quels.
    return (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valeur) ||
      /^[0-9a-f]{24}$/i.test(valeur)
    );
  }

  private estIdentifiantTechnique(valeur: string): boolean {
    return this.estUuid(valeur) || /^\d{16,}$/.test(valeur.trim());
  }

  private estCleReference(cle: string): boolean {
    const compacte = cle.replace(/[\s_-]+/g, '');
    return /^(?:id|uuid)$/i.test(compacte) ||
      /(?:Id|ID|Uuid|UUID)$/.test(compacte) ||
      /(?:_id|_uuid)$/i.test(cle);
  }

  private estCleTechniqueMasquee(cle: string): boolean {
    const normalisee = cle.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return normalisee === 'id' || normalisee === 'uuid' ||
      normalisee === 'auditlogid' || normalisee === 'logid' ||
      normalisee === 'recordid' || normalisee === 'traceid';
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  libelleAction(action: string | undefined): string {
    if (!action) {
      return 'Autre';
    }

    const trouve = this.actions.find(
      element => element.valeur === action
    );

    return trouve?.libelle ?? action.replace(/_/g, ' ');
  }

  classeAction(action: string | undefined): string {
    switch (action) {
      case 'CREATE':
        return 'action-create';

      case 'UPDATE':
      case 'ORDER_STATUS_CHANGE':
      case 'STOCK_ADJUSTMENT':
        return 'action-update';

      case 'DELETE':
      case 'REFUND':
        return 'action-delete';

      case 'LOGIN':
        return 'action-login';

      case 'PAYMENT':
        return 'action-payment';

      case 'LOGOUT':
      case 'PASSWORD_CHANGE':
      case 'EXPORT':
      case 'OTHER':
      default:
        return 'action-default';
    }
  }

  // ============================================================
  // DATES
  // ============================================================

  dateLisible(journal: AuditLog): string {
    const valeur =
      journal.createdAt ??
      journal.timestamp ??
      journal['date'];

    if (!valeur) {
      return 'Non renseignée';
    }

    const date = new Date(valeur);

    if (Number.isNaN(date.getTime())) {
      return String(valeur);
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // ============================================================
  // VALEURS AVANT ET APRÈS
  // ============================================================

  valeursAvant(journal: AuditLog | null): any {
    if (!journal) {
      return null;
    }

    return journal.before ??
      journal.beforeData ??
      journal.oldValues ??
      journal['previousValues'] ??
      journal['changes']?.before ??
      journal.details?.before ??
      journal.details?.oldValues ??
      null;
  }

  valeursApres(journal: AuditLog | null): any {
    if (!journal) {
      return null;
    }

    return journal.after ??
      journal.afterData ??
      journal.newValues ??
      journal['currentValues'] ??
      journal['changes']?.after ??
      journal.details?.after ??
      journal.details?.newValues ??
      null;
  }

  // ============================================================
  // FORMATAGE LISIBLE DES DONNÉES
  // Affiche des lignes métier au lieu du JSON brut.
  // ============================================================

  formaterObjet(
    valeur: any,
    journal: AuditLog | null = null
  ): string {
    if (
      valeur === null ||
      valeur === undefined ||
      valeur === ''
    ) {
      return this.chargementDetailEnArrierePlan
        ? 'Chargement des détails...'
        : 'Aucune donnée disponible';
    }

    let donnee = valeur;

    // Certaines API renvoient du JSON sous forme de chaîne.
    if (typeof valeur === 'string') {
      try {
        donnee = JSON.parse(valeur);
      } catch {
        if (this.estIdentifiantTechnique(valeur)) {
          return this.remplacerUuid(valeur, '', journal);
        }

        return valeur.trim() || 'Aucune donnée disponible';
      }

      // Une chaîne JSON peut contenir directement un texte.
      if (typeof donnee === 'string') {
        return donnee.trim() || 'Aucune donnée disponible';
      }
    }

    const lignes = this.lignesLisibles(donnee, journal, 0);

    return lignes.length > 0
      ? lignes.join('\n')
      : 'Aucune donnée disponible';
  }

  private lignesLisibles(
    valeur: any,
    journal: AuditLog | null,
    niveau: number
  ): string[] {
    const indentation = '  '.repeat(niveau);

    if (valeur === null || valeur === undefined) {
      return [`${indentation}Non renseigné`];
    }

    if (Array.isArray(valeur)) {
      if (valeur.length === 0) {
        return [`${indentation}Aucun élément`];
      }

      const lignes: string[] = [];

      valeur.forEach((element, index) => {
        if (
          element !== null &&
          typeof element === 'object'
        ) {
          lignes.push(
            `${indentation}Élément ${index + 1} :`
          );

          lignes.push(
            ...this.lignesLisibles(
              element,
              journal,
              niveau + 1
            )
          );
        } else {
          lignes.push(
            `${indentation}Élément ${index + 1} : ${
              this.valeurAffichable(element, '', journal)
            }`
          );
        }
      });

      return lignes;
    }

    if (typeof valeur !== 'object') {
      return [
        `${indentation}${this.valeurAffichable(
          valeur,
          '',
          journal
        )}`
      ];
    }

    const entrees = Object.entries(valeur).filter(
      ([cle]) => {
        const cleMinuscule = cle.toLowerCase();

        return !this.estCleTechniqueMasquee(cleMinuscule);
      }
    );

    if (entrees.length === 0) {
      return [`${indentation}Aucune donnée disponible`];
    }

    const lignes: string[] = [];

    for (const [cle, contenu] of entrees) {
      const cleMinuscule = cle.toLowerCase();
      const libelle = this.libellePropriete(cle);

      if (
        contenu !== null &&
        typeof contenu === 'object'
      ) {
        // Un champ de référence qui contient un objet complet est affiché
        // comme un objet métier, jamais comme une référence technique.
        const nomObjet = this.nomObjetLisible(contenu);
        if (this.estCleReference(cle) && nomObjet) {
          lignes.push(`${indentation}${libelle} : ${nomObjet}`);
          continue;
        }

        lignes.push(`${indentation}${libelle} :`);
        lignes.push(
          ...this.lignesLisibles(contenu, journal, niveau + 1)
        );
        continue;
      }

      // Les champs id/_id/uuid sont masqués. Les autres références
      // (userId, productId, entityId...) deviennent des noms lisibles.
      const valeurLisible = this.valeurAffichable(contenu, cle, journal);
      lignes.push(`${indentation}${libelle} : ${valeurLisible}`);
    }

    return lignes;
  }

  private valeurAffichable(
    valeur: any,
    cle: string,
    journal: AuditLog | null
  ): string {
    if (valeur === null || valeur === undefined || valeur === '') {
      return 'Non renseigné';
    }

    if (typeof valeur === 'boolean') {
      return valeur ? 'Oui' : 'Non';
    }

    if (typeof valeur === 'number') {
      return this.estCleReference(cle)
        ? this.remplacerReference(String(valeur), cle, journal)
        : String(valeur);
    }

    if (typeof valeur !== 'string') {
      return String(valeur);
    }

    const texte = valeur.trim();

    if (!texte) {
      return 'Non renseigné';
    }

    if (this.estIdentifiantTechnique(texte) || this.estCleReference(cle)) {
      return this.remplacerReference(texte, cle, journal);
    }

    const cleNormalisee = this.normaliserCle(cle);

    // Valeurs courantes des opérations et des mouvements de stock.
    const valeursTraduites: Record<string, string> = {
      SALE: 'Vente',
      PURCHASE: 'Achat',
      RETURN: 'Retour',
      ADJUSTMENT: 'Ajustement',
      STOCK_ADJUSTMENT: 'Ajustement de stock',
      IN: 'Entrée',
      OUT: 'Sortie',
      INCOMING: 'Entrée',
      OUTGOING: 'Sortie',
      PENDING: 'En attente',
      COMPLETED: 'Terminé',
      CANCELLED: 'Annulé',
      CANCELED: 'Annulé',
      PAID: 'Payé',
      UNPAID: 'Non payé',
      FAILED: 'Échec',
      SUCCESS: 'Réussi',
      ACTIVE: 'Actif',
      INACTIVE: 'Inactif',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
      PROCESSING: 'En cours de traitement',
      SHIPPED: 'Expédié',
      DELIVERED: 'Livré',
      DRAFT: 'Brouillon',
      EXPIRED: 'Expiré',
      ENABLED: 'Activé',
      DISABLED: 'Désactivé'
    };

    const code = texte.toUpperCase();

    if (valeursTraduites[code]) {
      return valeursTraduites[code];
    }

    // Les champs de date sont présentés au format français.
    const champsDate = [
      'date',
      'timestamp',
      'createdat',
      'updatedat',
      'deletedat',
      'paidat',
      'completedat',
      'performedat',
      'datefrom',
      'dateto'
    ];

    if (
      champsDate.includes(cleNormalisee) &&
      !Number.isNaN(new Date(texte).getTime())
    ) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(texte));
    }

    // Les rôles sont affichés avec leurs libellés connus.
    if (
      cleNormalisee === 'role' ||
      cleNormalisee === 'rolename' ||
      cleNormalisee === 'authorrole' ||
      cleNormalisee === 'userrole'
    ) {
      return this.libelleRole(texte) ?? texte;
    }

    return texte;
  }

  private normaliserCle(cle: string): string {
    return cle
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/\s/g, '');
  }

  private libellePropriete(cle: string): string {
    const cleNormalisee = cle
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const libelles: Record<string, string> = {
      result: 'Résultat',
      message: 'Message',
      status: 'Statut',
      action: 'Action',
      module: 'Module',

      email: 'Adresse e-mail',
      firstname: 'Prénom',
      'first name': 'Prénom',
      lastname: 'Nom',
      'last name': 'Nom',
      fullname: 'Nom complet',
      'full name': 'Nom complet',
      displayname: 'Nom affiché',
      name: 'Nom',
      title: 'Intitulé',
      label: 'Libellé',

      reference: 'Référence',
      ordernumber: 'Numéro de commande',
      amount: 'Montant',
      currency: 'Devise',
      quantity: 'Quantité',
      delta: 'Écart de quantité',
      reason: 'Motif',
      'movement type': 'Type de mouvement',
      movementtype: 'Type de mouvement',
      type: 'Type',
      stock: 'Stock',
      previousquantity: 'Quantité précédente',
      'previous quantity': 'Quantité précédente',
      currentquantity: 'Quantité actuelle',
      'current quantity': 'Quantité actuelle',
      newquantity: 'Nouvelle quantité',
      'new quantity': 'Nouvelle quantité',
      oldquantity: 'Ancienne quantité',
      'old quantity': 'Ancienne quantité',
      unitprice: 'Prix unitaire',
      'unit price': 'Prix unitaire',
      totalprice: 'Prix total',
      'total price': 'Prix total',

      previousstatus: 'Statut précédent',
      'previous status': 'Statut précédent',
      newstatus: 'Nouveau statut',
      'new status': 'Nouveau statut',

      createdat: 'Date de création',
      'created at': 'Date de création',
      updatedat: 'Date de modification',
      'updated at': 'Date de modification',

      userid: 'Nom de l’utilisateur',
      'user id': 'Nom de l’utilisateur',
      authorid: 'Auteur',
      'author id': 'Auteur',
      actorid: 'Auteur',
      'actor id': 'Auteur',
      adminid: 'Administrateur',
      'admin id': 'Administrateur',
      customerid: 'Compte client',
      'customer id': 'Compte client',
      entityid: 'Nom de l’entité',
      'entity id': 'Nom de l’entité',
      productid: 'Produit',
      'product id': 'Produit',
      orderid: 'Commande',
      'order id': 'Commande',
      inventoryitemid: 'Article d’inventaire',
      'inventory item id': 'Article d’inventaire',
      roleid: 'Rôle',
      'role id': 'Rôle',
      permissionid: 'Permission',
      'permission id': 'Permission',

      before: 'Valeurs avant',
      after: 'Valeurs après',
      oldvalues: 'Anciennes valeurs',
      newvalues: 'Nouvelles valeurs',
      'old values': 'Anciennes valeurs',
      'new values': 'Nouvelles valeurs',
      ipaddress: 'Adresse IP',
      'ip address': 'Adresse IP',
      useragent: 'Navigateur utilisé',
      'user agent': 'Navigateur utilisé',
      description: 'Description'
    };

    if (libelles[cleNormalisee]) {
      return libelles[cleNormalisee];
    }

    const normalise = cle
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalise
      ? normalise.charAt(0).toUpperCase() + normalise.slice(1)
      : cle;
  }

  /**
   * Recherche dans l'entrée d'audit un objet déjà inclus par l'API dont
   * l'identifiant correspond à la référence rencontrée dans les détails.
   * Exemple : productId -> entity/product { id, name }.
   */
  private trouverNomObjetPourId(
    idRecherche: string,
    racine: any,
    profondeur = 0,
    visites = new Set<any>()
  ): string | null {
    if (
      !racine ||
      typeof racine !== 'object' ||
      profondeur > 7 ||
      visites.has(racine)
    ) {
      return null;
    }

    visites.add(racine);
    const cible = idRecherche.toLowerCase();

    if (!Array.isArray(racine)) {
      const identifiants = [
        racine.id, racine._id, racine.uuid, racine.userId,
        racine.customerId, racine.productId, racine.orderId,
        racine.entityId, racine.roleId, racine.permissionId
      ];
      const correspond = identifiants.some(
        valeur => valeur !== null && valeur !== undefined &&
          String(valeur).toLowerCase() === cible
      );

      if (correspond) {
        const nom = this.nomCompletObjet(racine) ??
          this.texteValide(
            racine.name ?? racine.fullName ?? racine.fullname ??
            racine.displayName ?? racine.title ?? racine.label ??
            racine.productName ?? racine.orderNumber ??
            racine.reference ?? racine.email
          );
        if (nom && !this.estUuid(nom)) return nom;
      }
    }

    const enfants = Array.isArray(racine) ? racine : Object.values(racine);
    for (const enfant of enfants) {
      if (enfant && typeof enfant === 'object') {
        const resultat = this.trouverNomObjetPourId(
          idRecherche, enfant, profondeur + 1, visites
        );
        if (resultat) return resultat;
      }
    }

    return null;
  }

  private nomObjetLisible(objet: any): string | null {
    if (!objet || typeof objet !== 'object' || Array.isArray(objet)) {
      return null;
    }

    const nomComplet = this.nomCompletObjet(objet);
    if (nomComplet) {
      return nomComplet;
    }

    const candidats = [
      objet.fullName,
      objet.fullname,
      objet.displayName,
      objet.name,
      objet.label,
      objet.title,
      objet.productName,
      objet.customerName,
      objet.userName,
      objet.orderNumber,
      objet.reference,
      objet.code,
      objet.email
    ];

    for (const candidat of candidats) {
      const texte = this.texteValide(candidat);
      if (texte && !this.estIdentifiantTechnique(texte)) {
        return texte;
      }
    }

    return null;
  }

  private libelleReferenceSansNom(cle: string): string {
    const normalisee = this.normaliserCle(cle);
    if (normalisee.includes('customer') || normalisee.includes('client')) return 'Compte client associé';
    if (normalisee.includes('user') || normalisee.includes('author') || normalisee.includes('actor') || normalisee.includes('admin')) return 'Utilisateur associé';
    if (normalisee.includes('product') || normalisee.includes('article')) return 'Produit associé';
    if (normalisee.includes('order') || normalisee.includes('commande')) return 'Commande associée';
    if (normalisee.includes('role')) return 'Rôle associé';
    if (normalisee.includes('permission')) return 'Permission associée';
    if (normalisee.includes('entity') || normalisee.includes('resource')) return 'Élément associé';
    if (normalisee.includes('module')) return 'Module associé';
    return 'Référence associée';
  }

  private remplacerReference(
    reference: string,
    cle: string,
    journal: AuditLog | null
  ): string {
    const valeur = reference.trim();
    const cleMinuscule = cle.toLowerCase();
    const valeurMinuscule = valeur.toLowerCase();

    if (journal) {
      const idAuteur = this.identifiantUtilisateurAuteur(journal);
      if (idAuteur && idAuteur.toLowerCase() === valeurMinuscule) {
        const nomAuteur = this.nomAuteur(journal);
        if (nomAuteur && nomAuteur !== 'Auteur non renseigné') return nomAuteur;
      }

      const idEntite = this.texteValide(journal.entityId ?? journal.entity?.id ?? journal.entity?._id);
      if (idEntite && idEntite.toLowerCase() === valeurMinuscule) {
        const nomEntite = this.valeurEntite(journal);
        if (nomEntite && nomEntite !== 'Élément concerné non renseigné') return nomEntite;
      }

      const idClient = this.texteValide(journal.customerId ?? journal.customer?.id ?? journal.customer?._id);
      if (idClient && idClient.toLowerCase() === valeurMinuscule) {
        const nomClient = this.nomObjetLisible(journal.customer);
        if (nomClient) return nomClient;
      }

      const nomObjet = this.trouverNomObjetPourId(valeur, journal);
      if (nomObjet) return nomObjet;
    }

    const utilisateur = this.utilisateursParId.get(valeurMinuscule);
    if (utilisateur) {
      const nom = this.nomObjetLisible(utilisateur);
      if (nom) return nom;
    }

    if (cleMinuscule.includes('role')) {
      const role = this.libellesRoles.get(valeurMinuscule);
      if (role) return this.normaliserRole(role);
    }

    // Si la valeur est un identifiant technique sans objet associé,
    // ne jamais l'exposer à l'écran : afficher un libellé métier.
    if (this.estIdentifiantTechnique(valeur) || /^\d+$/.test(valeur)) {
      return this.libelleReferenceSansNom(cle);
    }

    // Une valeur textuelle non technique (nom, code métier, référence lisible)
    // peut être affichée sans exposer un UUID ou un ObjectId.
    return valeur;
  }

  private remplacerUuid(
    uuid: string,
    cle: string,
    journal: AuditLog | null
  ): string {
    return this.remplacerReference(uuid, cle, journal);
  }

  identifiant(journal: AuditLog): string {
    // Conservé pour compatibilité avec d'éventuels usages du template.
    // Cet identifiant technique n'est pas affiché dans la modale.
    return journal.id ?? journal._id ?? '';
  }
}