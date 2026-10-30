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

import Swal from 'sweetalert2';

@Component({
selector: 'app-sous-categorie-create',
standalone: false,
templateUrl: './sous-categorie-create.html',
styleUrl: './sous-categorie-create.css'
})
export class SousCategorieCreate implements OnInit {

categorie: CategorieRequest = {
name: '',
parentId: '',
description: '',
imageId: null,
sortOrder: 0,
isActive: true
};

categoriesParent: Categorie[] = [];

chargement = false;
chargementParents = false;

erreur = '';
succes = '';

parentIdDepuisDetail = '';

categoriePrincipaleVerrouillee = false;

categoriePrincipaleNom = '';

constructor(
private categoriesService: CategoriesService,
private route: ActivatedRoute,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {

this.parentIdDepuisDetail =
  this.route.snapshot.queryParamMap.get('parentId') || '';

this.categoriePrincipaleVerrouillee =
  !!this.parentIdDepuisDetail;

console.log(
  'PARENT ID REÇU :',
  this.parentIdDepuisDetail
);

this.chargerCategoriesParent();

}

chargerCategoriesParent(): void {

this.chargementParents = true;
this.erreur = '';

this.categoriesService
  .getCategories(
    1,
    100,
    '',
    true
  )
  .subscribe({

    next: (response: any) => {

      console.log(
        'RÉPONSE CATÉGORIES POUR SOUS-CATÉGORIE :',
        response
      );

      this.chargementParents = false;

      if (
        !response ||
        response.success !== true
      ) {

        this.categoriesParent = [];

        this.erreur =
          response?.message ||
          response?.error?.message ||
          'Impossible de charger les catégories principales.';

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

      console.log(
        'CATÉGORIES PRINCIPALES DISPONIBLES :',
        this.categoriesParent
      );

      if (
        this.parentIdDepuisDetail
      ) {

        const categoriePrincipale =
          this.categoriesParent.find(
            (categorie: Categorie) =>
              categorie.id ===
              this.parentIdDepuisDetail
          );

        if (!categoriePrincipale) {

          this.erreur =
            'La catégorie principale demandée est introuvable.';

          this.categorie.parentId =
            '';

          this.categoriePrincipaleNom =
            '';

          this.categoriePrincipaleVerrouillee =
            false;

        } else {

          this.categorie.parentId =
            categoriePrincipale.id;

          this.categoriePrincipaleNom =
            categoriePrincipale.name;

          this.categoriePrincipaleVerrouillee =
            true;

          console.log(
            'CATÉGORIE PRINCIPALE AUTOMATIQUEMENT SÉLECTIONNÉE :',
            categoriePrincipale
          );
        }
      }

      if (
        this.categoriesParent.length === 0
      ) {

        this.erreur =
          'Aucune catégorie principale disponible. Créez d’abord une catégorie principale.';
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

      console.error(
        'Status HTTP :',
        error.status
      );

      console.error(
        'Erreur backend :',
        error.error
      );

      this.erreur =
        error.error?.error?.message ||
        error.error?.message ||
        'Impossible de charger les catégories principales.';

      this.changeDetectorRef.detectChanges();
    }
  });

}

creerSousCategorie(): void {

this.erreur = '';
this.succes = '';

if (!this.categorie.parentId) {

  this.erreur =
    'Veuillez sélectionner une catégorie principale.';

  return;
}

if (!this.categorie.name?.trim()) {

  this.erreur =
    'Le nom de la sous-catégorie est requis.';

  return;
}

const parentId =
  this.categorie.parentId;

const data: CategorieRequest = {

  name:
    this.categorie.name.trim(),

  parentId:
    parentId,

  description:
    '',

  imageId:
    null,

  sortOrder:
    this.categorie.sortOrder ?? 0,

  isActive:
    this.categorie.isActive ?? true
};

console.log(
  'DONNÉES SOUS-CATÉGORIE :',
  data
);

this.chargement = true;

this.categoriesService
  .createCategorie(data)
  .subscribe({

    next: (response) => {

      this.chargement = false;

      console.log(
        'SOUS-CATÉGORIE CRÉÉE :',
        response
      );

      this.succes =
        'Sous-catégorie créée avec succès.';

      this.changeDetectorRef.detectChanges();

      Swal.fire({
        icon: 'success',
        title: 'Sous-catégorie créée avec succès',
        text: 'La sous-catégorie a été créée et enregistrée avec succès.',
        confirmButtonText: 'Voir la catégorie',
        confirmButtonColor: '#111827',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then((result) => {

        if (result.isConfirmed) {

          this.router.navigate([
            '/categories',
            parentId
          ]);

        }

      });
    },

    error: (error) => {

      this.chargement = false;

      console.error(
        'Erreur création sous-catégorie :',
        error
      );

      this.erreur =
        error.error?.error?.message ||
        error.error?.message ||
        'Une erreur est survenue lors de la création de la sous-catégorie.';

      this.changeDetectorRef.detectChanges();
    }
  });

}

annuler(): void {

if (
  this.categoriePrincipaleVerrouillee &&
  this.categorie.parentId
) {

  this.router.navigate([
    '/categories',
    this.categorie.parentId
  ]);

  return;
}

this.router.navigate([
  '/categories'
]);

}
}