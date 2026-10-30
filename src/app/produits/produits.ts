import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';

import { ProduitsService } from '../services/produit';

import {
  Produit,
  ProduitStatus
} from '../models/produit';

import { CategoriesService } from '../services/categories';

import { Categorie } from '../models/categorie';

@Component({
  selector: 'app-produits',
  standalone: false,
  templateUrl: './produits.html',
  styleUrl: './produits.css'
})
export class Produits implements OnInit {

  produits: Produit[] = [];

  produitsToutes: Produit[] = [];

  produitsFiltres: Produit[] = [];

  categories: Categorie[] = [];

  search = '';

  categoryId = '';

  status: ProduitStatus | '' = '';

  page = 1;

  limit = 20;

  total = 0;

  totalPages = 1;

  chargement = false;

  chargementCategories = false;

  erreur = '';

  constructor(
    private produitsService: ProduitsService,
    private categoriesService: CategoriesService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerCategories();
    this.chargerProduits();
  }

  /**
   * Charge les produits et conserve la liste complète
   * pour permettre une recherche locale automatique.
   */
  chargerProduits(): void {
    this.chargement = true;
    this.erreur = '';

    this.produitsService
      .getProduits(
        1,
        100,
        undefined,
        '',
        undefined
      )
      .subscribe({
        next: (response: any) => {
          console.log('RÉPONSE PRODUITS :', response);

          this.chargement = false;

          const data = response?.data ?? response;

          let listeProduits: Produit[] = [];

          if (Array.isArray(data)) {
            listeProduits = data;
          } else if (Array.isArray(data?.items)) {
            listeProduits = data.items;
          } else if (Array.isArray(data?.products)) {
            listeProduits = data.products;
          } else if (Array.isArray(data?.data)) {
            listeProduits = data.data;
          }

          this.produitsToutes = [...listeProduits];

          console.log(
            'TOUS LES PRODUITS :',
            this.produitsToutes
          );

          this.page = 1;
          this.appliquerFiltres();

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          this.chargement = false;

          this.produits = [];
          this.produitsToutes = [];
          this.produitsFiltres = [];

          this.total = 0;
          this.totalPages = 1;

          console.error('ERREUR PRODUITS :', error);

          this.erreur =
            error?.error?.error?.message ||
            error?.error?.message ||
            error?.message ||
            'Une erreur est survenue lors du chargement des produits.';

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  /**
   * Recherche automatiquement à chaque modification
   * du champ de recherche.
   *
   * À relier dans le HTML avec :
   * (input)="rechercher()"
   */
  rechercher(): void {
    this.page = 1;
    this.appliquerFiltres();
  }

  /**
   * Applique la recherche, la catégorie et le statut.
   */
  private appliquerFiltres(): void {
    let resultat = [...this.produitsToutes];

    const recherche = this.search
      .trim()
      .toLowerCase();

    if (recherche) {
      resultat = resultat.filter((produit: Produit) => {
        const nom = String(
          produit.name || ''
        ).toLowerCase();

        const marque = String(
          produit.brand || ''
        ).toLowerCase();

        const description = String(
          (produit as any).description || ''
        ).toLowerCase();

        const sku = String(
          (produit as any).sku || ''
        ).toLowerCase();

        const categorie = this.getNomCategorie(
          produit.categoryId
        ).toLowerCase();

        return (
          nom.includes(recherche) ||
          marque.includes(recherche) ||
          description.includes(recherche) ||
          sku.includes(recherche) ||
          categorie.includes(recherche)
        );
      });
    }

    if (this.categoryId) {
      resultat = resultat.filter(
        (produit: Produit) =>
          String(produit.categoryId) ===
          String(this.categoryId)
      );
    }

    if (this.status) {
      resultat = resultat.filter(
        (produit: Produit) =>
          produit.status === this.status
      );
    }

    this.produitsFiltres = resultat;

    this.total = resultat.length;

    this.totalPages = Math.max(
      1,
      Math.ceil(this.total / this.limit)
    );

    if (this.page > this.totalPages) {
      this.page = this.totalPages;
    }

    this.afficherPage();
  }

  /**
   * Affiche uniquement les produits de la page courante.
   */
  private afficherPage(): void {
    const debut = (this.page - 1) * this.limit;
    const fin = debut + this.limit;

    this.produits = this.produitsFiltres.slice(
      debut,
      fin
    );
  }

  /**
   * Charge les catégories actives.
   */
  chargerCategories(): void {
    this.chargementCategories = true;

    this.categoriesService
      .getCategories(
        1,
        100,
        '',
        true
      )
      .subscribe({
        next: (response: any) => {
          this.chargementCategories = false;

          const data = response?.data ?? response;

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

          this.categories = liste.filter(
            categorie => categorie.isActive
          );

          // Actualise les noms de catégories dans les résultats.
          this.appliquerFiltres();

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          this.chargementCategories = false;
          this.categories = [];

          console.error(
            'ERREUR CATÉGORIES :',
            error
          );
        }
      });
  }

  /**
   * Appelé lorsque la catégorie ou le statut change.
   */
  changerFiltres(): void {
    this.page = 1;
    this.appliquerFiltres();
  }

  /**
   * Efface tous les filtres et réaffiche les produits.
   */
  reinitialiserFiltres(): void {
    this.search = '';
    this.categoryId = '';
    this.status = '';
    this.page = 1;

    this.appliquerFiltres();
  }

  /**
   * Modifie le nombre de produits par page.
   */
  changerTaillePage(nouvelleTaille: number): void {
    this.limit = nouvelleTaille;
    this.page = 1;

    this.appliquerFiltres();
  }

  /**
   * Navigation vers la création d'un produit.
   */
  nouveauProduit(): void {
    this.router.navigate([
      '/produits/ajouter'
    ]);
  }

  /**
   * Affiche les détails d'un produit.
   */
  voirProduit(id: string): void {
    if (!id) {
      return;
    }

    this.router.navigate([
      '/produits',
      id
    ]);
  }

  /**
   * Ouvre la modification d'un produit.
   */
  modifierProduit(id: string): void {
    if (!id) {
      return;
    }

    this.router.navigate([
      '/produits',
      id,
      'modifier'
    ]);
  }

  /**
   * Archive un produit après confirmation.
   */
  supprimerProduit(produit: Produit): void {
    const confirmation = window.confirm(
      `Voulez-vous archiver le produit "${produit.name}" ?`
    );

    if (!confirmation) {
      return;
    }

    this.produitsService
      .deleteProduit(produit.id)
      .subscribe({
        next: () => {
          this.chargerProduits();
        },

        error: (error) => {
          console.error(
            'ERREUR ARCHIVAGE PRODUIT :',
            error
          );

          this.erreur =
            error?.error?.error?.message ||
            error?.error?.message ||
            error?.message ||
            'Impossible d’archiver le produit.';

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  /**
   * Convertit le statut technique en libellé lisible.
   */
  getStatutLabel(status: ProduitStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';

      case 'ACTIVE':
        return 'Actif';

      case 'INACTIVE':
        return 'Inactif';

      case 'ARCHIVED':
        return 'Archivé';

      default:
        return status;
    }
  }

  /**
   * Retourne le nom de la catégorie et de son parent
   * lorsque celui-ci est disponible.
   */
  getNomCategorie(categoryId: string): string {
    const categorie = this.categories.find(
      item =>
        String(item.id) === String(categoryId)
    );

    if (!categorie) {
      return '—';
    }

    if (categorie.parent) {
      return `${categorie.parent.name} > ${categorie.name}`;
    }

    if (categorie.parentId) {
      const parent = this.categories.find(
        item =>
          String(item.id) === String(categorie.parentId)
      );

      if (parent) {
        return `${parent.name} > ${categorie.name}`;
      }
    }

    return categorie.name;
  }

  /**
   * Passe à la page précédente.
   */
  pagePrecedente(): void {
    if (this.page <= 1) {
      return;
    }

    this.page--;
    this.afficherPage();
  }

  /**
   * Passe à la page suivante.
   */
  pageSuivante(): void {
    if (this.page >= this.totalPages) {
      return;
    }

    this.page++;
    this.afficherPage();
  }
}