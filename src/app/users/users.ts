
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  takeUntil
} from 'rxjs/operators';

import { User, UserService } from '../services/user';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-users',
  standalone: false,
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit, OnDestroy {
  private auth = inject(Auth);

  private destroy$ = new Subject<void>();
  private rechercheSubject = new Subject<string>();
  private chargementSubject = new Subject<void>();

  utilisateurs: User[] = [];

  page = 1;
  limit = 5;
  total = 0;
  totalPages = 1;

  recherche = '';
  statut = '';

  chargement = false;
  erreur = '';

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.hasPermission('users.read')) {
      this.erreur =
        'Vous n’avez pas la permission de consulter les utilisateurs.';
      return;
    }

    // Recherche automatique avec un délai de 300 ms.
    this.rechercheSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((valeur) => {
      this.recherche = valeur;
      this.page = 1;
      this.chargerUtilisateurs();
    });

    // Annule la requête précédente lorsqu'une nouvelle est lancée.
    this.chargementSubject.pipe(
      switchMap(() => {
        this.chargement = true;
        this.erreur = '';

        return this.userService.getUsers(
          this.page,
          this.limit,
          this.recherche.trim(),
          this.statut
        ).pipe(
          catchError((error) => {
            console.error(
              'Erreur chargement utilisateurs :',
              error
            );

            this.utilisateurs = [];
            this.total = 0;
            this.totalPages = 1;

            if (error.status === 403) {
              this.erreur =
                'Vous n’avez pas les permissions nécessaires.';
            } else if (error.status === 401) {
              this.erreur =
                'Votre session a expiré. Veuillez vous reconnecter.';
            } else {
              this.erreur =
                'Impossible de récupérer les utilisateurs.';
            }

            return of(null);
          }),
          finalize(() => {
            this.chargement = false;
            this.cdr.markForCheck();
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      if (!response) {
        return;
      }

      this.utilisateurs = response.data || [];

      this.total = response.meta?.total ?? 0;
      this.limit = response.meta?.limit ?? this.limit;

      this.totalPages = Math.max(
        1,
        response.meta?.totalPages ??
          Math.ceil(this.total / this.limit)
      );

      this.page = response.meta?.page ?? this.page;

      // Si la page n'existe plus, revenir à une page valide.
      if (this.page > this.totalPages) {
        this.page = this.totalPages;
        this.chargerUtilisateurs();
        return;
      }

      this.cdr.markForCheck();
    });

    this.chargerUtilisateurs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.rechercheSubject.complete();
    this.chargementSubject.complete();
  }

  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  // =========================================
  // PAGINATION
  // =========================================

  get pagesVisibles(): number[] {
    if (this.totalPages <= 0) {
      return [];
    }

    const nombre = Math.min(5, this.totalPages);
    let debut = Math.max(1, this.page - 2);
    let fin = debut + nombre - 1;

    if (fin > this.totalPages) {
      fin = this.totalPages;
      debut = Math.max(1, fin - nombre + 1);
    }

    return Array.from(
      { length: fin - debut + 1 },
      (_, index) => debut + index
    );
  }

  get premierElementAffiche(): number {
    return this.total === 0
      ? 0
      : (this.page - 1) * this.limit + 1;
  }

  get dernierElementAffiche(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  chargerUtilisateurs(): void {
    if (!this.hasPermission('users.read')) {
      return;
    }

    this.chargementSubject.next();
  }

  changerLimite(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nouvelleLimite = Number(select.value);

    if (![5, 10, 15, 20, 25, 50].includes(nouvelleLimite)) {
      return;
    }

    this.limit = nouvelleLimite;
    this.page = 1;
    this.chargerUtilisateurs();
  }

  allerPage(numero: number): void {
    if (
      numero < 1 ||
      numero > this.totalPages ||
      numero === this.page ||
      this.chargement
    ) {
      return;
    }

    this.page = numero;
    this.chargerUtilisateurs();
  }

  pagePrecedente(): void {
    this.allerPage(this.page - 1);
  }

  pageSuivante(): void {
    this.allerPage(this.page + 1);
  }

  // =========================================
  // RECHERCHE ET FILTRES
  // =========================================

  rechercher(): void {
    this.rechercheSubject.next(this.recherche.trim());
  }

  filtrerStatut(): void {
    this.page = 1;
    this.chargerUtilisateurs();
  }

  effacerRecherche(): void {
    this.recherche = '';
    this.page = 1;

    // Annule la recherche différée et recharge immédiatement.
    this.rechercheSubject.next('');

    if (!this.recherche.trim()) {
      this.chargerUtilisateurs();
    }
  }

  // =========================================
  // FORMATAGE
  // =========================================

  statutLibelle(statut: string): string {
    switch (statut) {
      case 'ACTIVE':
        return 'Actif';
      case 'INACTIVE':
        return 'Inactif';
      case 'SUSPENDED':
        return 'Suspendu';
      default:
        return statut;
    }
  }

  formaterDate(date: string | null): string {
    if (!date) {
      return 'Jamais';
    }

    return new Date(date).toLocaleString('fr-FR');
  }

  getRoles(utilisateur: User): string {
    if (!utilisateur.roles || utilisateur.roles.length === 0) {
      return 'Aucun rôle';
    }

    return utilisateur.roles.join(', ');
  }

  estActif(utilisateur: User): boolean {
    return utilisateur.status === 'ACTIVE';
  }

  // =========================================
  // NAVIGATION
  // =========================================

  ajouterUtilisateur(): void {
    if (!this.hasPermission('users.create')) {
      return;
    }

    this.router.navigate(['/users/ajouter']);
  }

  voirUtilisateur(utilisateur: User): void {
    if (!this.hasPermission('users.read')) {
      return;
    }

    this.router.navigate(['/users', utilisateur.id]);
  }

  modifierUtilisateur(utilisateur: User): void {
    if (!this.hasPermission('users.update')) {
      return;
    }

    this.router.navigate([
      '/users',
      utilisateur.id,
      'modifier'
    ]);
  }

  // =========================================
  // DÉSACTIVER UN UTILISATEUR
  // =========================================

  desactiverUtilisateur(utilisateur: User): void {
    if (!this.hasPermission('users.update')) {
      this.erreur =
        'Vous n’avez pas la permission de modifier cet utilisateur.';
      return;
    }

    if (!confirm('Voulez-vous vraiment désactiver cet utilisateur ?')) {
      return;
    }

    this.userService.deactivateUser(utilisateur.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.chargerUtilisateurs();
      },
      error: (error) => {
        console.error(
          'Erreur désactivation utilisateur :',
          error
        );

        if (error.status === 403) {
          this.erreur =
            'Vous n’avez pas les permissions nécessaires.';
        } else if (error.status === 401) {
          this.erreur =
            'Votre session a expiré. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          this.erreur =
            error?.error?.error?.message ||
            'Impossible de désactiver cet utilisateur.';
        } else {
          this.erreur =
            'Une erreur est survenue lors de la désactivation.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  // =========================================
  // ACTIVER UN UTILISATEUR
  // =========================================

  activerUtilisateur(utilisateur: User): void {
    if (!this.hasPermission('users.update')) {
      this.erreur =
        'Vous n’avez pas la permission de modifier cet utilisateur.';
      return;
    }

    if (!confirm('Voulez-vous vraiment réactiver cet utilisateur ?')) {
      return;
    }

    this.userService.activateUser(utilisateur.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.chargerUtilisateurs();
      },
      error: (error) => {
        console.error(
          'Erreur activation utilisateur :',
          error
        );

        if (error.status === 403) {
          this.erreur =
            'Vous n’avez pas les permissions nécessaires.';
        } else if (error.status === 401) {
          this.erreur =
            'Votre session a expiré. Veuillez vous reconnecter.';
        } else if (error.status === 400) {
          this.erreur =
            error?.error?.error?.message ||
            'Impossible de réactiver cet utilisateur.';
        } else {
          this.erreur =
            'Une erreur est survenue lors de la réactivation.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  // =========================================
  // RÉINITIALISER LE MOT DE PASSE
  // =========================================

  resetMotDePasse(utilisateur: User): void {
    if (!this.hasPermission('users.reset_password')) {
      this.erreur =
        'Vous n’avez pas la permission de réinitialiser le mot de passe.';
      return;
    }

    if (
      !confirm(
        'Voulez-vous vraiment réinitialiser le mot de passe de cet utilisateur ?'
      )
    ) {
      return;
    }

    this.erreur = '';

    this.userService.resetPassword(utilisateur.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const motDePasseTemporaire =
          response?.data?.temporaryPassword ||
          response?.temporaryPassword ||
          '';

        if (motDePasseTemporaire) {
          alert('Mot de passe temporaire : ' + motDePasseTemporaire);
        } else {
          alert(
            response?.message ||
            'Mot de passe réinitialisé avec succès.'
          );
        }

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error(
          'Erreur réinitialisation mot de passe :',
          error
        );

        if (error.status === 400) {
          this.erreur =
            error?.error?.error?.message ||
            'Impossible de réinitialiser le mot de passe.';
        } else if (error.status === 401) {
          this.erreur =
            'Votre session a expiré. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          this.erreur =
            'Vous n’avez pas les permissions nécessaires.';
        } else if (error.status === 404) {
          this.erreur = 'Utilisateur introuvable.';
        } else if (error.status === 429) {
          this.erreur = 'Trop de requêtes. Veuillez patienter.';
        } else {
          this.erreur =
            'Une erreur est survenue lors de la réinitialisation du mot de passe.';
        }

        this.cdr.markForCheck();
      }
    });
  }

  // =========================================
  // SUPPRIMER UN UTILISATEUR
  // =========================================

  supprimerUtilisateur(utilisateur: User): void {
    if (!this.hasPermission('users.delete')) {
      this.erreur =
        'Vous n’avez pas la permission de supprimer cet utilisateur.';
      return;
    }

    if (
      !confirm(
        'Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    this.erreur = '';

    this.userService.deleteUser(utilisateur.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.chargerUtilisateurs();
      },
      error: (error) => {
        console.error(
          'Erreur suppression utilisateur :',
          error
        );

        if (error.status === 400) {
          this.erreur =
            error?.error?.error?.message ||
            'Impossible de supprimer cet utilisateur.';
        } else if (error.status === 401) {
          this.erreur =
            'Votre session a expiré. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          this.erreur =
            'Vous n’avez pas les permissions nécessaires.';
        } else if (error.status === 404) {
          this.erreur = 'Utilisateur introuvable.';
        } else if (error.status === 429) {
          this.erreur = 'Trop de requêtes. Veuillez patienter.';
        } else {
          this.erreur =
            'Une erreur est survenue lors de la suppression.';
        }

        this.cdr.markForCheck();
      }
    });
  }
}
