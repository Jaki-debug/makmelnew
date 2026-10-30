import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoriesService } from '../services/categories';
import { Categorie } from '../models/categorie';

@Component({
  selector: 'app-sous-categorie-detail',
  standalone: false,
  templateUrl: './sous-categorie-detail.html',
  styleUrl: './sous-categorie-detail.css'
})
export class SousCategorieDetail implements OnInit {

  categorie: Categorie | null = null;
  categorieParent: Categorie | null = null;

  nom = '';
  sortOrder = 0;
  identifiant = '';
  active = false;

  chargement = false;
  erreur = '';

  constructor(
    private categoriesService: CategoriesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerSousCategorie();
  }

  chargerSousCategorie(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.erreur = 'Identifiant de sous-catégorie introuvable.';
      return;
    }

    this.chargement = true;
    this.erreur = '';

    this.categoriesService
      .getCategorie(id)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Détail sous-catégorie :',
            response
          );

          this.chargement = false;

          if (
            !response ||
            response.success !== true
          ) {

            this.erreur =
              response?.message ||
              response?.error?.message ||
              'Impossible de récupérer la sous-catégorie.';

            return;
          }

          const data =
            response.data?.data ||
            response.data;

          if (!data) {

            this.erreur =
              'Aucune donnée de sous-catégorie reçue.';

            return;
          }

          this.categorie = data;

          this.nom = data.name || '';
          this.sortOrder = data.sortOrder ?? 0;
          this.identifiant = data.id || '';
          this.active = data.isActive === true;

          if (data.parentId) {
            this.chargerCategorieParent(data.parentId);
          }

        },

        error: (error) => {

          this.chargement = false;

          console.error(
            'Erreur détail sous-catégorie :',
            error
          );

          console.error(
            'Status HTTP :',
            error.status
          );

          console.error(
            'Réponse backend :',
            error.error
          );

          this.erreur =
            error.error?.error?.message ||
            error.error?.message ||
            'Impossible de récupérer la sous-catégorie.';
        }

      });

  }

  chargerCategorieParent(parentId: string): void {

    this.categoriesService
      .getCategorie(parentId)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Catégorie principale :',
            response
          );

          if (response?.success === true) {

            this.categorieParent =
              response.data?.data ||
              response.data;
          }

        },

        error: (error) => {

          console.error(
            'Erreur catégorie principale :',
            error
          );
        }

      });

  }

  modifier(): void {

    if (!this.identifiant) {
      return;
    }

    this.router.navigate([
      '/categories/sous-categorie',
      this.identifiant,
      'modifier'
    ]);

  }

  retour(): void {

    this.router.navigate([
      '/categories'
    ]);

  }

  retourCategoriePrincipale(): void {

    if (!this.categorie?.parentId) {
      this.retour();
      return;
    }

    this.router.navigate([
      '/categories',
      this.categorie.parentId
    ]);

  }

  get statut(): string {

    return this.active
      ? 'Active'
      : 'Inactive';

  }

}