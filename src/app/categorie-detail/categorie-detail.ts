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
import { Categorie } from '../models/categorie';

@Component({
selector: 'app-categorie-detail',
standalone: false,
templateUrl: './categorie-detail.html',
styleUrl: './categorie-detail.css'
})
export class CategorieDetail implements OnInit {

categorie: Categorie | null = null;

sousCategories: Categorie[] = [];

chargement = false;

chargementSousCategories = false;

erreur = '';

erreurSousCategories = '';

constructor(
private categoriesService: CategoriesService,
private route: ActivatedRoute,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerCategorie();
}

chargerCategorie(): void {

const id =
  this.route.snapshot.paramMap.get('id');

console.log(
  'ID CATÉGORIE À AFFICHER :',
  id
);

if (!id) {

  this.erreur =
    'Identifiant de catégorie introuvable.';

  this.changeDetectorRef.detectChanges();

  return;
}

this.chargement = true;

this.erreur = '';

this.categorie = null;

this.sousCategories = [];

this.changeDetectorRef.detectChanges();

this.categoriesService
  .getCategorie(id)
  .subscribe({

    next: (response) => {

      console.log(
        'DÉTAIL CATÉGORIE :',
        response
      );
if (
!response ||
response.success !== true
) {

this.sousCategories = [];

this.chargementSousCategories = false;

this.erreurSousCategories =
response?.message ||
'Impossible de récupérer les sous-catégories.';

this.changeDetectorRef.detectChanges();

return;
}

      const categorie =
        response.data;

      console.log(
        'CATÉGORIE TROUVÉE :',
        categorie
      );

      if (categorie.parentId) {

        this.chargement = false;

        this.categorie = null;

        this.erreur =
          'Cette page est réservée aux catégories principales.';

        this.changeDetectorRef.detectChanges();

        return;
      }

      this.categorie = {
        ...categorie
      };

      console.log(
        'IMAGE ID CATÉGORIE :',
        this.categorie.imageId
      );

      this.chargement = false;

      this.changeDetectorRef.detectChanges();

      this.chargerSousCategories(
        categorie.id
      );
    },

    error: (error) => {

      this.chargement = false;

      this.categorie = null;

      this.sousCategories = [];

      console.error(
        'ERREUR CHARGEMENT CATÉGORIE :',
        error
      );

      console.error(
        'STATUS :',
        error.status
      );

      console.error(
        'BACKEND :',
        error.error
      );

      this.erreur =
        error?.error?.error?.message ||
        error?.error?.message ||
        'Impossible de récupérer la catégorie.';

      this.changeDetectorRef.detectChanges();
    }
  });

}

chargerSousCategories(
parentId: string
): void {

this.chargementSousCategories = true;

this.erreurSousCategories = '';

this.categoriesService
  .getCategories(
    1,
    100,
    '',
    undefined,
    parentId
  )
  .subscribe({

    next: (response: any) => {

      console.log(
        'RÉPONSE SOUS-CATÉGORIES :',
        response
      );

      if (
        !response ||
        response.success !== true
      ) {

        this.sousCategories = [];

        this.chargementSousCategories = false;

        this.erreurSousCategories =
          response?.message ||
          response?.error?.message ||
          'Impossible de récupérer les sous-catégories.';

        this.changeDetectorRef.detectChanges();

        return;
      }

      const data =
        response.data;

      let categories: Categorie[] = [];

      /*
       * Gestion des différents formats possibles
       * de réponse du backend.
       */

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

      console.log(
        'CATÉGORIES REÇUES POUR LE PARENT :',
        categories
      );

      /*
       * On garde uniquement les catégories
       * réellement rattachées à la catégorie principale.
       */

      this.sousCategories =
        categories
          .filter(
            (categorie: Categorie) =>
              categorie.parentId === parentId
          )
          .map(
            (categorie: Categorie) => ({
              ...categorie
            })
          );

      console.log(
        'SOUS-CATÉGORIES TROUVÉES :',
        this.sousCategories
      );

      console.log(
        'NOMBRE DE SOUS-CATÉGORIES :',
        this.sousCategories.length
      );

      this.chargementSousCategories = false;

      this.changeDetectorRef.detectChanges();
    },

    error: (error) => {

      this.sousCategories = [];

      this.chargementSousCategories = false;

      console.error(
        'ERREUR CHARGEMENT SOUS-CATÉGORIES :',
        error
      );

      console.error(
        'STATUS :',
        error.status
      );

      console.error(
        'BACKEND :',
        error.error
      );

      this.erreurSousCategories =
        error?.error?.error?.message ||
        error?.error?.message ||
        'Impossible de récupérer les sous-catégories.';

      this.changeDetectorRef.detectChanges();
    }
  });

}

get imageUrl(): string | null {

if (!this.categorie?.imageId) {
  return null;
}

return '/api/v1/files/' +
  this.categorie.imageId;

}

getImageUrl(
imageId: string | null
): string | null {

if (!imageId) {
  return null;
}

return '/api/v1/files/' +
  imageId;

}

nouvelleSousCategorie(): void {

if (!this.categorie) {
  return;
}

this.router.navigate(
  [
    '/categories/sous-categorie/ajouter'
  ],
  {
    queryParams: {
      parentId: this.categorie.id
    }
  }
);

}

voirSousCategorie(
id: string
): void {

this.router.navigate([
  '/categories/sous-categorie',
  id
]);

}

modifier(): void {

if (!this.categorie) {
  return;
}

this.router.navigate([
  '/categories',
  this.categorie.id,
  'modifier'
]);

}

modifierSousCategorie(
id: string
): void {

this.router.navigate([
  '/categories/sous-categorie',
  id,
  'modifier'
]);

}

retour(): void {

this.router.navigate([
  '/categories'
]);

}

get statut(): string {

if (!this.categorie) {
  return '';
}

return this.categorie.isActive
  ? 'Active'
  : 'Inactive';

}
}