import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import {
ActivatedRoute,
Router
} from '@angular/router';

import { HttpClient } from '@angular/common/http';

import { ProduitsService } from '../services/produit';
import { CategoriesService } from '../services/categories';
import { FilesService } from '../services/files';

import { Categorie } from '../models/categorie';

@Component({
selector: 'app-produit-detail',
standalone: false,
templateUrl: './produit-detail.html',
styleUrls: ['./produit-detail.css']
})
export class ProduitDetail implements OnInit {

private apiUrl =
'https://api.commecheznous.fr/api/v1';

produit: any = null;

produitActuel: any = null;

variantes: any[] = [];

images: any[] = [];

categories: Categorie[] = [];

chargement = false;

chargementImages = false;

chargementCategories = false;

erreur = '';

erreurImages = '';

erreurCategories = '';

produitId!: string;

constructor(
private route: ActivatedRoute,
private router: Router,
private produitsService: ProduitsService,
private categoriesService: CategoriesService,
private filesService: FilesService,
private http: HttpClient,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {

this.produitId =
  this.route.snapshot.paramMap.get('id') || '';

if (!this.produitId) {

  this.erreur =
    'Identifiant du produit introuvable.';

  this.cdr.detectChanges();

  return;
}

this.chargerCategories();

this.chargerProduit();

}

chargerCategories(): void {

this.chargementCategories = true;

this.erreurCategories = '';

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

      console.log(
        'Réponse catégories détail produit :',
        response
      );

      const data =
        response?.data;

      let liste: Categorie[] = [];

      if (
        Array.isArray(data)
      ) {

        liste =
          data;

      } else if (
        Array.isArray(
          data?.items
        )
      ) {

        liste =
          data.items;

      } else if (
        Array.isArray(
          data?.categories
        )
      ) {

        liste =
          data.categories;

      } else if (
        Array.isArray(
          data?.data
        )
      ) {

        liste =
          data.data;

      } else if (
        Array.isArray(
          response?.items
        )
      ) {

        liste =
          response.items;

      } else if (
        Array.isArray(
          response?.categories
        )
      ) {

        liste =
          response.categories;
      }

      this.categories =
        liste;

      console.log(
        'Catégories chargées :',
        this.categories
      );

      console.log(
        'Nombre de catégories :',
        this.categories.length
      );

      this.categories.forEach(
        (
          categorie: Categorie
        ) => {

          console.log(
            'CATÉGORIE :',
            categorie.name,
            '| ID :',
            categorie.id,
            '| parentId :',
            categorie.parentId
          );

        }
      );

      this.chargementCategories =
        false;

      this.cdr.detectChanges();

    },

    error: (
      error: any
    ) => {

      console.error(
        'Erreur chargement catégories détail :',
        error
      );

      this.categories = [];

      this.chargementCategories =
        false;

      this.erreurCategories =
        error?.error?.message ||
        error?.message ||
        'Impossible de charger les catégories.';

      this.cdr.detectChanges();
    }

  });

}

chargerProduit(): void {

this.chargement = true;

this.erreur = '';

this.produit = null;

this.produitActuel = null;

this.variantes = [];

this.images = [];

this.erreurImages = '';

this.cdr.detectChanges();

this.produitsService
  .getProduit(
    this.produitId
  )
  .subscribe({

    next: (
      response: any
    ) => {

      console.log(
        'Réponse produit détail :',
        response
      );

      if (
        response?.success === false
      ) {

        this.erreur =
          response?.message ||
          'Impossible de charger le produit.';

        this.chargement =
          false;

        this.cdr.detectChanges();

        return;
      }

      const produitData =

        response?.data?.product ||

        response?.data?.produit ||

        response?.data ||

        response?.product ||

        response?.produit ||

        null;

      if (!produitData) {

        this.erreur =
          'Produit introuvable.';

        this.chargement =
          false;

        this.cdr.detectChanges();

        return;
      }

      this.produit =
        produitData;

      this.produitActuel =
        produitData;

      console.log(
        'PRODUIT ACTUEL :',
        this.produitActuel
      );

      console.log(
        'CATEGORY ID PRODUIT :',
        this.produitActuel?.categoryId
      );

      this.variantes =

        Array.isArray(
          produitData.variants
        )

          ? produitData.variants

          : Array.isArray(
              produitData.variante
            )

            ? produitData.variante

            : Array.isArray(
                produitData.variantes
              )

              ? produitData.variantes

              : [];

      const imagesProduit =

        produitData.images ||

        produitData.productImages ||

        produitData.imagesProduit ||

        [];

      this.chargement =
        false;

      if (
        Array.isArray(
          imagesProduit
        ) &&
        imagesProduit.length > 0
      ) {

        this.construireImages(
          imagesProduit
        );
      }

      this.cdr.detectChanges();

      if (
        !Array.isArray(
          imagesProduit
        ) ||
        imagesProduit.length === 0
      ) {

        this.chargerImagesProduit(
          this.produitId
        );
      }

    },

    error: (
      error: any
    ) => {

      console.error(
        'Erreur chargement produit :',
        error
      );

      this.erreur =

        error?.error?.message ||

        error?.message ||

        'Une erreur est survenue lors du chargement du produit.';

      this.chargement =
        false;

      this.cdr.detectChanges();
    }

  });

}

chargerImagesProduit(
productId: string
): void {

this.chargementImages = true;

this.erreurImages = '';

this.cdr.detectChanges();

this.http
  .get<any>(
    `${this.apiUrl}/admin/products/${productId}/images`,
    {
      withCredentials: true
    }
  )
  .subscribe({

    next: (
      response: any
    ) => {

      console.log(
        'Réponse images produit :',
        response
      );

      const images =

        response?.data?.images ||

        response?.data?.productImages ||

        response?.data ||

        response?.images ||

        response?.productImages ||

        [];

      if (
        Array.isArray(images) &&
        images.length > 0
      ) {

        this.construireImages(
          images
        );

      } else {

        this.images = [];
      }

      this.chargementImages =
        false;

      this.cdr.detectChanges();
    },

    error: (
      error: any
    ) => {

      console.error(
        'Erreur chargement images :',
        error
      );

      this.images = [];

      this.erreurImages =

        error?.error?.message ||

        error?.message ||

        'Impossible de charger les images du produit.';

      this.chargementImages =
        false;

      this.cdr.detectChanges();
    }

  });

}

construireImages(
imagesProduit: any[]
): void {

if (
  !Array.isArray(
    imagesProduit
  )
) {

  this.images = [];

  return;
}

this.images =
  imagesProduit

    .map(
      (
        image: any
      ) => {

        const fileId =

          image?.fileId ||

          image?.file?.id ||

          image?.file?.fileId ||

          image?.fichierId ||

          image?.fichier?.id ||

          image?.fichier?.fileId ||

          null;

        let url =

          image?.url ||

          image?.fileUrl ||

          image?.file?.url ||

          image?.fichier?.url ||

          image?.imageUrl ||

          null;

        if (url) {

          if (

            url.startsWith(
              'https://api.commecheznous.fr'
            ) ||

            url.startsWith(
              'http://127.0.0.1:3000'
            )

          ) {

            url =
              url.replace(
                /^http:\/\/(localhost|127\.0\.0\.1):3000/,
                ''
              );
          }
        }

        if (
          !url &&
          fileId
        ) {

          url =
            `/api/v1/files/${fileId}`;
        }

        return {

          ...image,

          id:

            image?.id ||

            image?.imageId ||

            image?.productImageId ||

            null,

          fileId,

          url

        };

      }
    )

    .filter(
      (
        image: any
      ) =>
        !!image.url
    );

this.cdr.detectChanges();

}

getImageUrl(
image: any
): string {

if (!image) {

  return '';
}

if (
  image.url
) {

  return image.url;
}

const fileId =

  image.fileId ||

  image.file?.id ||

  image.file?.fileId ||

  image.fichierId ||

  image.fichier?.id ||

  image.fichier?.fileId;

if (fileId) {

  return `/api/v1/files/${fileId}`;
}

return '';

}

getImagePrincipale(): string {

if (
  this.images &&
  this.images.length > 0
) {

  return this.getImageUrl(
    this.images[0]
  );
}

return '';

}

getCategoryId(): string {

if (
  !this.produitActuel
) {

  return '';
}

return String(

  this.produitActuel.categoryId ||

  this.produitActuel.categorieId ||

  this.produitActuel.category?.id ||

  this.produitActuel.categorie?.id ||

  ''

)
  .trim()
  .toLowerCase();

}

getCategorieProduit(): Categorie | null {

const categoryId =
  this.getCategoryId();

if (!categoryId) {

  return null;
}

const categorie =
  this.categories.find(
    (
      item: Categorie
    ) => {

      return (
        String(
          item?.id ?? ''
        )
          .trim()
          .toLowerCase() ===
        categoryId
      );

    }
  );

return categorie || null;

}

getNomCategorie(): string {

const categorie =
  this.getCategorieProduit();

if (
  categorie?.name
) {

  return categorie.name;
}

if (
  this.produitActuel?.category?.name
) {

  return this.produitActuel.category.name;
}

if (
  this.produitActuel?.categorie?.name
) {

  return this.produitActuel.categorie.name;
}

if (
  this.produitActuel?.categoryName
) {

  return this.produitActuel.categoryName;
}

return 'Non renseignée';

}

getSousCategorie(): Categorie | null {

const categorie =
  this.getCategorieProduit();

if (!categorie) {

  return null;
}

if (
  categorie.parentId
) {

  return categorie;
}

return null;

}

getNomSousCategorie(): string {

const categorie =
  this.getSousCategorie();

if (
  categorie?.name
) {

  return categorie.name;
}

return 'Non renseignée';

}

getCategoriePrincipale(): Categorie | null {

const categorie =
  this.getCategorieProduit();

if (!categorie) {

  return null;
}

if (
  !categorie.parentId
) {

  return categorie;
}

const categoriePrincipale =
  this.categories.find(
    (
      item: Categorie
    ) => {

      return (
        String(
          item?.id ?? ''
        )
          .trim()
          .toLowerCase() ===
        String(
          categorie.parentId
        )
          .trim()
          .toLowerCase()
      );

    }
  );

return categoriePrincipale || null;

}

getNomCategoriePrincipale(): string {

const categoriePrincipale =
  this.getCategoriePrincipale();

if (
  categoriePrincipale?.name
) {

  return categoriePrincipale.name;
}

return 'Non renseignée';

}

getCategorieEtSousCategorie(): string {

const categorie =
  this.getCategorieProduit();

if (!categorie) {

  return 'Non renseignée';
}

if (
  !categorie.parentId
) {

  return categorie.name;
}

const categoriePrincipale =
  this.getCategoriePrincipale();

if (
  categoriePrincipale?.name
) {

  return (
    categoriePrincipale.name +
    ' / ' +
    categorie.name
  );
}

return categorie.name;

}

getStatutProduit(): string {

if (
  !this.produitActuel
) {

  return 'Non défini';
}

if (

  this.produitActuel.isArchived === true ||

  this.produitActuel.archived === true

) {

  return 'Archivé';
}

if (
  this.produitActuel.status
) {

  return this.produitActuel.status;
}

if (
  this.produitActuel.statut
) {

  return this.produitActuel.statut;
}

return 'Actif';

}

estArchive(): boolean {

if (
  !this.produitActuel
) {

  return false;
}

return (

  this.produitActuel.isArchived === true ||

  this.produitActuel.archived === true

);

}

retournerProduits(): void {

this.router.navigate([
  '/admin/produits'
]);

}

modifierProduit(): void {

if (
  !this.produitId
) {

  return;
}

this.router.navigate([
  '/admin/produits/modifier',
  this.produitId
]);

}

supprimerProduit(): void {

if (
  !this.produitId
) {

  return;
}

const confirmation =
  confirm(
    'Êtes-vous sûr de vouloir supprimer ce produit ?'
  );

if (!confirmation) {

  return;
}

this.produitsService
  .deleteProduit(
    this.produitId
  )
  .subscribe({

    next: (
      response: any
    ) => {

      console.log(
        'Produit supprimé :',
        response
      );

      this.router.navigate([
        '/admin/produits'
      ]);
    },

    error: (
      error: any
    ) => {

      console.error(
        'Erreur suppression produit :',
        error
      );

      this.erreur =

        error?.error?.message ||

        error?.message ||

        'Impossible de supprimer le produit.';

      this.cdr.detectChanges();
    }

  });

}

recharger(): void {

if (
  this.produitId
) {

  this.chargerCategories();

  this.chargerProduit();
}

}

}