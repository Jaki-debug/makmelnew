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

import Swal from 'sweetalert2';

import { ProduitsService } from '../services/produit';
import { CategoriesService } from '../services/categories';
import { FilesService } from '../services/files';

import {
Produit,
ProduitRequest,
ProduitStatus,
VarianteProduit
} from '../models/produit';

import { Categorie } from '../models/categorie';

interface ImageProduitUpdate {
id: string;
fileId: string;
variantId: string | null;
url: string;
nom: string;
isPrimary: boolean;
sortOrder: number;
}

interface VarianteEdition {
sku: string;
name: string;
size: string;
color: string;
model: string;
price: number;
compareAtPrice: number | null;
isActive: boolean;
lowStockThreshold: number | null;
}

@Component({
selector: 'app-produit-update',
standalone: false,
templateUrl: './produit-update.html',
styleUrl: './produit-update.css'
})
export class ProduitUpdate implements OnInit {

produitId = '';

produit: Produit | null = null;

variantes: VarianteProduit[] = [];

categories: Categorie[] = [];

categoriesAffichage: Categorie[] = [];

images: ImageProduitUpdate[] = [];

variantesEnEdition: {
[variantId: string]: VarianteEdition
} = {};

varianteEnEditionId = '';

varianteEnregistrementId = '';

chargement = false;

chargementImages = false;

enregistrement = false;

imageOperationEnCours = false;

imageOperationId = '';

erreur = '';

erreurImages = '';

erreurVariante = '';

erreurEnregistrementFinal = '';

messageSucces = '';

form: ProduitRequest = {

categoryId: '',

name: '',

description: '',

brand: '',

status: 'DRAFT',

seoTitle: '',

seoDescription: ''

};

statuts: ProduitStatus[] = [
'DRAFT',
'ACTIVE',
'INACTIVE',
'ARCHIVED'
];

constructor(
private route: ActivatedRoute,
private router: Router,
private produitsService: ProduitsService,
private categoriesService: CategoriesService,
private filesService: FilesService,
private http: HttpClient,
private changeDetectorRef: ChangeDetectorRef
) {}

ngOnInit(): void {

const id =
  this.route.snapshot.paramMap.get('id');


if (!id) {

  this.erreur =
    'Identifiant du produit introuvable.';

  return;
}


this.produitId =
  id;


this.chargerCategories();

this.chargerProduit();

}

/*

SweetAlert2 réservé à l'enregistrement
général du produit.
*/
private afficherSweetAlertSucces(
titre: string,
message: string
): void {
Swal.fire({
  icon: 'success',

  title: titre,

  text: message,

  confirmButtonText: 'OK',

  confirmButtonColor: '#0b3a6e'

});

}

private afficherSweetAlertErreur(
titre: string,
message: string
): void {

Swal.fire({

  icon: 'error',

  title: titre,

  text: message,

  confirmButtonText: 'OK',

  confirmButtonColor: '#0b3a6e'

});

}

/*

Petite alerte dans la page pour les
variantes et les images.
*/
private afficherMessageSucces(
message: string
): void {
this.messageSucces =
  message;

this.changeDetectorRef.detectChanges();


setTimeout(() => {

  this.messageSucces =
    '';

  this.changeDetectorRef.detectChanges();

}, 3500);

}

chargerProduit(): void {

this.chargement =
  true;

this.chargementImages =
  true;

this.erreur =
  '';

this.erreurImages =
  '';

this.erreurVariante =
  '';

this.erreurEnregistrementFinal =
  '';

this.messageSucces =
  '';

this.variantes =
  [];

this.images =
  [];

this.variantesEnEdition =
  {};

this.varianteEnEditionId =
  '';


this.produitsService
  .getProduit(
    this.produitId
  )
  .subscribe({

    next: (
      response: any
    ) => {

      console.log(
        'PRODUIT À MODIFIER :',
        response
      );


      this.chargement =
        false;


      if (
        !response ||
        response.success !== true
      ) {

        this.chargementImages =
          false;

        this.erreur =
          response?.message ||
          response?.error?.message ||
          'Impossible de récupérer le produit.';

        this.changeDetectorRef.detectChanges();

        return;
      }


      const produit =
        response?.data?.product ||
        response?.data?.produit ||
        response?.data ||
        response?.product ||
        response?.produit ||
        null;


      if (!produit) {

        this.chargementImages =
          false;

        this.erreur =
          'Produit introuvable.';

        this.changeDetectorRef.detectChanges();

        return;
      }


      this.produit =
        produit;


      this.variantes =
        Array.isArray(
          produit.variants
        )
          ? produit.variants
          : [];


      console.log(
        'VARIANTES DU PRODUIT À MODIFIER :',
        this.variantes
      );


      this.form = {

        categoryId:
          produit.categoryId ||
          '',

        name:
          produit.name ||
          '',

        description:
          produit.description ||
          '',

        brand:
          produit.brand ||
          '',

        status:
          produit.status ||
          'DRAFT',

        seoTitle:
          produit.seoTitle ||
          '',

        seoDescription:
          produit.seoDescription ||
          ''

      };


      const imagesBackend =
        produit.images ||
        produit.productImages ||
        produit.imagesProduit ||
        [];


      console.log(
        'IMAGES DU PRODUIT :',
        imagesBackend
      );


      if (
        Array.isArray(
          imagesBackend
        )
      ) {

        this.construireImages(
          imagesBackend
        );

      } else {

        this.images =
          [];

      }


      this.chargementImages =
        false;


      this.changeDetectorRef.detectChanges();

    },


    error: (
      error
    ) => {

      this.chargement =
        false;

      this.chargementImages =
        false;


      console.error(
        'ERREUR CHARGEMENT PRODUIT :',
        error
      );


      this.erreur =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Une erreur est survenue lors du chargement du produit.';


      this.changeDetectorRef.detectChanges();

    }

  });

}

modifierVariante(
variante: VarianteProduit
): void {

if (!variante?.id) {
  return;
}


this.erreurVariante =
  '';

this.erreurEnregistrementFinal =
  '';

this.messageSucces =
  '';


this.varianteEnEditionId =
  variante.id;


this.variantesEnEdition[
  variante.id
] = {

  sku:
    variante.sku ||
    '',

  name:
    variante.name ||
    '',

  size:
    variante.size ||
    '',

  color:
    variante.color ||
    '',

  model:
    variante.model ||
    '',

  price:
    Number(
      variante.price || 0
    ),

  compareAtPrice:
    variante.compareAtPrice !== null &&
    variante.compareAtPrice !== undefined
      ? Number(
          variante.compareAtPrice
        )
      : null,

  isActive:
    variante.isActive === true,

  lowStockThreshold:
    null

};


this.changeDetectorRef.detectChanges();

}

annulerModificationVariante(
varianteId: string
): void {

delete this.variantesEnEdition[
  varianteId
];


if (
  this.varianteEnEditionId ===
  varianteId
) {

  this.varianteEnEditionId =
    '';

}


this.erreurVariante =
  '';

this.erreurEnregistrementFinal =
  '';


this.changeDetectorRef.detectChanges();

}

enregistrerVariante(
variante: VarianteProduit
): void {

if (!variante?.id) {
  return;
}


if (
  this.varianteEnregistrementId ===
  variante.id
) {
  return;
}


const edition =
  this.variantesEnEdition[
    variante.id
  ];


if (!edition) {
  return;
}


this.erreurVariante =
  '';

this.erreurEnregistrementFinal =
  '';

this.messageSucces =
  '';


if (
  !edition.sku.trim()
) {

  this.erreurVariante =
    'Le SKU de la variante est obligatoire.';

  return;
}


if (
  !edition.name.trim()
) {

  this.erreurVariante =
    'Le nom de la variante est obligatoire.';

  return;
}


if (
  !Number.isFinite(
    Number(
      edition.price
    )
  ) ||
  Number(
    edition.price
  ) < 0
) {

  this.erreurVariante =
    'Le prix de la variante est invalide.';

  return;
}


if (
  edition.compareAtPrice !== null &&
  (
    !Number.isFinite(
      Number(
        edition.compareAtPrice
      )
    ) ||
    Number(
      edition.compareAtPrice
    ) < 0
  )
) {

  this.erreurVariante =
    'Le prix comparé est invalide.';

  return;
}


this.varianteEnregistrementId =
  variante.id;


const donnees = {

  sku:
    edition.sku.trim(),

  name:
    edition.name.trim(),

  size:
    edition.size.trim(),

  color:
    edition.color.trim(),

  model:
    edition.model.trim(),

  price:
    Number(
      edition.price
    ),

  compareAtPrice:
    edition.compareAtPrice === null ||
    edition.compareAtPrice === undefined
      ? null
      : Number(
          edition.compareAtPrice
        ),

  isActive:
    edition.isActive,

  ...(edition.lowStockThreshold !== null
    ? {
        lowStockThreshold:
          Number(
            edition.lowStockThreshold
          )
      }
    : {})

};


console.log(
  'DONNÉES MODIFICATION VARIANTE :',
  donnees
);


this.produitsService
  .modifierVariante(
    this.produitId,
    variante.id,
    donnees
  )
  .subscribe({

    next: (
      response: any
    ) => {

      console.log(
        'VARIANTE MODIFIÉE :',
        response
      );


      const index =
        this.variantes.findIndex(
          item =>
            item.id ===
            variante.id
        );


      if (index !== -1) {

        this.variantes[index] = {

          ...this.variantes[index],

          sku:
            donnees.sku,

          name:
            donnees.name,

          size:
            donnees.size,

          color:
            donnees.color,

          model:
            donnees.model,

          price:
            donnees.price,

          compareAtPrice:
            donnees.compareAtPrice,

          isActive:
            donnees.isActive

        };

      }


      this.varianteEnregistrementId =
        '';


      delete this.variantesEnEdition[
        variante.id
      ];


      this.varianteEnEditionId =
        '';


      this.changeDetectorRef.detectChanges();


      this.afficherMessageSucces(
        response?.message ||
        'La variante a été modifiée avec succès.'
      );

    },


    error: (
      error: any
    ) => {

      console.error(
        'ERREUR MODIFICATION VARIANTE :',
        error
      );


      this.varianteEnregistrementId =
        '';


      this.erreurVariante =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible de modifier la variante.';


      this.changeDetectorRef.detectChanges();

    }

  });

}

construireImages(
imagesBackend: any[]
): void {

console.log(
  'CONSTRUCTION DES IMAGES :',
  imagesBackend
);


this.images =
  imagesBackend
    .map(
      (
        image: any,
        index: number
      ) => {

        const fileId =
          image?.fileId ||
          image?.file?.id ||
          image?.fichierId ||
          image?.file?.fileId ||
          '';


        const imageId =
          image?.id ||
          image?.imageId ||
          '';


        const urlBackend =
          image?.url ||
          image?.file?.url ||
          '';


        let url =
          '';


        if (urlBackend) {

          if (
            urlBackend.startsWith(
              'https://api.commecheznous.fr'
            ) ||
            urlBackend.startsWith(
              'http://127.0.0.1:3000'
            )
          ) {

            url =
              urlBackend.replace(
                /^https?:\/\/(localhost|127\.0\.0\.1):3000/,
                ''
              );

          } else {

            url =
              urlBackend;

          }

        } else if (fileId) {

          url =
            '/api/v1/files/' +
            fileId;

        }


        const nom =
          image?.originalName ||
          image?.fileName ||
          image?.file?.originalName ||
          image?.name ||
          `Image ${index + 1}`;


        return {

          id:
            imageId,

          fileId:
            fileId,

          variantId:
            image?.variantId ||
            image?.variant?.id ||
            null,

          url:
            url,

          nom:
            nom,

          isPrimary:
            image?.isPrimary === true,

          sortOrder:
            Number(
              image?.sortOrder ??
              index
            )

        };

      }
    )
    .filter(
      image =>
        !!image.fileId ||
        !!image.url
    )
    .sort(
      (
        a,
        b
      ) =>
        a.sortOrder -
        b.sortOrder
    );


if (
  this.images.length > 0 &&
  !this.images.some(
    image =>
      image.isPrimary
  )
) {

  this.images =
    this.images.map(
      (
        image,
        index
      ) => ({

        ...image,

        isPrimary:
          index === 0

      })
    );

}


this.changeDetectorRef.detectChanges();

}

async ajouterImage(
event: Event
): Promise<void> {

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


input.value =
  '';


if (
  !this.validerImage(
    fichier
  )
) {

  return;

}


this.imageOperationEnCours =
  true;

this.imageOperationId =
  'add';

this.erreurImages =
  '';

this.messageSucces =
  '';


try {

  const fileId =
    await this.uploaderImage(
      fichier
    );


  const isPrimary =
    this.images.length === 0;


  const sortOrder =
    this.images.length;


  await this.associerImage(
    fileId,
    null,
    isPrimary,
    sortOrder
  );


  this.imageOperationEnCours =
    false;

  this.imageOperationId =
    '';


  this.changeDetectorRef.detectChanges();


  this.afficherMessageSucces(
    'L’image a été ajoutée avec succès.'
  );


  this.chargerProduit();

} catch (
  error: any
) {

  console.error(
    'ERREUR AJOUT IMAGE :',
    error
  );


  this.imageOperationEnCours =
    false;

  this.imageOperationId =
    '';


  this.erreurImages =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    'Impossible d’ajouter l’image.';


  this.changeDetectorRef.detectChanges();

}

}

async remplacerImage(
event: Event,
image: ImageProduitUpdate
): Promise<void> {

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


input.value =
  '';


if (
  !this.validerImage(
    fichier
  )
) {

  return;

}


this.imageOperationEnCours =
  true;

this.imageOperationId =
  image.id;

this.erreurImages =
  '';

this.messageSucces =
  '';


try {

  const nouveauFileId =
    await this.uploaderImage(
      fichier
    );


  await this.associerImage(
    nouveauFileId,
    image.variantId,
    image.isPrimary,
    image.sortOrder
  );


  await this.supprimerAssociationImage(
    image.id
  );


  this.imageOperationEnCours =
    false;

  this.imageOperationId =
    '';


  this.changeDetectorRef.detectChanges();


  this.afficherMessageSucces(
    'L’image a été remplacée avec succès.'
  );


  this.chargerProduit();

} catch (
  error: any
) {

  console.error(
    'ERREUR REMPLACEMENT IMAGE :',
    error
  );


  this.imageOperationEnCours =
    false;

  this.imageOperationId =
    '';


  this.erreurImages =
    error?.error?.error?.message ||
    error?.error?.message ||
    error?.message ||
    'Impossible de remplacer l’image.';


  this.changeDetectorRef.detectChanges();

}

}

supprimerImage(
image: ImageProduitUpdate
): void {

const confirmation =
  window.confirm(
    `Voulez-vous supprimer l'image "${image.nom}" du produit ?`
  );


if (!confirmation) {

  return;

}


this.imageOperationEnCours =
  true;

this.imageOperationId =
  image.id;

this.erreurImages =
  '';

this.messageSucces =
  '';


this.supprimerAssociationImage(
  image.id
)
  .then(
    () => {

      this.images =
        this.images.filter(
          item =>
            item.id !==
            image.id
        );


      this.imageOperationEnCours =
        false;

      this.imageOperationId =
        '';


      this.changeDetectorRef.detectChanges();


      this.afficherMessageSucces(
        'L’image a été supprimée avec succès.'
      );

    }
  )
  .catch(
    (
      error: any
    ) => {

      console.error(
        'ERREUR SUPPRESSION IMAGE :',
        error
      );


      this.imageOperationEnCours =
        false;

      this.imageOperationId =
        '';


      this.erreurImages =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible de supprimer l’image.';


      this.changeDetectorRef.detectChanges();

    }
  );

}

private validerImage(
fichier: File
): boolean {

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

  this.erreurImages =
    'Format non accepté. Utilisez JPG, PNG, WEBP ou GIF.';


  this.changeDetectorRef.detectChanges();

  return false;

}


const tailleMaximale =
  20 * 1024 * 1024;


if (
  fichier.size >
  tailleMaximale
) {

  this.erreurImages =
    'L’image ne doit pas dépasser 20 Mo.';


  this.changeDetectorRef.detectChanges();

  return false;

}


return true;

}

private uploaderImage(
fichier: File
): Promise<string> {

return new Promise(
  (
    resolve,
    reject
  ) => {

    this.filesService
      .upload(
        fichier,
        'PRODUCT_IMAGE'
      )
      .subscribe({

        next: (
          response: any
        ) => {

          console.log(
            'RÉPONSE UPLOAD IMAGE PRODUIT :',
            response
          );


          const fileId =
            response?.data?.id ||
            response?.id ||
            '';


          if (!fileId) {

            reject(
              new Error(
                'L’upload a réussi mais aucun identifiant de fichier n’a été retourné.'
              )
            );

            return;

          }


          resolve(
            fileId
          );

        },


        error: (
          error
        ) => {

          console.error(
            'ERREUR UPLOAD IMAGE PRODUIT :',
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

private associerImage(
fileId: string,
variantId: string | null,
isPrimary: boolean,
sortOrder: number
): Promise<any> {

return new Promise(
  (
    resolve,
    reject
  ) => {

    this.http
      .post(
        `/api/v1/admin/products/${this.produitId}/images`,
        {
          fileId,
          variantId,
          isPrimary,
          sortOrder
        },
        {
          withCredentials: true
        }
      )
      .subscribe({

        next: (
          response
        ) => {

          console.log(
            'IMAGE ASSOCIÉE AU PRODUIT :',
            response
          );


          resolve(
            response
          );

        },


        error: (
          error
        ) => {

          console.error(
            'ERREUR ASSOCIATION IMAGE :',
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

private supprimerAssociationImage(
imageId: string
): Promise<any> {

return new Promise(
  (
    resolve,
    reject
  ) => {

    this.http
      .delete(
        `/api/v1/admin/products/${this.produitId}/images/${imageId}`,
        {
          withCredentials: true
        }
      )
      .subscribe({

        next: (
          response
        ) => {

          console.log(
            'ASSOCIATION IMAGE SUPPRIMÉE :',
            response
          );


          resolve(
            response
          );

        },


        error: (
          error
        ) => {

          console.error(
            'ERREUR SUPPRESSION ASSOCIATION IMAGE :',
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

chargerCategories(): void {

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

      const data =
        response?.data;


      let liste:
        Categorie[] = [];


      if (
        Array.isArray(
          data
        )
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

      }


      this.categories =
        liste.filter(
          categorie =>
            categorie.isActive
        );


      this.construireCategoriesAffichage();


      this.changeDetectorRef.detectChanges();

    },


    error: (
      error
    ) => {

      console.error(
        'ERREUR CATÉGORIES :',
        error
      );

    }

  });

}

construireCategoriesAffichage(): void {

const principales =
  this.categories.filter(
    categorie =>
      !categorie.parentId
  );


const affichage:
  Categorie[] = [];


principales.forEach(
  principale => {

    const enfants =
      this.categories.filter(
        categorie =>
          categorie.parentId ===
          principale.id
      );


    affichage.push(
      principale
    );


    enfants.forEach(
      enfant => {

        affichage.push(
          enfant
        );

      }
    );

  }
);


this.categoriesAffichage =
  affichage;

}

estCategoriePrincipale(
categorie: Categorie
): boolean {

return !categorie.parentId;

}

getCategorieLabel(
categorie: Categorie
): string {

if (
  categorie.parentId
) {

  const parent =
    this.categories.find(
      item =>
        item.id ===
        categorie.parentId
    );


  if (parent) {

    return `${parent.name} > ${categorie.name}`;

  }

}


return categorie.name;

}

modifierProduit(): void {

if (this.enregistrement) {
  return;
}


this.erreur =
  '';

this.erreurEnregistrementFinal =
  '';


/*
 * Vérification importante :
 * une variante est encore ouverte en modification.
 *
 * Dans ce cas, on ne lance PAS l'enregistrement
 * général du produit.
 */
if (
  this.varianteEnEditionId
) {

  this.erreurEnregistrementFinal =
    'Une modification de variante est encore en cours. Veuillez enregistrer ou annuler cette modification avant d’enregistrer les modifications du produit.';

  this.changeDetectorRef.detectChanges();

  return;
}


if (
  !this.form.categoryId
) {

  this.erreur =
    'Veuillez sélectionner une catégorie.';

  return;

}


if (
  !this.form.name.trim()
) {

  this.erreur =
    'Le nom du produit est obligatoire.';

  return;

}


this.enregistrement =
  true;


const donnees:
  ProduitRequest = {

  categoryId:
    this.form.categoryId,

  name:
    this.form.name.trim(),

  description:
    this.form.description?.trim() ||
    '',

  brand:
    this.form.brand?.trim() ||
    '',

  status:
    this.form.status ||
    'DRAFT',

  seoTitle:
    this.form.seoTitle?.trim() ||
    '',

  seoDescription:
    this.form.seoDescription?.trim() ||
    ''

};


this.produitsService
  .updateProduit(
    this.produitId,
    donnees
  )
  .subscribe({

    next: (
      response: any
    ) => {

      console.log(
        'PRODUIT MODIFIÉ :',
        response
      );


      /*
       * Mise à jour locale.
       * Aucun appel à chargerProduit()
       * après l'enregistrement.
       */
      if (this.produit) {

        this.produit = {

          ...this.produit,

          ...donnees

        };

      }


      this.form = {

        ...this.form,

        ...donnees

      };


      this.enregistrement =
        false;


      this.changeDetectorRef.detectChanges();


      /*
       * SweetAlert2 uniquement pour
       * l'enregistrement général.
       */
      this.afficherSweetAlertSucces(
        'Modification enregistrée',
        response?.message ||
        'Les modifications du produit ont été enregistrées avec succès.'
      );

    },


    error: (
      error
    ) => {

      this.enregistrement =
        false;


      console.error(
        'ERREUR MODIFICATION PRODUIT :',
        error
      );


      this.erreur =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible de modifier le produit.';


      this.changeDetectorRef.detectChanges();


      this.afficherSweetAlertErreur(
        'Erreur lors de la modification',
        this.erreur
      );

    }

  });

}

retour(): void {

this.router.navigate([
  '/produits'
]);

}

voirDetail(): void {

if (
  !this.produitId
) {

  return;

}


this.router.navigate([
  '/produits',
  this.produitId
]);

}

getLibelleStatut(
status: ProduitStatus
): string {

switch (
  status
) {

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

imageErreur(
image: ImageProduitUpdate
): void {

console.error(
  'ERREUR AFFICHAGE IMAGE :',
  image
);

}

}