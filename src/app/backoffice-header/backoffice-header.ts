import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  HostListener
} from '@angular/core';

import { NavigationEnd, Router } from '@angular/router';

import {
  EMPTY,
  Subject,
  fromEvent,
  merge,
  timer
} from 'rxjs';

import {
  catchError,
  exhaustMap,
  filter,
  take,
  takeUntil,
  timeout
} from 'rxjs/operators';

import { Auth } from '../services/auth';
import { NotificationsService } from '../services/notifications';

import {
  PreferencesSon,
  TypeSon,
  lirePreferencesSon,
  ecrirePreferencesSon,
  creerContexteAudio,
  jouerSonNotification,
  EVENEMENT_SON_MODIFIE
} from '../services/son-notification-parametrage';

@Component({
  selector: 'app-backoffice-header',
  standalone: false,
  templateUrl: './backoffice-header.html',
  styleUrl: './backoffice-header.css'
})
export class BackofficeHeader implements OnInit, OnDestroy {

  utilisateur: any = null;
  menuProfilOuvert = false;
  nombreNotifications = 0;

  // ============================================================
  // PRÉFÉRENCES SONORES
  // ============================================================

  sonActive = true;
  sonType: TypeSon = 'carillon';
  sonVolume = 70;

  private contexteAudio: AudioContext | null = null;
  private readonly destroy$ = new Subject<void>();

  private readonly intervalleActualisation = 10000;
  private readonly delaiRequete = 12000;
  private readonly routeNotifications = '/admin/notifications';

  private readonly evenementNouvelles = 'notifications:nouvelles';
  private readonly cleIdsVus = 'notifications_ids_vus';

  private idsVus: Set<string> | null = null;
  private derniersIds: string[] = [];

  constructor(
    private auth: Auth,
    private router: Router,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  // ============================================================
  // VISIBILITÉ DU HEADER
  // ============================================================

  private estSurPageConnexion(url: string): boolean {
    const chemin = (url ?? '').split('?')[0].split('#')[0];

    return [
      '/login',
      '/mfa',
      '/client/connexion',
      '/client/inscription'
    ].some(route =>
      chemin === route || chemin.startsWith(route + '/')
    );
  }

  // Getter public accessible depuis le template HTML.
  get afficherHeader(): boolean {
    return !this.estSurPageConnexion(this.router.url);
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  ngOnInit(): void {
    this.chargerPreferencesSon();

    fromEvent(window, EVENEMENT_SON_MODIFIE)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chargerPreferencesSon();
        this.cdr.detectChanges();
      });

    if (this.afficherHeader) {
      this.chargerUtilisateurInitial();
    }

    this.router.events
      .pipe(
        filter(
          (evenement): evenement is NavigationEnd =>
            evenement instanceof NavigationEnd
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(evenement => {
        const url = evenement.urlAfterRedirects;

        this.menuProfilOuvert = false;

        if (this.estSurPageConnexion(url)) {
          this.utilisateur = null;
          this.nombreNotifications = 0;
          this.cdr.detectChanges();
          return;
        }

        if (this.auth.getToken() && !this.utilisateur) {
          this.utilisateur = this.auth.getUtilisateur();

          if (!this.utilisateur) {
            this.chargerUtilisateur();
          }
        }

        if (this.estSurPageNotifications(url)) {
          this.marquerCommeConsulte();
        }

        this.cdr.detectChanges();
      });

    // Actualisation des notifications uniquement avec une session active.
    merge(
      timer(0, this.intervalleActualisation),
      fromEvent(document, 'visibilitychange'),
      fromEvent(window, 'focus')
    )
      .pipe(
        filter(
          () =>
            !document.hidden &&
            !!this.auth.getToken() &&
            this.afficherHeader
        ),

        exhaustMap(() =>
          this.notificationsService
            .getNotificationsAdmin({
              page: 1,
              limit: 100,
              _t: Date.now()
            } as any)
            .pipe(
              timeout(this.delaiRequete),
              take(1),
              catchError((error: any) => {
                if (error?.status === 401) {
                  this.deconnecterSessionExpiree();
                }

                return EMPTY;
              })
            )
        ),

        takeUntil(this.destroy$)
      )
      .subscribe((response: any) => {
        if (!response || response.success === false) {
          return;
        }

        const notifications = this.extraireNotifications(response);

        this.derniersIds = notifications
          .map((notification: any) =>
            this.identifiant(notification)
          )
          .filter((id: string) => !!id);

        if (this.idsVus === null) {
          this.idsVus = this.lireIdsVus();

          // Première consultation : mémoriser l'état initial.
          if (this.idsVus === null) {
            this.idsVus = new Set<string>(this.derniersIds);
            this.ecrireIdsVus(this.idsVus);
            this.nombreNotifications = 0;
            this.cdr.detectChanges();
            return;
          }
        }

        const nouveaux = this.derniersIds.filter(
          id => !this.idsVus!.has(id)
        );

        if (this.estSurPageNotifications(this.router.url)) {
          if (nouveaux.length > 0) {
            this.jouerSon();

            window.dispatchEvent(
              new CustomEvent(this.evenementNouvelles, {
                detail: {
                  nombre: nouveaux.length
                }
              })
            );
          }

          this.marquerCommeConsulte();
          return;
        }

        const avant = this.nombreNotifications;
        this.nombreNotifications = nouveaux.length;

        if (this.nombreNotifications > avant) {
          this.jouerSon();
        }

        this.cdr.detectChanges();
      });
  }

  private chargerUtilisateurInitial(): void {
    if (!this.auth.getToken()) {
      this.utilisateur = null;
      return;
    }

    this.utilisateur = this.auth.getUtilisateur();

    if (!this.utilisateur) {
      this.chargerUtilisateur();
    }
  }

  // ============================================================
  // DESTRUCTION
  // ============================================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    try {
      const fermeture = this.contexteAudio?.close();

      if (fermeture) {
        fermeture.catch(() => {});
      }
    } catch {
      // Audio indisponible.
    }

    this.contexteAudio = null;
  }

  // ============================================================
  // PRÉFÉRENCES SONORES
  // ============================================================

  private chargerPreferencesSon(): void {
    const prefs = lirePreferencesSon();

    this.sonActive = prefs.actif;
    this.sonType = prefs.type;
    this.sonVolume = prefs.volume;
  }

  basculerSon(): void {
    this.chargerPreferencesSon();

    const prefs: PreferencesSon = {
      actif: !this.sonActive,
      type: this.sonType,
      volume: Number(this.sonVolume)
    };

    ecrirePreferencesSon(prefs);

    this.sonActive = prefs.actif;
    this.sonType = prefs.type;
    this.sonVolume = prefs.volume;

    if (this.sonActive) {
      this.debloquerAudio();
      this.jouerSon();
    }

    this.cdr.detectChanges();
  }

  private debloquerAudio(): void {
    try {
      if (
        !this.contexteAudio ||
        this.contexteAudio.state === 'closed'
      ) {
        this.contexteAudio = creerContexteAudio();
      }

      if (
        this.contexteAudio &&
        this.contexteAudio.state === 'suspended'
      ) {
        this.contexteAudio.resume().catch(() => {});
      }
    } catch {
      // Web Audio indisponible.
    }
  }

  private jouerSon(): void {
    this.chargerPreferencesSon();

    if (!this.sonActive || this.sonVolume <= 0) {
      return;
    }

    const ctx = this.contexteAudio;

    if (!ctx || ctx.state === 'closed') {
      return;
    }

    jouerSonNotification(
      ctx,
      this.sonType,
      Number(this.sonVolume)
    );
  }

  // ============================================================
  // EXTRACTION DES NOTIFICATIONS
  // ============================================================

  private extraireNotifications(response: any): any[] {
    const candidats = [
      response?.data?.notifications,
      response?.data?.items,
      response?.data?.results,
      response?.data?.records,
      response?.data?.data?.notifications,
      response?.data?.data?.items,
      response?.data?.data?.results,
      response?.data?.data,
      response?.notifications,
      response?.items,
      response?.results,
      response?.records,
      response?.data
    ];

    return candidats.find(
      (element: any) => Array.isArray(element)
    ) ?? [];
  }

  private identifiant(notification: any): string {
    return String(
      notification?.id ??
      notification?._id ??
      notification?.notificationId ??
      ''
    );
  }

  private lireIdsVus(): Set<string> | null {
    try {
      const valeur = localStorage.getItem(this.cleIdsVus);

      if (valeur) {
        const ids = JSON.parse(valeur);

        if (Array.isArray(ids)) {
          return new Set<string>(ids.map(String));
        }
      }
    } catch {
      // Stockage indisponible ou données invalides.
    }

    return null;
  }

  private ecrireIdsVus(ids: Set<string>): void {
    try {
      localStorage.setItem(
        this.cleIdsVus,
        JSON.stringify(Array.from(ids).slice(-500))
      );
    } catch {
      // Stockage indisponible.
    }
  }

  private marquerCommeConsulte(): void {
    if (this.idsVus === null) {
      this.idsVus =
        this.lireIdsVus() ?? new Set<string>();
    }

    this.derniersIds.forEach(id => this.idsVus!.add(id));

    this.ecrireIdsVus(this.idsVus);

    this.nombreNotifications = 0;
    this.cdr.detectChanges();
  }

  private estSurPageNotifications(url: string): boolean {
    const chemin = (url ?? '').split('?')[0].split('#')[0];

    return chemin === this.routeNotifications ||
      chemin.startsWith(this.routeNotifications + '/');
  }

  // ============================================================
  // OUVERTURE DES NOTIFICATIONS
  // ============================================================

  ouvrirNotifications(): void {
    this.menuProfilOuvert = false;
    this.marquerCommeConsulte();

    this.router.navigate([this.routeNotifications]);
  }

  // ============================================================
  // UTILISATEUR CONNECTÉ
  // ============================================================

  chargerUtilisateur(): void {
    if (!this.auth.getToken() || !this.afficherHeader) {
      return;
    }

    this.auth.me()
      .pipe(
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          const utilisateur = response?.data ?? response;

          if (utilisateur) {
            this.utilisateur = utilisateur;
            this.auth.setUtilisateur(utilisateur);
            this.cdr.detectChanges();
          }
        },

        error: (error: any) => {
          if (error?.status === 401) {
            this.deconnecterSessionExpiree();
          }
        }
      });
  }

  private deconnecterSessionExpiree(): void {
    this.auth.clearSession();

    this.utilisateur = null;
    this.nombreNotifications = 0;

    this.cdr.detectChanges();

    if (this.afficherHeader) {
      this.router.navigate(['/login']);
    }
  }

  // ============================================================
  // INFORMATIONS UTILISATEUR
  // ============================================================

  get nomComplet(): string {
    if (!this.utilisateur) {
      return 'Utilisateur';
    }

    const prenom = this.utilisateur.firstName || '';
    const nom = this.utilisateur.lastName || '';

    return `${prenom} ${nom}`.trim() || 'Utilisateur';
  }

  get initiales(): string {
    if (!this.utilisateur) {
      return 'U';
    }

    const prenom = this.utilisateur.firstName?.charAt(0) || '';
    const nom = this.utilisateur.lastName?.charAt(0) || '';

    return `${prenom}${nom}`.toUpperCase() || 'U';
  }

  get rolePrincipal(): string {
    const roles = this.utilisateur?.roles;

    if (!Array.isArray(roles) || roles.length === 0) {
      return 'Utilisateur';
    }

    return this.formaterRole(roles[0]);
  }

  private formaterRole(role: any): string {
    const code =
      typeof role === 'string'
        ? role
        : String(
            role?.name ??
            role?.code ??
            role?.role ??
            ''
          );

    if (!code.trim()) {
      return 'Utilisateur';
    }

    const roles: { [key: string]: string } = {
      SUPER_ADMIN: 'Super administrateur',
      SUPER_ADMINISTRATEUR: 'Super administrateur',
      DIRECTION: 'Direction',
      GESTIONNAIRE_BOUTIQUE: 'Gestionnaire boutique',
      GESTIONNAIRE_RESTAURANT: 'Gestionnaire restaurant',
      GESTIONNAIRE_RESIDENCE: 'Gestionnaire résidence',
      COMPTABLE: 'Comptable',
      MARKETING: 'Marketing',
      CLIENT: 'Client'
    };

    return (
      roles[code] ||
      code
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(
          /^\\w/,
          (lettre: string) => lettre.toUpperCase()
        )
    );
  }

  // ============================================================
  // MENU PROFIL
  // ============================================================

  toggleMenuProfil(): void {
    this.menuProfilOuvert = !this.menuProfilOuvert;
  }

  fermerMenuProfil(): void {
    this.menuProfilOuvert = false;
  }

  @HostListener('document:click', ['$event'])
  surClicDocument(evenement: MouseEvent): void {
    this.debloquerAudio();

    if (!this.menuProfilOuvert) {
      return;
    }

    const cible = evenement.target as Node | null;

    if (
      cible &&
      !this.elementRef.nativeElement.contains(cible)
    ) {
      this.menuProfilOuvert = false;
    }
  }

  @HostListener('document:keydown.escape')
  surEchap(): void {
    if (this.menuProfilOuvert) {
      this.menuProfilOuvert = false;
    }
  }

  @HostListener('document:pointerdown')
  @HostListener('document:keydown')
  @HostListener('document:touchstart')
  debloquerAudioSurInteraction(): void {
    this.debloquerAudio();
  }

  monProfil(): void {
    this.menuProfilOuvert = false;
    this.router.navigate(['/profil']);
  }

  parametres(): void {
    this.menuProfilOuvert = false;
    this.router.navigate(['/parametres']);
  }

  // ============================================================
  // DÉCONNEXION
  // ============================================================

  deconnexion(): void {
    this.menuProfilOuvert = false;

    this.auth.logout()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.auth.clearSession();
          this.utilisateur = null;
          this.nombreNotifications = 0;
          this.router.navigate(['/login']);
        },

        error: () => {
          this.auth.clearSession();
          this.utilisateur = null;
          this.nombreNotifications = 0;
          this.router.navigate(['/login']);
        }
      });
  }
}