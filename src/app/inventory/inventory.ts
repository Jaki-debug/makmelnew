import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { InventoryService } from '../services/inventory';
import { Inventory as InventoryModel } from '../models/inventory';

// UTILISATEUR CONNECTÉ
interface Utilisateur {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  mustChangePassword: boolean;
}

interface ProfilResponse {
  success: boolean;
  data: Utilisateur;
  message?: string;
}

// AUTEUR D'UNE MODIFICATION
interface AuteurModification {
  id?: string;
  prenom?: string;
  nom?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  roles?: any[];
  email?: string;
  [key: string]: any;
}

// ARTICLE D'INVENTAIRE
interface InventaireAvecAuteur extends InventoryModel {
  modifiePar?: AuteurModification | null;
  modifiedBy?: AuteurModification | string | null;
  modifiedByUser?: AuteurModification | null;
  updatedBy?: AuteurModification | string | null;
  updatedByUser?: AuteurModification | null;
  modifierPar?: AuteurModification | null;
  lastModifiedBy?: AuteurModification | null;
  auteurModification?: AuteurModification | null;
  createdBy?: AuteurModification | null;
  updatedAt?: string;
  updated_at?: string;
}

// RÉPONSE API INVENTAIRE
interface InventaireResponse {
  success?: boolean;
  data: InventaireAvecAuteur[];
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// RÉPONSE API ALERTES ET ROTATION LENTE
interface ListeResponse {
  success?: boolean;
  data?: any[];
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasPreviousPage?: boolean;
    hasNextPage?: boolean;
  };
}

@Component({
  selector: 'app-inventory',
  standalone: false,
  templateUrl: './inventory.html',
  styleUrl: './inventory.css'
})
export class Inventory implements OnInit {

  // UTILISATEUR CONNECTÉ
  utilisateur: Utilisateur | null = null;
  chargementProfil = false;

  // INVENTAIRE
  inventaires: InventaireAvecAuteur[] = [];
  chargement = true;
  erreur = '';

  // PAGINATION
  page = 1;
  limit = 10;

  limitesDisponibles: number[] = [
    5,
    10,
    20,
    50,
    100
  ];

  total = 0;
  totalPages = 1;
  premierElement = 0;
  dernierElement = 0;

  // ALERTES
  chargementAlertes = false;
  erreurAlertes = '';
  nombreAlertes = 0;

  // ROTATION LENTE
  chargementRotationLente = false;
  erreurRotationLente = '';
  nombreRotationLente = 0;
  joursRotationLente = 90;

  constructor(
    private auth: Auth,
    private inventoryService: InventoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // INITIALISATION
  ngOnInit(): void {
    this.utilisateur = this.auth.getUtilisateur();

    if (this.utilisateur) {
      this.chargerDonneesInventaire();
      return;
    }

    this.chargerProfil();
  }

  // CHARGER LE PROFIL DE L'UTILISATEUR CONNECTÉ
  chargerProfil(): void {
    if (!this.auth.getToken()) {
      this.router.navigate(['/login']);
      return;
    }

    this.chargementProfil = true;

    this.auth.me().subscribe({
      next: (response: ProfilResponse) => {
        this.utilisateur = response?.data || null;

        if (this.utilisateur) {
          this.auth.setUtilisateur(this.utilisateur);
        }

        this.chargementProfil = false;

        if (!this.utilisateur) {
          this.erreur = 'Impossible de récupérer votre profil.';
          this.chargement = false;
          this.cdr.detectChanges();
          return;
        }

        this.chargerDonneesInventaire();
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('ERREUR CHARGEMENT PROFIL :', error);

        this.chargementProfil = false;
        this.chargement = false;

        if (error?.status === 401) {
          this.auth.clearSession();
          this.router.navigate(['/login']);
          return;
        }

        this.erreur =
          error?.error?.error?.message ||
          error?.error?.message ||
          'Impossible de récupérer votre profil.';

        this.cdr.detectChanges();
      }
    });
  }

  // CHARGER LES DONNÉES DE LA PAGE
  chargerDonneesInventaire(): void {
    this.chargerInventaire();
    this.chargerAlertes();
    this.chargerRotationLente();
  }

  // NOM COMPLET DE L'UTILISATEUR CONNECTÉ
  get nomComplet(): string {
    if (!this.utilisateur) {
      return 'Utilisateur';
    }

    return (
      `${this.utilisateur.firstName || ''} ` +
      `${this.utilisateur.lastName || ''}`
    ).trim() || 'Utilisateur';
  }

  // INITIALES DE L'UTILISATEUR CONNECTÉ
  get initiales(): string {
    if (!this.utilisateur) {
      return 'U';
    }

    const prenom = this.utilisateur.firstName?.charAt(0) || '';
    const nom = this.utilisateur.lastName?.charAt(0) || '';

    return `${prenom}${nom}`.toUpperCase() || 'U';
  }

  // RÔLE PRINCIPAL DE L'UTILISATEUR CONNECTÉ
  get rolePrincipal(): string {
    const role = this.utilisateur?.roles?.[0];

    if (!role) {
      return 'Utilisateur';
    }

    return this.traduireRole(role);
  }

  // TRADUIRE UN RÔLE
  private traduireRole(role: string): string {
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

    return roles[role] ||
      role
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, lettre => lettre.toUpperCase());
  }

  // VÉRIFIER UNE PERMISSION
  aPermission(permission: string): boolean {
    return this.utilisateur?.permissions?.includes(permission) ?? false;
  }

  // CHARGER L'INVENTAIRE
  chargerInventaire(): void {
    this.chargement = true;
    this.erreur = '';

    this.inventoryService
      .getInventory(this.page, this.limit)
      .subscribe({
        next: (response: InventaireResponse) => {
          const donnees = response?.data || [];

          this.inventaires = donnees.map(item => ({
            ...item,
            modifiePar: this.recupererAuteur(item)
          }));

          this.page = response?.meta?.page ?? this.page;
          this.limit = response?.meta?.limit ?? this.limit;
          this.total = response?.meta?.total ?? donnees.length;

          this.totalPages = Math.max(
            1,
            response?.meta?.totalPages ??
              Math.ceil(this.total / this.limit)
          );

          if (this.page > this.totalPages) {
            this.page = this.totalPages;
            this.chargement = false;
            this.chargerInventaire();
            return;
          }

          this.calculerPagination();
          this.chargement = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('ERREUR CHARGEMENT INVENTAIRE :', error);

          this.inventaires = [];
          this.total = 0;
          this.totalPages = 1;

          this.erreur =
            error?.error?.error?.message ||
            error?.error?.message ||
            'Impossible de récupérer l’inventaire.';

          this.calculerPagination();
          this.chargement = false;
          this.cdr.detectChanges();
        }
      });
  }

  // RÉCUPÉRER L'AUTEUR DE LA MODIFICATION
  private recupererAuteur(
    item: InventaireAvecAuteur
  ): AuteurModification | null {
    const donnees = item as any;

    const candidat =
      donnees.modifiePar ??
      donnees.modifiedByUser ??
      donnees.modifiedBy ??
      donnees.updatedByUser ??
      donnees.updatedBy ??
      donnees.lastModifiedBy ??
      donnees.auteurModification ??
      null;

    if (!candidat || typeof candidat !== 'object') {
      return null;
    }

    const utilisateur =
      candidat.utilisateur ??
      candidat.user ??
      candidat.author ??
      candidat;

    if (!utilisateur || typeof utilisateur !== 'object') {
      return null;
    }

    const prenom =
      utilisateur.prenom ??
      utilisateur.firstName ??
      utilisateur.first_name ??
      '';

    const nom =
      utilisateur.nom ??
      utilisateur.lastName ??
      utilisateur.last_name ??
      '';

    let role =
      utilisateur.rolePrincipal ??
      utilisateur.role ??
      utilisateur.roleName ??
      utilisateur.role_name ??
      '';

    const roles = utilisateur.roles;

    if (!role && Array.isArray(roles) && roles.length > 0) {
      const premierRole = roles[0];

      role = typeof premierRole === 'string'
        ? premierRole
        : premierRole?.name ??
          premierRole?.nom ??
          premierRole?.libelle ??
          premierRole?.label ??
          '';
    }

    return {
      ...utilisateur,
      prenom: String(prenom || ''),
      nom: String(nom || ''),
      role: String(role || '')
    };
  }

  // NOM DE L'AUTEUR D'UNE MODIFICATION
  nomAuteur(item: InventaireAvecAuteur): string {
    const auteur = item.modifiePar;

    if (!auteur) {
      return 'Non renseigné';
    }

    const prenom =
      auteur.prenom ??
      auteur.firstName ??
      auteur.first_name ??
      '';

    const nom =
      auteur.nom ??
      auteur.lastName ??
      auteur.last_name ??
      '';

    return `${prenom} ${nom}`.trim() || 'Nom non renseigné';
  }

  // RÔLE DE L'AUTEUR D'UNE MODIFICATION
  roleAuteur(item: InventaireAvecAuteur): string {
    const role = item.modifiePar?.role;

    return role
      ? this.traduireRole(role)
      : 'Rôle non renseigné';
  }

  // CHARGER LES ALERTES VIA INVENTORY SERVICE
  chargerAlertes(): void {
    this.chargementAlertes = true;
    this.erreurAlertes = '';

    this.inventoryService.getAlerts().subscribe({
      next: (response: ListeResponse) => {
        const donnees = response?.data || [];

        this.nombreAlertes =
          typeof response?.meta?.total === 'number'
            ? response.meta.total
            : donnees.length;

        this.chargementAlertes = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('ERREUR CHARGEMENT ALERTES :', error);

        this.nombreAlertes = 0;
        this.erreurAlertes =
          error?.error?.error?.message ||
          error?.error?.message ||
          'Impossible de récupérer les alertes.';

        this.chargementAlertes = false;
        this.cdr.detectChanges();
      }
    });
  }

  // CHARGER LES ARTICLES À ROTATION LENTE VIA INVENTORY SERVICE
  chargerRotationLente(): void {
    this.chargementRotationLente = true;
    this.erreurRotationLente = '';

    this.inventoryService.getSlowMovingItems().subscribe({
      next: (response: ListeResponse) => {
        const donnees = response?.data || [];

        this.nombreRotationLente =
          typeof response?.meta?.total === 'number'
            ? response.meta.total
            : donnees.length;

        this.chargementRotationLente = false;
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'ERREUR CHARGEMENT ROTATION LENTE :',
          error
        );

        this.nombreRotationLente = 0;
        this.erreurRotationLente =
          error?.error?.error?.message ||
          error?.error?.message ||
          'Impossible de récupérer les articles à rotation lente.';

        this.chargementRotationLente = false;
        this.cdr.detectChanges();
      }
    });
  }

  // NAVIGATION
  voirAlertes(): void {
    this.router.navigate(['/inventory/alerts']);
  }

  voirRotationLente(): void {
    this.router.navigate(['/inventory/slow-moving']);
  }

  voirInventairesPhysiques(): void {
    this.router.navigate(['/inventory/physical-counts-history']);
  }

  // CALCULER LES INFORMATIONS DE PAGINATION
  calculerPagination(): void {
    if (this.total === 0 || this.inventaires.length === 0) {
      this.premierElement = 0;
      this.dernierElement = 0;
      return;
    }

    this.premierElement = (this.page - 1) * this.limit + 1;

    this.dernierElement = Math.min(
      this.premierElement + this.inventaires.length - 1,
      this.total
    );
  }

  // NUMÉROS DES PAGES
  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  // DISPONIBILITÉ DE LA PAGINATION
  get aPagePrecedente(): boolean {
    return this.page > 1 && !this.chargement;
  }

  get aPageSuivante(): boolean {
    return this.page < this.totalPages && !this.chargement;
  }

  // PAGE PRÉCÉDENTE
  pagePrecedente(): void {
    if (!this.aPagePrecedente) {
      return;
    }

    this.page--;
    this.chargerInventaire();
  }

  // PAGE SUIVANTE
  pageSuivante(): void {
    if (!this.aPageSuivante) {
      return;
    }

    this.page++;
    this.chargerInventaire();
  }

  // ALLER À UNE PAGE
  allerAlaPage(numero: number): void {
    if (
      this.chargement ||
      numero < 1 ||
      numero > this.totalPages ||
      numero === this.page
    ) {
      return;
    }

    this.page = numero;
    this.chargerInventaire();
  }

  // CHANGER LE NOMBRE D'ARTICLES PAR PAGE
  changerTaillePage(nouvelleTaille: number): void {
    if (this.chargement) {
      return;
    }

    const taille = Number(nouvelleTaille);

    if (
      !this.limitesDisponibles.includes(taille) ||
      taille === this.limit
    ) {
      return;
    }

    this.limit = taille;
    this.page = 1;

    this.chargerInventaire();
  }

  // ACTUALISER LES DONNÉES
  actualiser(): void {
    if (this.chargement) {
      return;
    }

    this.chargerInventaire();
    this.chargerAlertes();
    this.chargerRotationLente();
  }
}