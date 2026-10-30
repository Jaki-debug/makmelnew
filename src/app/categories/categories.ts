import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CategoriesService } from '../services/categories';
import { Categorie } from '../models/categorie';

@Component({
  selector: 'app-categories',
  standalone: false,
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {

  categories: Categorie[] = [];
  categoriesToutes: Categorie[] = [];
  categoriesPrincipales: Categorie[] = [];

  search = '';
  isActive: boolean | undefined = undefined;

  // Pagination
  page = 1;
  limit = 10;
  limitesDisponibles: number[] = [10, 25, 50, 100];
  total = 0;

  chargement = false;
  erreur = '';

  constructor(
    private categoriesService: CategoriesService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerCategories();
  }

  chargerCategories(): void {
    this.chargement = true;
    this.erreur = '';

    this.categoriesService
      .getCategories(
        1,
        100,
        this.search,
        this.isActive
      )
      .subscribe({
        next: (response: any) => {
          this.chargement = false;

          if (!response || response.success !== true) {
            this.erreur =
              response?.message ||
              response?.error?.message ||
              'Impossible de récupérer les catégories.';

            this.changeDetectorRef.detectChanges();
            return;
          }

          const data = response.data;
          let liste: Categorie[] = [];

          if (Array.isArray(data)) {
            liste = data;
          } else if (Array.isArray(data?.items)) {
            liste = data.items;
          } else if (Array.isArray(data?.categories)) {
            liste = data.categories;
          } else if (Array.isArray(data?.data)) {
            liste = data.data;
          }

          this.categoriesToutes = [...liste];

          // Garder uniquement les catégories principales
          this.categoriesPrincipales = liste.filter(
            categorie => !categorie.parentId
          );

          this.total = this.categoriesPrincipales.length;

          // Revenir à une page valide si le total diminue
          if (this.page > this.totalPages) {
            this.page = Math.max(1, this.totalPages);
          }

          this.mettreAJourListe();

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          this.chargement = false;

          console.error('Erreur catégories :', error);
          console.error('Status HTTP :', error.status);
          console.error('Erreur backend :', error.error);

          this.erreur =
            error.error?.error?.message ||
            error.error?.message ||
            'Une erreur est survenue lors du chargement des catégories.';

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private mettreAJourListe(): void {
    const debut = (this.page - 1) * this.limit;
    const fin = debut + this.limit;

    this.categories = this.categoriesPrincipales.slice(debut, fin);
  }

  rechercher(): void {
    this.page = 1;
    this.chargerCategories();
  }

  changerFiltre(): void {
    this.page = 1;
    this.chargerCategories();
  }

  reinitialiserFiltres(): void {
    this.search = '';
    this.isActive = undefined;
    this.page = 1;

    this.chargerCategories();
  }

  // Changer le nombre de catégories affichées par page
  changerLimite(): void {
    this.page = 1;
    this.mettreAJourListe();
  }

  nouvelleCategoriePrincipale(): void {
    this.router.navigate(['/categories/ajouter']);
  }

  nouvelleSousCategorie(): void {
    this.router.navigate([
      '/categories/sous-categorie/ajouter'
    ]);
  }

  voirCategorie(categorie: Categorie): void {
    if (categorie.parentId) {
      this.router.navigate([
        '/categories/sous-categorie',
        categorie.id
      ]);
      return;
    }

    this.router.navigate([
      '/categories',
      categorie.id
    ]);
  }

  modifierCategorie(categorie: Categorie): void {
    if (categorie.parentId) {
      this.router.navigate([
        '/categories/sous-categorie',
        categorie.id,
        'modifier'
      ]);
      return;
    }

    this.router.navigate([
      '/categories',
      categorie.id,
      'modifier'
    ]);
  }

  supprimerCategorie(categorie: Categorie): void {
    const confirmation = window.confirm(
      'Voulez-vous vraiment supprimer la catégorie "' +
      categorie.name +
      '" ?'
    );

    if (!confirmation) {
      return;
    }

    this.erreur = '';

    this.categoriesService
      .deleteCategorie(categorie.id)
      .subscribe({
        next: (response) => {
          console.log('Suppression catégorie :', response);

          // Actualiser la liste après suppression
          this.chargerCategories();
        },

        error: (error) => {
          console.error('Erreur suppression catégorie :', error);

          this.erreur =
            error.error?.error?.message ||
            error.error?.message ||
            'Impossible de supprimer cette catégorie.';

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  getNombreSousCategories(parentId: string): number {
    return this.categoriesToutes.filter(
      categorie => categorie.parentId === parentId
    ).length;
  }

  getStatut(categorie: Categorie): string {
    return categorie.isActive ? 'Active' : 'Inactive';
  }

  pagePrecedente(): void {
    if (this.page > 1) {
      this.page--;
      this.mettreAJourListe();
    }
  }

  pageSuivante(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.mettreAJourListe();
    }
  }

  allerAlaPage(numero: number): void {
    if (
      numero >= 1 &&
      numero <= this.totalPages &&
      numero !== this.page
    ) {
      this.page = numero;
      this.mettreAJourListe();
    }
  }

  get premierElement(): number {
    if (this.total === 0) {
      return 0;
    }

    return (this.page - 1) * this.limit + 1;
  }

  get dernierElement(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }
}