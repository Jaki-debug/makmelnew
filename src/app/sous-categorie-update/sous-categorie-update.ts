import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import {
ActivatedRoute,
Router
} from '@angular/router';

import { CategoriesService } from '../services/categories';

import {
Categorie,
CategorieRequest
} from '../models/categorie';

@Component({
selector: 'app-sous-categorie-update',
standalone: false,
templateUrl: './sous-categorie-update.html',
styleUrl: './sous-categorie-update.css'
})
export class SousCategorieUpdate implements OnInit {

categorieId = '';

categorieParentId = '';

categorie: CategorieRequest = {
name: '',
parentId: '',
description: '',
imageId: null,
sortOrder: 0,
isActive: true
};

categorieOriginale: Categorie | null = null;

categoriesParent: Categorie[] = [];

categorieParentNom = '';

chargement = false;
chargementCategorie = false;
chargementParents = false;

erreur = '';
succes = '';

constructor(
private categoriesService: CategoriesService,
private route: ActivatedRoute,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {

const id =
  this.route.snapshot.paramMap.get('id');

if (!id) {

  this.erreur =
    'Identifiant de sous-catégorie introuvable.';

  this.changeDetectorRef.detectChanges();

  return;
}

this.categorieId = id;

this.chargerSousCategorie();

this.chargerCategoriesParent();

}

chargerSousCategorie(): void {

this.chargementCategorie = true;
this.erreur = '';

this.categoriesService
  .getCategories(
    1,
    100,
    '',
    undefined
  )
  .subscribe({

    next: (response: any) => {

      console.log(
        'LISTE POUR MODIFICATION SOUS-CATÉGORIE :',
        response
      );

      this.chargementCategorie = false;

      if (
        !response ||
        response.success !== true
      ) {

        this.erreur =
          response?.message ||
          response?.error?.message ||
          'Impossible de récupérer les catégories.';

        this.changeDetectorRef.detectChanges();

        return;
      }

      const data =
        response.data;

      let categories: Categorie[] = [];

      if (Array.isArray(data)) {

        categories = data;

      } else if (
        Array.isArray(data?.items)
      ) {

        categories = data.items;

      } else if (
        Array.isArray(data?.categories)
      ) {

        categories = data.categories;

      } else if (
        Array.isArray(data?.data)
      ) {

        categories = data.data;
      }

      const sousCategorie =
        categories.find(
          (categorie: Categorie) =>
            categorie.id === this.categorieId
        );

      if (!sousCategorie) {

        this.erreur =
          'Sous-catégorie introuvable.';

        this.categorieOriginale = null;

        this.changeDetectorRef.detectChanges();

        return;
      }

      if (!sousCategorie.parentId) {

        this.erreur =
          'Cette catégorie n’est pas une sous-catégorie.';

        this.categorieOriginale = null;

        this.changeDetectorRef.detectChanges();

        return;
      }

      this.categorieOriginale =
        sousCategorie;

      this.categorieParentId =
        sousCategorie.parentId;

      this.categorie = {

        name:
          sousCategorie.name || '',

        parentId:
          sousCategorie.parentId,

        description:
          '',

        imageId:
          null,

        sortOrder:
          sousCategorie.sortOrder ?? 0,

        isActive:
          sousCategorie.isActive ?? true
      };

      const parent =
        categories.find(
          (categorie: Categorie) =>
            categorie.id ===
            sousCategorie.parentId
        );

      if (parent) {

        this.categorieParentNom =
          parent.name;
      }

      console.log(
        'SOUS-CATÉGORIE À MODIFIER :',
        this.categorie
      );

      console.log(
        'ID CATÉGORIE PRINCIPALE :',
        this.categorieParentId
      );

      this.changeDetectorRef.detectChanges();
    },

    error: (error) => {

      this.chargementCategorie = false;

      console.error(
        'Erreur chargement sous-catégorie :',
        error
      );

      this.erreur =
        error.error?.error?.message ||
        error.error?.message ||
        'Impossible de récupérer la sous-catégorie.';

      this.changeDetectorRef.detectChanges();
    }
  });

}

chargerCategoriesParent(): void {

this.chargementParents = true;

this.categoriesService
  .getCategories(
    1,
    100,
    '',
    true
  )
  .subscribe({

    next: (response: any) => {

      this.chargementParents = false;

      if (
        !response ||
        response.success !== true
      ) {

        this.categoriesParent = [];

        this.changeDetectorRef.detectChanges();

        return;
      }

      const data =
        response.data;

      let categories: Categorie[] = [];

      if (Array.isArray(data)) {

        categories = data;

      } else if (
        Array.isArray(data?.items)
      ) {

        categories = data.items;

      } else if (
        Array.isArray(data?.categories)
      ) {

        categories = data.categories;

      } else if (
        Array.isArray(data?.data)
      ) {

        categories = data.data;
      }

      this.categoriesParent =
        categories.filter(
          (categorie: Categorie) =>
            !categorie.parentId
        );

      if (this.categorieParentId) {

        const parent =
          this.categoriesParent.find(
            (categorie: Categorie) =>
              categorie.id ===
              this.categorieParentId
          );

        if (parent) {

          this.categorieParentNom =
            parent.name;
        }
      }

      this.changeDetectorRef.detectChanges();
    },

    error: (error) => {

      this.chargementParents = false;

      this.categoriesParent = [];

      console.error(
        'Erreur catégories principales :',
        error
      );

      this.changeDetectorRef.detectChanges();
    }
  });

}

modifierSousCategorie(): void {

this.erreur = '';
this.succes = '';

if (!this.categorieParentId) {

  this.erreur =
    'La catégorie principale est obligatoire.';

  this.changeDetectorRef.detectChanges();

  return;
}

if (!this.categorie.name?.trim()) {

  this.erreur =
    'Le nom de la sous-catégorie est requis.';

  this.changeDetectorRef.detectChanges();

  return;
}

const data: CategorieRequest = {

  name:
    this.categorie.name.trim(),

  parentId:
    this.categorieParentId,

  description:
    '',

  imageId:
    null,

  sortOrder:
    this.categorie.sortOrder ?? 0,

  isActive:
    this.categorie.isActive ?? true
};

this.chargement = true;

this.categoriesService
  .updateCategorie(
    this.categorieId,
    data
  )
  .subscribe({

    next: (response) => {

      this.chargement = false;

      console.log(
        'SOUS-CATÉGORIE MODIFIÉE :',
        response
      );

      this.succes =
        'Sous-catégorie modifiée avec succès.';

      this.changeDetectorRef.detectChanges();

      setTimeout(() => {

        this.router.navigate([
          '/categories',
          this.categorieParentId
        ]);

      }, 800);
    },

    error: (error) => {

      this.chargement = false;

      console.error(
        'Erreur modification sous-catégorie :',
        error
      );

      this.erreur =
        error.error?.error?.message ||
        error.error?.message ||
        'Une erreur est survenue lors de la modification de la sous-catégorie.';

      this.changeDetectorRef.detectChanges();
    }
  });

}

annuler(): void {

console.log(
  'RETOUR VERS CATÉGORIE PRINCIPALE :',
  this.categorieParentId
);

if (this.categorieParentId) {

  this.router.navigate([
    '/categories',
    this.categorieParentId
  ]);

  return;
}

this.router.navigate([
  '/categories'
]);

}
}