
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { Subscription, interval } from 'rxjs';

import {
  catchError,
  finalize,
  take,
  timeout
} from 'rxjs/operators';

import {
  NotificationsService,
  NotificationFilters,
  NotificationChannel,
  NotificationStatus
} from '../services/notifications';

interface NotificationMessageObject {
  message?: unknown;
  text?: unknown;
  body?: unknown;
  title?: unknown;
  content?: unknown;
  [key: string]: unknown;
}

type NotificationContent =
  | string
  | number
  | NotificationMessageObject
  | null
  | undefined;

interface NotificationItem {
  id?: string;
  _id?: string;
  notificationId?: string;

  channel?: string;
  status?: string;

  title?: string;
  subject?: string;

  message?: NotificationContent;
  body?: NotificationContent;
  content?: NotificationContent;
  description?: NotificationContent;

  customerId?: string;
  orderId?: string;

  customer?: any;
  order?: any;

  createdAt?: string;
  sentAt?: string;
  updatedAt?: string;
  timestamp?: string;

  errorMessage?: string;
  failureReason?: string;

  [key: string]: any;
}

@Component({
  selector: 'app-admin-notifications',
  standalone: false,
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css'
})
export class AdminNotifications implements OnInit, OnDestroy {

  // ============================================================
  // DONNÉES
  // ============================================================

  notifications: NotificationItem[] = [];

  notificationSelectionnee: NotificationItem | null = null;

  chargement = false;
  erreur = '';
  succes = '';
  detailOuvert = false;

  // ============================================================
  // NOUVELLES NOTIFICATIONS
  // ============================================================

  nouvellesNotifications = 0;

  private surveillanceSubscription: Subscription | null = null;
  private surveillanceRequeteSubscription: Subscription | null = null;

  private idsConnus = new Set<string>();
  private surveillanceInitialisee = false;
  private verificationEnCours = false;

  // Intervalle de vérification : 30 secondes
  private readonly intervalleSurveillance = 30000;

  // ============================================================
  // PAGINATION
  // ============================================================

  page = 1;
  limite = 20;

  readonly limites: number[] = [10, 20, 50, 100];

  total = 0;
  totalConnu = false;
  pageSuivanteDisponible = false;

  // ============================================================
  // FILTRES
  // ============================================================

  canal = '';
  statut = '';
  customerId = '';
  orderId = '';
  dateFrom = '';
  dateTo = '';

  identifiantEnRelance: string | null = null;

  // ============================================================
  // ABONNEMENTS
  // ============================================================

  private listeSubscription: Subscription | null = null;
  private relanceSubscription: Subscription | null = null;

  /** Minimise les requêtes lorsque plusieurs filtres sont changés rapidement. */
  private filtreChangeTimer: ReturnType<typeof setTimeout> | null = null;

  private detruit = false;

  // ============================================================
  // OPTIONS DES FILTRES
  // ============================================================

  readonly canaux: {
    valeur: NotificationChannel;
    libelle: string;
  }[] = [
    { valeur: 'IN_APP', libelle: 'In-app' },
    { valeur: 'EMAIL', libelle: 'E-mail' },
    { valeur: 'SMS', libelle: 'SMS' },
    { valeur: 'WHATSAPP', libelle: 'WhatsApp' },
    { valeur: 'PUSH', libelle: 'Push' }
  ];

  readonly statuts: {
    valeur: NotificationStatus;
    libelle: string;
  }[] = [
    { valeur: 'PENDING', libelle: 'En attente' },
    { valeur: 'SENT', libelle: 'Envoyée' },
    { valeur: 'FAILED', libelle: 'En échec' },
    { valeur: 'CANCELLED', libelle: 'Annulée' }
  ];

  constructor(
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  // ============================================================
  // INITIALISATION
  // ============================================================

  ngOnInit(): void {
    this.chargerNotifications();

    // Première vérification après 30 secondes,
    // puis toutes les 30 secondes.
    this.surveillanceSubscription = interval(
      this.intervalleSurveillance
    ).subscribe(() => {
      this.verifierNouvellesNotifications();
    });
  }

  ngOnDestroy(): void {
    this.detruit = true;

    this.listeSubscription?.unsubscribe();
    this.relanceSubscription?.unsubscribe();

    this.surveillanceSubscription?.unsubscribe();
    this.surveillanceRequeteSubscription?.unsubscribe();

    if (this.filtreChangeTimer !== null) {
      clearTimeout(this.filtreChangeTimer);
      this.filtreChangeTimer = null;
    }
  }

  // ============================================================
  // SURVEILLANCE DES NOUVELLES NOTIFICATIONS
  // ============================================================

  private verifierNouvellesNotifications(): void {
    // Évite que la vérification en arrière-plan ralentisse une recherche manuelle.
    if (this.detruit || this.verificationEnCours || this.chargement) {
      return;
    }

    this.verificationEnCours = true;

    const filtres: NotificationFilters = {
      page: 1,
      limit: 20
    };

    this.surveillanceRequeteSubscription?.unsubscribe();

    this.surveillanceRequeteSubscription =
      this.notificationsService
        .getNotificationsAdmin(filtres)
        .pipe(
          timeout(12000),
          take(1),
          catchError(() => {
            // Une erreur de surveillance ne doit pas
            // effacer les données déjà affichées.
            return [];
          }),
          finalize(() => {
            this.verificationEnCours = false;

            if (!this.detruit) {
              this.cdr.detectChanges();
            }
          })
        )
        .subscribe({
          next: (reponse: any) => {
            if (!reponse || reponse.success === false) {
              return;
            }

            const donnees = reponse?.data ?? reponse;

            const liste = this.extraireListe(
              reponse,
              donnees
            );

            const nouveauxIds = new Set(
              liste
                .map(notification =>
                  this.identifiantNotification(notification)
                )
                .filter(id => !!id)
            );

            // La première réponse sert de référence.
            if (!this.surveillanceInitialisee) {
              this.idsConnus = nouveauxIds;
              this.surveillanceInitialisee = true;
              return;
            }

            // Compter uniquement les identifiants jamais vus.
            let nombreDetecte = 0;

            for (const id of nouveauxIds) {
              if (!this.idsConnus.has(id)) {
                nombreDetecte++;
              }
            }

            if (nombreDetecte > 0) {
              this.nouvellesNotifications += nombreDetecte;
            }

            // Mémoriser les identifiants actuellement présents.
            for (const id of nouveauxIds) {
              this.idsConnus.add(id);
            }

            if (!this.detruit) {
              this.cdr.detectChanges();
            }
          }
        });
  }

  /**
   * Consulte les nouvelles notifications et actualise la liste.
   * Le compteur est remis à zéro après l'action de l'administrateur.
   */
  consulterNouvellesNotifications(): void {
    this.nouvellesNotifications = 0;

    // Actualiser la page 1 pour afficher les plus récentes.
    this.page = 1;
    this.chargerNotifications();

    if (!this.detruit) {
      this.cdr.detectChanges();
    }
  }

  // ============================================================
  // INDICATEURS
  // ============================================================

  get nombreEnvoyees(): number {
    return this.notifications.filter(
      notification =>
        this.normaliserStatut(notification.status) === 'SENT'
    ).length;
  }

  get nombreEnAttente(): number {
    return this.notifications.filter(
      notification =>
        this.normaliserStatut(notification.status) === 'PENDING'
    ).length;
  }

  get nombreEnEchec(): number {
    return this.notifications.filter(
      notification =>
        this.normaliserStatut(notification.status) === 'FAILED'
    ).length;
  }

  get debutResultats(): number {
    return this.notifications.length > 0
      ? (this.page - 1) * this.limite + 1
      : 0;
  }

  get finResultats(): number {
    return (this.page - 1) * this.limite
      + this.notifications.length;
  }

  // ============================================================
  // CHARGEMENT DES NOTIFICATIONS
  // ============================================================

  chargerNotifications(): void {
    // Annule toute recherche automatique encore en attente.
    if (this.filtreChangeTimer !== null) {
      clearTimeout(this.filtreChangeTimer);
      this.filtreChangeTimer = null;
    }

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
    this.succes = '';

    const filtres: NotificationFilters = {
      page: this.page,
      limit: this.limite,

      channel: this.canal
        ? this.canal as NotificationChannel
        : undefined,

      status: this.statut
        ? this.statut as NotificationStatus
        : undefined,

      customerId: this.customerId.trim() || undefined,
      orderId: this.orderId.trim() || undefined,
      dateFrom: this.dateFrom || undefined,
      dateTo: this.dateTo || undefined
    };

    this.cdr.detectChanges();

    this.listeSubscription =
      this.notificationsService
        .getNotificationsAdmin(filtres)
        .pipe(
          timeout(12000),
          take(1),
          finalize(() => {
            this.chargement = false;

            if (!this.detruit) {
              this.cdr.detectChanges();
            }
          })
        )
        .subscribe({
          next: (reponse: any) => {
            if (reponse?.success === false) {
              this.notifications = [];
              this.total = 0;
              this.totalConnu = false;
              this.pageSuivanteDisponible = false;

              this.erreur =
                reponse?.error?.message ??
                reponse?.message ??
                'Impossible de charger les notifications.';

              this.cdr.detectChanges();
              return;
            }

            const donnees = reponse?.data ?? reponse;

            this.notifications =
              this.extraireListe(reponse, donnees);

            const totalApi =
              this.extraireTotal(reponse, donnees);

            this.totalConnu = totalApi !== null;
            this.total = totalApi ?? this.notifications.length;

            this.pageSuivanteDisponible = this.totalConnu
              ? this.page * this.limite < this.total
              : this.notifications.length === this.limite;

            // Initialiser les identifiants connus à partir
            // de la première liste chargée, si possible.
            if (!this.surveillanceInitialisee) {
              for (const notification of this.notifications) {
                const id = this.identifiantNotification(notification);

                if (id) {
                  this.idsConnus.add(id);
                }
              }
            }

            this.cdr.detectChanges();
          },

          error: (error: any) => {
            this.notifications = [];
            this.total = 0;
            this.totalConnu = false;
            this.pageSuivanteDisponible = false;

            this.erreur = this.messageErreur(error);

            this.cdr.detectChanges();
          }
        });
  }

  // ============================================================
  // EXTRACTION DE LA LISTE
  // ============================================================

  private extraireListe(
    reponse: any,
    donnees: any
  ): NotificationItem[] {
    if (Array.isArray(donnees)) {
      return donnees as NotificationItem[];
    }

    const candidats = [
      donnees?.items,
      donnees?.notifications,
      donnees?.results,
      donnees?.records,
      donnees?.data,
      reponse?.items,
      reponse?.notifications
    ];

    for (const candidat of candidats) {
      if (Array.isArray(candidat)) {
        return candidat as NotificationItem[];
      }
    }

    return [];
  }

  // ============================================================
  // EXTRACTION DU TOTAL
  // ============================================================

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

    const valeur = candidats.find(
      item =>
        typeof item === 'number' &&
        Number.isFinite(item) &&
        item >= 0
    );

    return typeof valeur === 'number'
      ? valeur
      : null;
  }

  // ============================================================
  // GESTION DES ERREURS
  // ============================================================

  private messageErreur(error: any): string {
    if (
      error?.name === 'TimeoutError' ||
      error?.name === 'TimeoutErrorImpl'
    ) {
      return 'Le serveur met trop de temps à répondre. Réessayez.';
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
      message.trim()
    ) {
      return message;
    }

    if (error?.status === 0) {
      return 'Serveur inaccessible. Vérifiez votre connexion.';
    }

    if (error?.status === 401) {
      return 'Votre session a expiré. Reconnectez-vous.';
    }

    if (error?.status === 403) {
      return 'Vous ne disposez pas des autorisations nécessaires.';
    }

    if (error?.status === 429) {
      return 'Trop de requêtes. Réessayez plus tard.';
    }

    if (error?.status >= 500) {
      return 'Une erreur serveur est survenue.';
    }

    return 'Impossible de charger les notifications.';
  }

  // ============================================================
  // FILTRES
  // ============================================================

  /**
   * Applique automatiquement les filtres Canal/Statut, sans cliquer sur le bouton.
   * Un court délai regroupe les changements rapides pour éviter plusieurs appels API.
   */
  surFiltreChange(): void {
    this.page = 1;

    if (this.filtreChangeTimer !== null) {
      clearTimeout(this.filtreChangeTimer);
    }

    this.filtreChangeTimer = setTimeout(() => {
      this.filtreChangeTimer = null;

      if (!this.detruit) {
        this.chargerNotifications();
      }
    }, 180);
  }

  appliquerFiltres(): void {
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
    this.chargerNotifications();
  }

  reinitialiserFiltres(): void {
    this.canal = '';
    this.statut = '';
    this.customerId = '';
    this.orderId = '';
    this.dateFrom = '';
    this.dateTo = '';

    this.page = 1;

    this.chargerNotifications();
  }

  // ============================================================
  // PAGINATION
  // ============================================================

  pagePrecedente(): void {
    if (this.page <= 1 || this.chargement) {
      return;
    }

    this.page--;
    this.chargerNotifications();
  }

  pageSuivante(): void {
    if (
      !this.pageSuivanteDisponible ||
      this.chargement
    ) {
      return;
    }

    this.page++;
    this.chargerNotifications();
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

    this.chargerNotifications();
  }

  // ============================================================
  // IDENTIFICATION
  // ============================================================

  identifiantNotification(
    notification: NotificationItem
  ): string {
    return String(
      notification.id ??
      notification._id ??
      notification.notificationId ??
      ''
    );
  }

  // ============================================================
  // LIBELLÉS DES CANAUX
  // ============================================================

  libelleCanal(canal: string | undefined): string {
    const libelles: Record<string, string> = {
      IN_APP: 'In-app',
      EMAIL: 'E-mail',
      SMS: 'SMS',
      WHATSAPP: 'WhatsApp',
      PUSH: 'Push'
    };

    if (!canal) {
      return 'Non renseigné';
    }

    return libelles[canal.toUpperCase()] ?? canal;
  }

  // ============================================================
  // LIBELLÉS ET COULEURS DES STATUTS
  // ============================================================

  libelleStatut(statut: string | undefined): string {
    const libelles: Record<string, string> = {
      PENDING: 'En attente',
      SENT: 'Envoyée',
      FAILED: 'En échec',
      CANCELLED: 'Annulée'
    };

    if (!statut) {
      return 'Non renseigné';
    }

    return libelles[statut.toUpperCase()] ?? statut;
  }

  classeStatut(statut: string | undefined): string {
    switch (this.normaliserStatut(statut)) {
      case 'SENT':
        return 'status-sent';

      case 'PENDING':
        return 'status-pending';

      case 'FAILED':
        return 'status-failed';

      case 'CANCELLED':
        return 'status-cancelled';

      default:
        return 'status-unknown';
    }
  }

  private normaliserStatut(
    statut: string | undefined
  ): string {
    return String(statut ?? '').toUpperCase();
  }

  // ============================================================
  // DESTINATAIRE
  // ============================================================

  destinataire(notification: NotificationItem): string {
    const client = notification.customer;

    if (client && typeof client === 'object') {
      const prenom =
        client.firstName ??
        client.firstname ??
        client.first_name;

      const nom =
        client.lastName ??
        client.lastname ??
        client.last_name;

      const nomComplet = [prenom, nom]
        .filter(
          (partie): partie is string =>
            typeof partie === 'string' && !!partie.trim()
        )
        .join(' ')
        .trim();

      if (nomComplet) {
        return nomComplet;
      }

      if (
        typeof client.name === 'string' &&
        client.name.trim()
      ) {
        return client.name;
      }

      if (
        typeof client.email === 'string' &&
        client.email.trim()
      ) {
        return client.email;
      }
    }

    if (notification.customerId) {
      return `Client : ${notification.customerId}`;
    }

    return 'Destinataire non renseigné';
  }

  // ============================================================
  // NUMÉRO DE COMMANDE
  // ============================================================

  numeroCommande(notification: NotificationItem): string {
    const commande = notification.order;

    if (commande && typeof commande === 'object') {
      const numero =
        commande.orderNumber ??
        commande.reference ??
        commande.number;

      if (
        numero !== null &&
        numero !== undefined &&
        String(numero).trim()
      ) {
        return String(numero);
      }
    }

    return notification.orderId
      ? String(notification.orderId)
      : 'Aucune commande associée';
  }

  // ============================================================
  // TITRE
  // ============================================================

  titreNotification(
    notification: NotificationItem
  ): string {
    const titre =
      notification.title ??
      notification.subject ??
      notification['type'] ??
      notification['eventType'];

    if (typeof titre === 'string' && titre.trim()) {
      return titre.trim();
    }

    return 'Notification';
  }

  // ============================================================
  // CONTENU
  // ============================================================

  messageNotification(
    notification: NotificationItem
  ): string {
    const candidats: unknown[] = [
      notification.message,
      notification.body,
      notification.content,
      notification.description
    ];

    for (const valeur of candidats) {
      if (
        typeof valeur === 'string' &&
        valeur.trim()
      ) {
        return valeur.trim();
      }

      if (typeof valeur === 'number') {
        return String(valeur);
      }

      if (
        valeur !== null &&
        typeof valeur === 'object' &&
        !Array.isArray(valeur)
      ) {
        const objet = valeur as NotificationMessageObject;

        const textes: unknown[] = [
          objet.message,
          objet.text,
          objet.body,
          objet.content
        ];

        for (const texte of textes) {
          if (
            typeof texte === 'string' &&
            texte.trim()
          ) {
            return texte.trim();
          }

          if (typeof texte === 'number') {
            return String(texte);
          }
        }
      }
    }

    return 'Contenu non renseigné';
  }

  // ============================================================
  // DATE
  // ============================================================

  dateLisible(
    notification: NotificationItem
  ): string {
    const valeur =
      notification.createdAt ??
      notification.sentAt ??
      notification.timestamp ??
      notification.updatedAt;

    if (!valeur) {
      return 'Date non renseignée';
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
  // DÉTAILS
  // ============================================================

  ouvrirDetail(
    notification: NotificationItem
  ): void {
    this.notificationSelectionnee = notification;
    this.detailOuvert = true;
  }

  fermerDetail(): void {
    this.detailOuvert = false;
    this.notificationSelectionnee = null;
  }

  // ============================================================
  // RELANCE D'UNE NOTIFICATION EN ÉCHEC
  // ============================================================

  peutRelancer(
    notification: NotificationItem
  ): boolean {
    return this.normaliserStatut(notification.status) === 'FAILED';
  }

  relancerNotification(
    notification: NotificationItem
  ): void {
    if (!this.peutRelancer(notification)) {
      return;
    }

    const id = this.identifiantNotification(notification);

    if (!id || this.identifiantEnRelance !== null) {
      return;
    }

    this.relanceSubscription?.unsubscribe();

    this.erreur = '';
    this.succes = '';
    this.identifiantEnRelance = id;

    this.cdr.detectChanges();

    this.relanceSubscription =
      this.notificationsService
        .relancerNotification(id)
        .pipe(
          timeout(8000),
          take(1),
          finalize(() => {
            this.identifiantEnRelance = null;

            if (!this.detruit) {
              this.cdr.detectChanges();
            }
          })
        )
        .subscribe({
          next: (reponse: any) => {
            if (reponse?.success === false) {
              this.erreur =
                reponse?.error?.message ??
                reponse?.message ??
                'La relance n’a pas pu être effectuée.';

              this.cdr.detectChanges();
              return;
            }

            this.succes =
              'La demande de relance a été transmise.';

            this.chargerNotifications();
          },

          error: (error: any) => {
            this.erreur = this.messageErreur(error);
            this.cdr.detectChanges();
          }
        });
  }
}
