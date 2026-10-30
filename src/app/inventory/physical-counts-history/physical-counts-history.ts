import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Attributs du véritable utilisateur associé à l'action
interface AuteurInventaire {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];

  // Compatibilité si le backend renvoie un rôle unique
  role?: string;
}

interface PhysicalCount {
  id: string;
  reason: string;
  createdAt: string;

  // Auteur réel de l'inventaire renvoyé par l'API
  createdBy?: string | AuteurInventaire;
  createdByName?: string;
  createdByRole?: string;

  // Champs alternatifs possibles selon la réponse backend
  creator?: string | AuteurInventaire;
  user?: string | AuteurInventaire;

  totalItems: number;
  totalDifferences: number;
  status?: string;

  [key: string]: any;
}

interface PhysicalCountsResponse {
  success: boolean;
  data: any[];
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

@Component({
  selector: 'app-physical-counts-history',
  standalone: false,
  templateUrl: './physical-counts-history.html',
  styleUrl: './physical-counts-history.css'
})
export class PhysicalCountsHistory implements OnInit {

  inventories: PhysicalCount[] = [];

  chargement = false;
  erreur = '';

  page = 1;
  limit = 10;
  totalInventaires = 0;
  totalPages = 1;

  private readonly urlInventaires =
    'https://api.commecheznous.fr/api/v1/admin/inventory/counts';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerHistorique();
  }

  // =========================================
  // VÉRIFIER LES OBJETS
  // =========================================

  private estObjet(value: any): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  private premiereValeur(...valeurs: any[]): any {
    return valeurs.find(value =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
    );
  }

  // =========================================
  // RÉCUPÉRER L'AUTEUR RÉEL DE L'INVENTAIRE
  // =========================================

  private obtenirAuteur(
    item: PhysicalCount
  ): AuteurInventaire | null {
    const donnees: any = item;

    const candidats = [
      donnees.createdBy,
      donnees.creator,
      donnees.createdByUser,
      donnees.performedBy,
      donnees.author,
      donnees.user,
      donnees.utilisateur
    ];

    const objets = candidats.filter(
      candidat => this.estObjet(candidat)
    ) as AuteurInventaire[];

    if (objets.length === 0) {
      return null;
    }

    // Priorité à l'objet contenant les vrais attributs User.
    const auteurComplet = objets.find(auteur =>
      auteur.firstName !== undefined ||
      auteur.lastName !== undefined ||
      Array.isArray(auteur.roles)
    );

    return auteurComplet || objets[0];
  }

  // =========================================
  // EXTRAIRE LE PRÉNOM ET LE NOM
  // =========================================

  nomAuteur(item: PhysicalCount): string {
    const auteur = this.obtenirAuteur(item);

    const prenom = String(
      auteur?.firstName || ''
    ).trim();

    const nom = String(
      auteur?.lastName || ''
    ).trim();

    const nomComplet = `${prenom} ${nom}`.trim();

    if (nomComplet) {
      return nomComplet;
    }

    // Utiliser un nom déjà fourni par le backend,
    // sans afficher un identifiant technique comme un nom.
    const donnees: any = item;

    const nomBackend = this.premiereValeur(
      donnees.createdByName,
      donnees.creatorName,
      donnees.authorName,
      donnees.performedByName
    );

    if (nomBackend) {
      return String(nomBackend);
    }

    // Si createdBy est une chaîne contenant un nom lisible,
    // on peut l'afficher. Un identifiant seul n'est pas un nom.
    if (typeof item.createdBy === 'string') {
      const valeur = item.createdBy.trim();

      if (
        valeur &&
        !this.ressembleAUnIdentifiant(valeur)
      ) {
        return valeur;
      }
    }

    return 'Auteur non renseigné';
  }

  private ressembleAUnIdentifiant(
    valeur: string
  ): boolean {
    return (
      /^[a-f\d]{24}$/i.test(valeur) ||
      /^[\da-f]{8}-[\da-f-]{27,}$/i.test(valeur)
    );
  }

  // =========================================
  // EXTRAIRE LE OU LES RÔLES DU VRAI AUTEUR
  // =========================================

  roleAuteur(item: PhysicalCount): string {
    const auteur = this.obtenirAuteur(item);

    // Dans l'interface User, le rôle est un tableau :
    // roles: ['SUPER_ADMIN'], par exemple.
    if (
      auteur &&
      Array.isArray(auteur.roles) &&
      auteur.roles.length > 0
    ) {
      const roles = auteur.roles
        .filter((role): role is string =>
          typeof role === 'string' && role.trim() !== ''
        )
        .map(role => this.formaterRole(role));

      if (roles.length > 0) {
        return [...new Set(roles)].join(', ');
      }
    }

    // Compatibilité si le backend expose un seul rôle.
    const donnees: any = item;

    const roleDirect = this.premiereValeur(
      auteur?.role,
      donnees.createdByRole,
      donnees.creatorRole,
      donnees.authorRole,
      donnees.performedByRole
    );

    if (typeof roleDirect === 'string') {
      return this.formaterRole(roleDirect);
    }

    return 'Rôle non renseigné';
  }

  private formaterRole(role: string): string {
    const roles: Record<string, string> = {
      ADMIN: 'Administrateur',
      ADMINISTRATOR: 'Administrateur',
      SUPER_ADMIN: 'Super administrateur',
      SUPERADMIN: 'Super administrateur',
      GESTIONNAIRE: 'Gestionnaire',
      MANAGER: 'Gestionnaire',
      STOCK_MANAGER: 'Gestionnaire de stock',
      INVENTORY_MANAGER: 'Gestionnaire de stock',
      EMPLOYEE: 'Employé',
      USER: 'Utilisateur',
      CASHIER: 'Caissier',
      SUPERVISOR: 'Superviseur'
    };

    const cle = role.trim().toUpperCase();

    return roles[cle] ||
      role
        .replace(/[_-]+/g, ' ')
        .toLowerCase()
        .replace(/\b[a-z]/g, lettre =>
          lettre.toUpperCase()
        );
  }

  // =========================================
  // INITIALES DE L'AUTEUR
  // =========================================

  initialesAuteur(item: PhysicalCount): string {
    const auteur = this.obtenirAuteur(item);

    const prenom = String(
      auteur?.firstName || ''
    ).trim();

    const nom = String(
      auteur?.lastName || ''
    ).trim();

    const initiales =
      `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();

    if (initiales) {
      return initiales;
    }

    const nomComplet = this.nomAuteur(item);

    if (nomComplet !== 'Auteur non renseigné') {
      return nomComplet
        .split(/\s+/)
        .slice(0, 2)
        .map(partie => partie.charAt(0))
        .join('')
        .toUpperCase();
    }

    return '?';
  }

  // =========================================
  // CHARGER L'HISTORIQUE ET LA PAGINATION
  // =========================================

  chargerHistorique(): void {
    if (this.chargement) {
      return;
    }

    this.chargement = true;
    this.erreur = '';

    this.http
      .get<PhysicalCountsResponse>(
        `${this.urlInventaires}?page=${this.page}&limit=${this.limit}`
      )
      .subscribe({
        next: (response) => {
          console.log(
            'HISTORIQUE INVENTAIRES :',
            response
          );

          if (
            !response ||
            response.success !== true
          ) {
            this.inventories = [];
            this.totalInventaires = 0;
            this.totalPages = 1;

            this.erreur =
              response?.message ||
              'Impossible de charger l’historique des inventaires.';

            this.chargement = false;
            this.cdr.detectChanges();
            return;
          }

          const donnees = Array.isArray(response.data)
            ? response.data
            : [];

          // Diagnostic pour voir les attributs réels reçus
          // du backend pour l'auteur de chaque action.
          if (donnees.length > 0) {
            console.log(
              'PREMIER INVENTAIRE COMPLET :',
              donnees[0]
            );

            console.log(
              'AUTEUR RÉEL RENVOYÉ PAR LE BACKEND :',
              donnees[0]?.createdBy
            );

            console.log(
              'CHAMPS UTILISATEUR :',
              {
                id: donnees[0]?.createdBy?.id,
                firstName:
                  donnees[0]?.createdBy?.firstName,
                lastName:
                  donnees[0]?.createdBy?.lastName,
                roles:
                  donnees[0]?.createdBy?.roles
              }
            );
          }

          this.inventories = donnees
            .map((item: any): PhysicalCount => {
              const auteur = this.obtenirAuteur(item);

              const id = this.premiereValeur(
                item.id,
                item._id,
                item.inventoryId,
                item.countId
              );

              return {
                ...item,

                id: id !== undefined
                  ? String(id)
                  : '',

                reason: this.premiereValeur(
                  item.reason,
                  item.motif,
                  item.description
                ) || '—',

                createdAt: this.premiereValeur(
                  item.createdAt,
                  item.created_at,
                  item.date
                ) || '',

                createdBy:
                  auteur ||
                  item.createdBy ||
                  undefined,

                createdByName:
                  item.createdByName ||
                  item.creatorName ||
                  item.authorName ||
                  '',

                createdByRole:
                  item.createdByRole ||
                  item.creatorRole ||
                  item.authorRole ||
                  '',

                creator:
                  item.creator ||
                  undefined,

                user:
                  item.user ||
                  undefined,

                totalItems: Number(
                  this.premiereValeur(
                    item.totalItems,
                    item.itemsCount,
                    item.totalArticles,
                    item.items?.length
                  ) ?? 0
                ),

                totalDifferences: Number(
                  this.premiereValeur(
                    item.totalDifferences,
                    item.differencesCount
                  ) ?? 0
                ),

                status: this.premiereValeur(
                  item.status,
                  item.statut
                ) || 'COMPLETED'
              };
            })
            .filter(
              (item: PhysicalCount) => !!item.id
            );

          // Métadonnées de pagination du backend
          const meta = response.meta;

          this.totalInventaires = Number(
            meta?.total ?? this.inventories.length
          );

          this.totalPages = Number(
            meta?.totalPages ??
            Math.max(
              1,
              Math.ceil(
                this.totalInventaires / this.limit
              )
            )
          );

          this.totalPages = Math.max(
            1,
            Number.isFinite(this.totalPages)
              ? this.totalPages
              : 1
          );

          // Si la page demandée n'existe plus,
          // revenir à la dernière page valide.
          if (this.page > this.totalPages) {
            this.page = this.totalPages;
            this.chargement = false;
            this.chargerHistorique();
            return;
          }

          this.chargement = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'ERREUR HISTORIQUE INVENTAIRES :',
            error
          );

          this.inventories = [];

          this.erreur =
            error?.error?.error?.message ||
            error?.error?.message ||
            error?.message ||
            'Impossible de charger l’historique des inventaires.';

          this.chargement = false;

          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: this.erreur,
            confirmButtonText: 'OK'
          });

          this.cdr.detectChanges();
        }
      });
  }

  // =========================================
  // PAGES VISIBLES
  // =========================================

  get pagesVisibles(): number[] {
    const pages: number[] = [];

    const debut = Math.max(
      1,
      this.page - 2
    );

    const fin = Math.min(
      this.totalPages,
      this.page + 2
    );

    for (
      let numero = debut;
      numero <= fin;
      numero++
    ) {
      pages.push(numero);
    }

    return pages;
  }

  allerPage(numero: number): void {
    if (
      this.chargement ||
      numero < 1 ||
      numero > this.totalPages ||
      numero === this.page
    ) {
      return;
    }

    this.page = numero;
    this.chargerHistorique();
  }

  pagePrecedente(): void {
    if (this.page > 1) {
      this.allerPage(this.page - 1);
    }
  }

  pageSuivante(): void {
    if (this.page < this.totalPages) {
      this.allerPage(this.page + 1);
    }
  }

  changerLimite(
    valeur: string | number
  ): void {
    const nouvelleLimite = Number(valeur);

    if (
      !Number.isFinite(nouvelleLimite) ||
      nouvelleLimite < 1 ||
      nouvelleLimite === this.limit
    ) {
      return;
    }

    this.limit = nouvelleLimite;
    this.page = 1;
    this.chargerHistorique();
  }

  trackByInventoryId(
    index: number,
    inventory: PhysicalCount
  ): string {
    return inventory.id;
  }

  // =========================================
  // ACTUALISER
  // =========================================

  actualiser(): void {
    if (this.chargement) {
      return;
    }

    this.chargerHistorique();
  }

  // =========================================
  // NOUVEL INVENTAIRE
  // =========================================

  nouvelInventaire(): void {
    this.router.navigate([
      '/inventory/physical-counts/ajouter'
    ]);
  }

  // =========================================
  // DÉTAIL
  // =========================================

  voirDetail(id: string): void {
    if (!id) {
      return;
    }

    this.router.navigate([
      '/inventory/physical-counts-history',
      id
    ]);
  }

  // =========================================
  // SUPPRIMER UN INVENTAIRE
  // =========================================

  supprimerInventaire(id: string): void {
    if (!id || this.chargement) {
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Supprimer cet inventaire ?',
      text: 'Cette action est irréversible.',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#c62828',
      cancelButtonColor: '#6b7280'
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.chargement = true;

      this.http
        .delete(
          `${this.urlInventaires}/${encodeURIComponent(id)}`
        )
        .subscribe({
          next: () => {
            if (
              this.inventories.length === 1 &&
              this.page > 1
            ) {
              this.page--;
            }

            this.chargement = false;

            Swal.fire({
              icon: 'success',
              title: 'Supprimé',
              text: 'L’inventaire a été supprimé avec succès.',
              confirmButtonText: 'OK'
            }).then(() => {
              this.chargerHistorique();
            });
          },

          error: (error) => {
            console.error(
              'ERREUR SUPPRESSION INVENTAIRE :',
              error
            );

            this.chargement = false;

            const message =
              error?.error?.error?.message ||
              error?.error?.message ||
              error?.message ||
              'Impossible de supprimer cet inventaire.';

            Swal.fire({
              icon: 'error',
              title: 'Suppression impossible',
              text: message,
              confirmButtonText: 'OK'
            });

            this.cdr.detectChanges();
          }
        });
    });
  }

  // =========================================
  // STATUT
  // =========================================

  estTermine(status?: string): boolean {
    return [
      'COMPLETED',
      'ENREGISTRÉ',
      'TERMINE',
      'TERMINÉ'
    ].includes(
      (status || '').toUpperCase()
    );
  }

  getStatutLabel(status?: string): string {
    if (this.estTermine(status)) {
      return 'Terminé';
    }

    return status || 'Terminé';
  }

  // =========================================
  // FORMATER LA DATE
  // =========================================

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return date;
    }

    return value.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}