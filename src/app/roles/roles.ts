
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';

import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil
} from 'rxjs/operators';

import {
  RoleService,
  Role,
  RoleListResponse
} from '../services/role';

import { Auth } from '../services/auth';

interface RechercheParams {
  page: number;
  limite: number;
  recherche: string;
}

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.html',
  styleUrls: ['./roles.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Roles implements OnInit, OnDestroy {
  roles: Role[] = [];

  page = 1;
  limite = 10;
  totalRoles = 0;
  totalPages = 1;

  termeRecherche = '';
  recherche = '';

  chargement = false;
  messageErreur = '';

  private recherche$ = new Subject<string>();
  private requetes$ = new Subject<RechercheParams>();
  private destroy$ = new Subject<void>();

  constructor(
    private roleService: RoleService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Recherche avec temporisation.
    this.recherche$
      .pipe(
        map((valeur) => valeur.trim()),
        debounceTime(250),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((valeur) => {
        if (valeur === this.recherche) {
          return;
        }

        this.recherche = valeur;
        this.page = 1;
        this.chargerRoles();
      });

    // Requêtes HTTP : les plus récentes remplacent les précédentes.
    this.requetes$
      .pipe(
        switchMap((params) => {
          this.chargement = true;
          this.messageErreur = '';
          this.cdr.markForCheck();

          return this.roleService
            .getRoles(
              params.page,
              params.limite,
              params.recherche
            )
            .pipe(
              catchError((erreur) => {
                console.error(
                  'Erreur lors du chargement des rôles :',
                  erreur
                );

                return of(null);
              })
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((reponse: RoleListResponse | null) => {
        this.chargement = false;

        if (!reponse || !reponse.success) {
          this.roles = [];
          this.totalRoles = 0;
          this.totalPages = 1;

          this.messageErreur =
            reponse?.message ||
            'Impossible de charger les rôles. Veuillez réessayer.';

          this.cdr.markForCheck();
          return;
        }

        this.roles = reponse.data ?? [];
        this.totalRoles = reponse.meta.total;
        this.totalPages = Math.max(
          1,
          reponse.meta.totalPages
        );

        // Retour à la dernière page si la page courante n'existe plus.
        if (this.page > this.totalPages) {
          this.page = this.totalPages;
          this.chargerRoles();
          return;
        }

        this.cdr.markForCheck();
      });

    this.chargerRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.recherche$.complete();
    this.requetes$.complete();
  }

  // Vérification des permissions.
  hasPermission(permission: string): boolean {
    return this.auth.hasPermission(permission);
  }

  // Modifier uniquement si autorisé et si le rôle n'est pas système.
  peutModifier(role: Role): boolean {
    return (
      this.hasPermission('roles.update') &&
      !role.isSystem
    );
  }

  // Supprimer uniquement si autorisé et si le rôle n'est pas système.
  peutSupprimer(role: Role): boolean {
    return (
      this.hasPermission('roles.delete') &&
      !role.isSystem
    );
  }

  // Charger la liste.
  chargerRoles(): void {
    this.requetes$.next({
      page: this.page,
      limite: this.limite,
      recherche: this.recherche
    });
  }

  // Recherche automatique.
  onRechercheChange(valeur: string): void {
    this.recherche$.next(valeur);
  }

  // Réinitialiser la recherche.
  reinitialiserRecherche(): void {
    this.termeRecherche = '';
    this.recherche$.next('');
  }

  // Changer de page.
  changerPage(nouvellePage: number): void {
    if (
      nouvellePage < 1 ||
      nouvellePage > this.totalPages ||
      nouvellePage === this.page
    ) {
      return;
    }

    this.page = nouvellePage;
    this.chargerRoles();
  }

  // Modifier le nombre de résultats par page.
  changerLimite(nouvelleLimite: number): void {
    const valeur = Number(nouvelleLimite);

    if (
      ![5, 10, 20, 50].includes(valeur) ||
      valeur === this.limite
    ) {
      return;
    }

    this.limite = valeur;
    this.page = 1;
    this.chargerRoles();
  }

  // Numéros de pages.
  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  // Ajouter un rôle.
  ajouterRole(): void {
    if (!this.hasPermission('roles.create')) {
      return;
    }

    this.router.navigate(['/roles/ajouter']);
  }

  // Voir un rôle.
  voirRole(role: Role): void {
    this.router.navigate(['/roles', role.id]);
  }

  // Modifier un rôle.
  modifierRole(role: Role): void {
    if (!this.peutModifier(role)) {
      return;
    }

    this.router.navigate([
      '/roles',
      role.id,
      'modifier'
    ]);
  }

  // Supprimer un rôle.
  supprimerRole(role: Role): void {
    if (
      !this.peutSupprimer(role) ||
      this.chargement
    ) {
      return;
    }

    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer le rôle « ${role.name} » ?`
    );

    if (!confirmation) {
      return;
    }

    this.chargement = true;
    this.messageErreur = '';
    this.cdr.markForCheck();

    this.roleService
      .deleteRole(role.id)
      .pipe(
        map(() => true),
        catchError((erreur) => {
          console.error(
            'Erreur lors de la suppression du rôle :',
            erreur
          );

          this.messageErreur =
            'Impossible de supprimer ce rôle. Vérifiez qu’il n’est pas utilisé.';

          return of(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((succes) => {
        if (!succes) {
          this.chargement = false;
          this.cdr.markForCheck();
          return;
        }

        // Si le dernier élément de la page est supprimé,
        // revenir à la page précédente.
        if (
          this.roles.length === 1 &&
          this.page > 1
        ) {
          this.page--;
        }

        this.chargerRoles();
      });
  }

  // Optimisation du rendu de la liste.
  trackByRoleId(
    index: number,
    role: Role
  ): string {
    return role.id;
  }
}
