import {
ChangeDetectorRef,
Component,
OnDestroy,
OnInit
} from '@angular/core';

import {
ActivatedRoute,
Router
} from '@angular/router';

import {
CategoriesService
} from '../services/categories';

import {
FilesService
} from '../services/files';

import {
Categorie,
CategorieRequest
} from '../models/categorie';

@Component({
selector: 'app-categorie-update',
standalone: false,
templateUrl: './categorie-update.html',
styleUrl: './categorie-update.css'
})
export class CategorieUpdate implements OnInit, OnDestroy {

categorieId = '';

categorie: CategorieRequest = {
name: '',
parentId: null,
description: '',
imageId: null,
sortOrder: 0,
isActive: true
};

categorieOriginale: Categorie | null = null;

categoriesParent: Categorie[] = [];

chargement = false;

chargementCategorie = false;

chargementParents = false;

uploadEnCours = false;

erreur = '';

succes = '';

imageSelectionnee: File | null = null;

imagePreview: string | null = null;

private imagePreviewUrl: string | null = null;

constructor(
private categoriesService: CategoriesService,
private filesService: FilesService,
private route: ActivatedRoute,
private router: Router,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {

const id =
  this.route.snapshot.paramMap.get('id');

console.log(
  'ID CATÉGORIE À MODIFIER :',
  id
);

if (!id) {

  this.erreur =
    'Identifiant de catégorie introuvable.';

  return;
}

this.categorieId =
  id;

this.chargerCategorie();

this.chargerCategoriesParent();

}

chargerCategorie(): void {

this.chargementCategorie =
  true;

this.erreur =
  '';

this.categoriesService
  .getCategorie(
    this.categorieId
  )
  .subscribe({

    next: (
      response
    ) => {

      console.log(
        'RÉPONSE DÉTAIL CATÉGORIE :',
        response
      );

      this.chargementCategorie =
        false;

      if (
        !response ||
        response.success !== true ||
        !response.data
      ) {

        this.categorieOriginale =
          null;

        this.erreur =
          response?.message ||
          'Impossible de récupérer la catégorie.';

        this.changeDetectorRef.detectChanges();

        return;
      }

      const dataCategorie =
        response.data;

      console.log(
        'CATÉGORIE RÉCUPÉRÉE :',
        dataCategorie
      );

      console.log(
        'IMAGE ID RÉCUPÉRÉ :',
        dataCategorie.imageId
      );

      this.categorieOriginale =
        dataCategorie;

      this.categorie = {

        name:
          dataCategorie.name ||
          '',

        parentId:
          dataCategorie.parentId ||
          null,

        description:
          dataCategorie.description ||
          '',

        imageId:
          dataCategorie.imageId ||
          null,

        sortOrder:
          dataCategorie.sortOrder ??
          0,

        isActive:
          dataCategorie.isActive ??
          true
      };

      this.imageSelectionnee =
        null;

      this.supprimerPreviewLocal();

      console.log(
        'CATÉGORIE À MODIFIER :',
        this.categorie
      );

      console.log(
        'IMAGE ID DANS LE FORMULAIRE :',
        this.categorie.imageId
      );

      this.changeDetectorRef.detectChanges();
    },

    error: (
      error
    ) => {

      this.chargementCategorie =
        false;

      this.categorieOriginale =
        null;

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

chargerCategoriesParent(): void {

this.chargementParents =
  true;

this.categoriesService
  .getCategories(
    1,
    100,
    '',
    true
  )
  .subscribe({

    next: (
      response: any
    ) => {

      this.chargementParents =
        false;

      console.log(
        'CATÉGORIES PARENTS :',
        response
      );

      if (
        !response ||
        response.success !== true
      ) {

        this.changeDetectorRef.detectChanges();

        return;
      }

      const data =
        response.data;

      let categories:
        Categorie[] = [];

      if (
        Array.isArray(
          data
        )
      ) {

        categories =
          data;

      } else if (
        Array.isArray(
          data?.items
        )
      ) {

        categories =
          data.items;
      }

      this.categoriesParent =
        categories.filter(
          (
            categorie: Categorie
          ) =>
            !categorie.parentId &&
            categorie.id !==
              this.categorieId
        );

      this.changeDetectorRef.detectChanges();
    },

    error: (
      error
    ) => {

      this.chargementParents =
        false;

      console.error(
        'ERREUR CATÉGORIES PARENTS :',
        error
      );

      this.changeDetectorRef.detectChanges();
    }
  });

}

selectionnerImage(
event: Event
): void {

const input =
  event.target as HTMLInputElement;

if (
  !input.files ||
  input.files.length === 0
) {

  return;
}

const fichier =
  input.files[0];

const formatsAcceptes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

if (
  !formatsAcceptes.includes(
    fichier.type
  )
) {

  this.erreur =
    'Format non accepté. Utilisez JPG, PNG, WEBP ou GIF.';

  input.value =
    '';

  this.imageSelectionnee =
    null;

  this.supprimerPreviewLocal();

  this.changeDetectorRef.detectChanges();

  return;
}

const tailleMaximale =
  20 * 1024 * 1024;

if (
  fichier.size >
  tailleMaximale
) {

  this.erreur =
    'L’image ne doit pas dépasser 20 Mo.';

  input.value =
    '';

  this.imageSelectionnee =
    null;

  this.supprimerPreviewLocal();

  this.changeDetectorRef.detectChanges();

  return;
}

this.erreur =
  '';

this.imageSelectionnee =
  fichier;

this.supprimerPreviewLocal();

this.imagePreviewUrl =
  URL.createObjectURL(
    fichier
  );

this.imagePreview =
  this.imagePreviewUrl;

this.changeDetectorRef.detectChanges();

}

annulerRemplacement(): void {

this.imageSelectionnee =
  null;

this.supprimerPreviewLocal();

this.erreur =
  '';

this.changeDetectorRef.detectChanges();

}

supprimerImage(): void {

this.imageSelectionnee =
  null;

this.supprimerPreviewLocal();

this.categorie.imageId =
  null;

this.erreur =
  '';

this.changeDetectorRef.detectChanges();

}

private supprimerPreviewLocal(): void {

if (
  this.imagePreviewUrl
) {

  URL.revokeObjectURL(
    this.imagePreviewUrl
  );

  this.imagePreviewUrl =
    null;
}

this.imagePreview =
  null;

}

private uploaderImage(): Promise<string> {

if (
  !this.imageSelectionnee
) {

  return Promise.reject(
    new Error(
      'Aucune image sélectionnée.'
    )
  );
}

this.uploadEnCours =
  true;

return new Promise(
  (
    resolve,
    reject
  ) => {

    this.filesService
      .upload(
        this.imageSelectionnee!,
        'CATEGORY_IMAGE'
      )
      .subscribe({

        next: (
          response: any
        ) => {

          this.uploadEnCours =
            false;

          console.log(
            'RÉPONSE UPLOAD IMAGE CATÉGORIE :',
            response
          );

          const imageId =
            response?.data?.id ||
            response?.id ||
            '';

          if (!imageId) {

            reject(
              new Error(
                'L’upload a réussi mais aucun identifiant d’image n’a été retourné.'
              )
            );

            return;
          }

          resolve(
            imageId
          );
        },

        error: (
          error
        ) => {

          this.uploadEnCours =
            false;

          console.error(
            'ERREUR UPLOAD IMAGE CATÉGORIE :',
            error
          );

          reject(
            error
          );
        }
      });
  }
);

}

async modifierCategorie(): Promise<void> {

this.erreur =
  '';

this.succes =
  '';

if (
  !this.categorie.name?.trim()
) {

  this.erreur =
    'Le nom de la catégorie est requis.';

  return;
}

this.chargement =
  true;

try {

  let imageId =
    this.categorie.imageId ||
    null;

  if (
    this.imageSelectionnee
  ) {

    console.log(
      'NOUVELLE IMAGE À UPLOADER :',
      this.imageSelectionnee
    );

    imageId =
      await this.uploaderImage();

    console.log(
      'NOUVEL IMAGE ID :',
      imageId
    );
  }

  const data:
    CategorieRequest = {

    name:
      this.categorie.name.trim(),

    parentId:
      this.categorie.parentId ||
      null,

    description:
      this.categorie.description?.trim() ||
      '',

    imageId:
      imageId,

    sortOrder:
      this.categorie.sortOrder ??
      0,

    isActive:
      this.categorie.isActive ??
      true
  };

  console.log(
    'DONNÉES MODIFICATION CATÉGORIE :',
    data
  );

  this.categoriesService
    .updateCategorie(
      this.categorieId,
      data
    )
    .subscribe({

      next: (
        response
      ) => {

        this.chargement =
          false;

        console.log(
          'CATÉGORIE MODIFIÉE :',
          response
        );

        this.succes =
          'Catégorie modifiée avec succès.';

        this.changeDetectorRef.detectChanges();

        setTimeout(
          () => {

            this.router.navigate([
              '/categories',
              this.categorieId
            ]);

          },
          800
        );
      },

      error: (
        error
      ) => {

        this.chargement =
          false;

        console.error(
          'ERREUR MODIFICATION CATÉGORIE :',
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
          'Une erreur est survenue lors de la modification.';

        this.changeDetectorRef.detectChanges();
      }
    });

} catch (
  error: any
) {

  this.chargement =
    false;

  console.error(
    'ERREUR UPLOAD IMAGE :',
    error
  );

  this.erreur =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    'Une erreur est survenue lors de l’envoi de l’image.';

  this.changeDetectorRef.detectChanges();
}

}

annuler(): void {

this.router.navigate([
  '/categories'
]);

}

ngOnDestroy(): void {

this.supprimerPreviewLocal();

}
}