import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CategoriesService } from '../services/categories';
import { CategorieRequest } from '../models/categorie';
import { FilesService } from '../services/files';

import Swal from 'sweetalert2';

@Component({
selector: 'app-categorie-create',
standalone: false,
templateUrl: './categorie-create.html',
styleUrl: './categorie-create.css'
})
export class CategorieCreate implements OnInit, OnDestroy {

categorie: CategorieRequest = {
name: '',
parentId: null,
description: '',
imageId: null,
sortOrder: 0,
isActive: true
};

imageSelectionnee: File | null = null;
imagePreview: string | null = null;

chargement = false;
uploadEnCours = false;

erreur = '';
succes = '';

private imagePreviewUrl: string | null = null;

constructor(
private categoriesService: CategoriesService,
private filesService: FilesService,
private router: Router
) {}

ngOnInit(): void {}

selectionnerImage(event: Event): void {

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

  input.value = '';
  this.imageSelectionnee = null;

  this.supprimerPreview();

  return;
}

const tailleMaximale =
  20 * 1024 * 1024;

if (
  fichier.size > tailleMaximale
) {

  this.erreur =
    'L’image ne doit pas dépasser 20 Mo.';

  input.value = '';
  this.imageSelectionnee = null;

  this.supprimerPreview();

  return;
}

this.erreur = '';

this.categorie.imageId = null;

this.imageSelectionnee =
  fichier;

this.supprimerPreview();

this.imagePreviewUrl =
  URL.createObjectURL(
    fichier
  );

this.imagePreview =
  this.imagePreviewUrl;

}

supprimerImage(): void {

this.imageSelectionnee = null;

this.categorie.imageId = null;

this.supprimerPreview();

}

private supprimerPreview(): void {

if (this.imagePreviewUrl) {

  URL.revokeObjectURL(
    this.imagePreviewUrl
  );

  this.imagePreviewUrl = null;
}

this.imagePreview = null;

}

private uploaderImage(): Promise<string | null> {

if (!this.imageSelectionnee) {

  return Promise.resolve(null);
}

this.uploadEnCours = true;

return new Promise(
  (resolve, reject) => {

    this.filesService
      .upload(
        this.imageSelectionnee!,
        'CATEGORY_IMAGE'
      )
      .subscribe({

        next: (response) => {

          this.uploadEnCours = false;

          console.log(
            'Réponse upload image catégorie :',
            response
          );

          const imageId =
            response?.data?.id;

          if (!imageId) {

            reject(
              new Error(
                'L’upload de l’image a réussi, mais aucun identifiant de fichier n’a été retourné.'
              )
            );

            return;
          }

          resolve(imageId);
        },

        error: (error) => {

          this.uploadEnCours = false;

          console.error(
            'Erreur upload image catégorie :',
            error
          );

          reject(error);
        }

      });

  }
);

}

async creerCategorie(): Promise<void> {

this.erreur = '';
this.succes = '';

if (
  !this.categorie.name?.trim()
) {

  this.erreur =
    'Le nom de la catégorie est requis.';

  return;
}

if (this.chargement) {

  return;
}

this.chargement = true;

try {

  let imageId: string | null =
    this.categorie.imageId || null;

  if (this.imageSelectionnee) {

    imageId =
      await this.uploaderImage();
  }

  const data: CategorieRequest = {

    name:
      this.categorie.name.trim(),

    parentId:
      this.categorie.parentId || null,

    description:
      this.categorie.description?.trim() || '',

    imageId:
      imageId,

    sortOrder:
      this.categorie.sortOrder ?? 0,

    isActive:
      this.categorie.isActive ?? true
  };

  console.log(
    'Données création catégorie :',
    data
  );

  this.categoriesService
    .createCategorie(data)
    .subscribe({

      next: (response) => {

        this.chargement = false;

        console.log(
          'Catégorie principale créée :',
          response
        );

        this.succes =
          'Catégorie principale créée avec succès.';

        Swal.fire({

          icon: 'success',

          title:
            'Catégorie créée avec succès',

          text:
            'La catégorie a été créée et enregistrée avec succès.',

          confirmButtonText:
            'Voir les catégories',

          confirmButtonColor:
            '#111827',

          allowOutsideClick:
            false,

          allowEscapeKey:
            false

        }).then((result) => {

          if (
            result.isConfirmed
          ) {

            this.router.navigate([
              '/categories'
            ]);
          }

        });
      },

      error: (error) => {

        this.chargement = false;

        console.error(
          'Erreur création catégorie principale :',
          error
        );

        this.erreur =
          error?.error?.error?.message ||
          error?.error?.message ||
          'Une erreur est survenue lors de la création de la catégorie.';
      }

    });

} catch (error: any) {

  this.chargement = false;

  console.error(
    'Erreur upload image catégorie :',
    error
  );

  this.erreur =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    'Une erreur est survenue lors de l’envoi de l’image.';
}

}

annuler(): void {

this.router.navigate([
  '/categories'
]);

}

ngOnDestroy(): void {

this.supprimerPreview();

}
}