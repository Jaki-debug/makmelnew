import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ProduitsService } from '../services/produit';
import { CategoriesService } from '../services/categories';
import { FilesService } from '../services/files';
import {
ProduitRequest,
ProduitStatus,
VarianteProduit
} from '../models/produit';
import { Categorie } from '../models/categorie';
import Swal from 'sweetalert2';

interface VarianteForm {
sku: string;
name: string;
size: string;
color: string;
model: string;
price: number | null;
compareAtPrice: number | null;
isActive: boolean;
initialQuantity: number;
lowStockThreshold: number;
}

interface ImageProduit {
fileId: string;
imageId: string;
variantId: string | null;
nom: string;
url: string;
isPrimary: boolean;
sortOrder: number;
chargement: boolean;
erreur: string;
}

@Component({
selector: 'app-produit-create',
standalone: false,
templateUrl: './produit-create.html',
styleUrl: './produit-create.css'
})
export class ProduitCreate implements OnInit, OnDestroy {

private apiUrl = 'https://api.commecheznous.fr/api/v1';

etape = 1;
productId = '';

produit: ProduitRequest = {
categoryId: '',
name: '',
description: '',
brand: '',
status: 'DRAFT',
seoTitle: '',
seoDescription: ''
};

categories: Categorie[] = [];
categoriesAffichage: Categorie[] = [];
variantes: VarianteProduit[] = [];
images: ImageProduit[] = [];
fichiersSelectionnes: File[] = [];

private apercusFichiers = new Map<string, string>();

variante: VarianteForm = this.nouvelleVariante();

statuts: ProduitStatus[] = [
'DRAFT',
'ACTIVE',
'INACTIVE',
'ARCHIVED'
];

chargementCategories = true;
chargement = false;
chargementVariante = false;
chargementImage = false;
creationTerminee = false;

erreur = '';
succes = '';

constructor(
private produitsService: ProduitsService,
private categoriesService: CategoriesService,
private filesService: FilesService,
private http: HttpClient,
private router: Router,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerCategories();
}

ngOnDestroy(): void {
this.apercusFichiers.forEach(url => URL.revokeObjectURL(url));
this.apercusFichiers.clear();
}

chargerCategories(): void {
this.chargementCategories = true;
this.erreur = '';

this.categoriesService.getCategories(1, 100, '', true).subscribe({
  next: (response: any) => {
    console.log('RÉPONSE CATÉGORIES :', response);

    const candidats = [
      response?.data?.items,
      response?.data?.categories,
      response?.data?.data,
      response?.data,
      response?.items,
      response?.categories,
      response?.items?.data,
      response
    ];

    const liste = candidats.find(
      (element: any) => Array.isArray(element)
    );

    this.categories = (liste || [])
      .filter((categorie: any) =>
        categorie &&
        categorie.id &&
        categorie.name &&
        categorie.isActive !== false
      )
      .map((categorie: any) => ({
        ...categorie,
        parentId: categorie.parentId ?? categorie.parent?.id ?? null,
        sortOrder: Number(categorie.sortOrder ?? 0)
      }));

    this.construireCategoriesAffichage();

    console.log('CATÉGORIES CHARGÉES :', this.categories);
    console.log('CATÉGORIES AFFICHÉES :', this.categoriesAffichage);

    this.chargementCategories = false;
    this.cdr.detectChanges();
  },

  error: (error: any) => {
    console.error('ERREUR CHARGEMENT CATÉGORIES :', error);

    this.categories = [];
    this.categoriesAffichage = [];
    this.chargementCategories = false;

    this.erreur =
      error?.error?.error?.message ||
      error?.error?.message ||
      'Impossible de charger les catégories.';

    this.cdr.detectChanges();
  }
});

}

construireCategoriesAffichage(): void {
const resultat: Categorie[] = [];
const idsVisites = new Set<string>();

const ajouterAvecEnfants = (
  categorie: Categorie,
  niveau: number
): void => {
  if (idsVisites.has(categorie.id)) {
    return;
  }

  idsVisites.add(categorie.id);

  resultat.push(categorie);

  const enfants = this.categories
    .filter(item => item.parentId === categorie.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  enfants.forEach(enfant => {
    ajouterAvecEnfants(enfant, niveau + 1);
  });
};

const principales = this.categories
  .filter(categorie => !categorie.parentId)
  .sort((a, b) => a.sortOrder - b.sortOrder);

principales.forEach(categorie => {
  ajouterAvecEnfants(categorie, 0);
});

this.categories
  .filter(categorie => !idsVisites.has(categorie.id))
  .forEach(categorie => {
    ajouterAvecEnfants(categorie, 0);
  });

this.categoriesAffichage = resultat;

}

getNiveauCategorie(categorie: Categorie): number {
let niveau = 0;
let parentId = categorie.parentId;
const idsVisites = new Set<string>([categorie.id]);

while (parentId) {
  if (idsVisites.has(parentId)) {
    break;
  }

  idsVisites.add(parentId);

  const parent = this.categories.find(
    item => item.id === parentId
  );

  if (!parent) {
    break;
  }

  niveau++;
  parentId = parent.parentId;
}

return niveau;

}

getLibelleOptionCategorie(categorie: Categorie): string {
const niveau = this.getNiveauCategorie(categorie);
const prefixe = niveau > 0 ? '— '.repeat(niveau) : '';

return `${prefixe}${categorie.name}`;

}

getNomCategorie(categorie: Categorie): string {
const noms: string[] = [];
const idsVisites = new Set<string>();
let actuelle: Categorie | undefined = categorie;

while (actuelle && !idsVisites.has(actuelle.id)) {
  idsVisites.add(actuelle.id);
  noms.unshift(actuelle.name);

  actuelle = actuelle.parentId
    ? this.categories.find(item => item.id === actuelle!.parentId)
    : undefined;
}

return noms.join(' > ');

}

getCategorieSelectionnee(): string {
const categorie = this.categories.find(
item => item.id === this.produit.categoryId
);

return categorie
  ? this.getNomCategorie(categorie)
  : 'Non renseignée';

}

estCategoriePrincipale(categorie: Categorie): boolean {
return !categorie.parentId;
}

aDesSousCategories(categorie: Categorie): boolean {
return this.categories.some(
enfant => enfant.parentId === categorie.id
);
}

suivantEtape1(): void {
this.erreur = '';
this.succes = '';

if (!this.produit.categoryId) {
  this.erreur = 'Veuillez sélectionner une catégorie.';
  return;
}

const categorieExiste = this.categories.some(
  categorie => categorie.id === this.produit.categoryId
);

if (!categorieExiste) {
  this.erreur = 'La catégorie sélectionnée est introuvable. Rechargez les catégories.';
  return;
}

if (!this.produit.name || !this.produit.name.trim()) {
  this.erreur = 'Veuillez saisir le nom du produit.';
  return;
}

this.etape = 2;
this.cdr.detectChanges();

}

retourEtape1(): void {
this.erreur = '';
this.succes = '';
this.etape = 1;
this.cdr.detectChanges();
}

creerProduitEtContinuer(): void {
this.erreur = '';
this.succes = '';

if (!this.produit.seoTitle || !this.produit.seoTitle.trim()) {
  this.erreur = 'Veuillez saisir le titre SEO.';
  return;
}

if (this.chargement) {
  return;
}

this.chargement = true;

const donnees: ProduitRequest = {
  categoryId: this.produit.categoryId,
  name: this.produit.name.trim(),
  description: this.produit.description?.trim() || '',
  brand: this.produit.brand?.trim() || '',
  status: this.getStatutProduit(),
  seoTitle: this.produit.seoTitle.trim(),
  seoDescription: this.produit.seoDescription?.trim() || ''
};

console.log('DONNÉES ENVOYÉES POUR CRÉATION :', donnees);

this.produitsService.createProduit(donnees).subscribe({
  next: (response: any) => {
    console.log('RÉPONSE CRÉATION PRODUIT :', response);

    const produitCree =
      response?.data?.product ||
      response?.data ||
      response?.product ||
      response;

    const idProduit = produitCree?.id || '';

    if (!idProduit) {
      console.error('ID PRODUIT INTROUVABLE :', response);
      this.chargement = false;
      this.erreur = 'Le produit a été créé, mais son identifiant est introuvable.';
      this.cdr.detectChanges();
      return;
    }

    this.productId = idProduit;
    this.chargement = false;
    this.succes = 'Produit créé avec succès.';
    this.etape = 3;

    console.log('PRODUCT ID :', this.productId);
    this.cdr.detectChanges();
  },

  error: (error: any) => {
    this.chargement = false;
    console.error('ERREUR CRÉATION PRODUIT :', error);

    this.erreur =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.error?.data?.message ||
      error?.message ||
      'Une erreur est survenue lors de la création du produit.';

    this.cdr.detectChanges();
  }
});

}

nouvelleVariante(): VarianteForm {
return {
sku: '',
name: '',
size: '',
color: '',
model: '',
price: null,
compareAtPrice: null,
isActive: true,
initialQuantity: 0,
lowStockThreshold: 5
};
}

ajouterVariante(): void {
this.erreur = '';
this.succes = '';

if (!this.productId) {
  this.erreur = 'Le produit n’a pas encore été créé.';
  return;
}

if (!this.variante.sku?.trim()) {
  this.erreur = 'Veuillez saisir le SKU de la variante.';
  return;
}

if (!this.variante.name?.trim()) {
  this.erreur = 'Veuillez saisir le nom de la variante.';
  return;
}

if (
  this.variante.price === null ||
  this.variante.price === undefined ||
  this.variante.price < 0
) {
  this.erreur = 'Veuillez saisir un prix valide.';
  return;
}

if (
  this.variante.compareAtPrice !== null &&
  this.variante.compareAtPrice !== undefined
) {
  if (this.variante.compareAtPrice < 0) {
    this.erreur = 'Le prix comparé ne peut pas être négatif.';
    return;
  }

  if (this.variante.compareAtPrice < this.variante.price) {
    this.erreur = 'Le prix comparé doit être supérieur ou égal au prix de vente.';
    return;
  }
}

if (this.variante.initialQuantity < 0) {
  this.erreur = 'Le stock initial ne peut pas être négatif.';
  return;
}

if (this.variante.lowStockThreshold < 0) {
  this.erreur = 'Le seuil d’alerte stock ne peut pas être négatif.';
  return;
}

const sku = this.variante.sku.trim().toLowerCase();

if (
  this.variantes.some(
    varianteExistante => varianteExistante.sku.trim().toLowerCase() === sku
  )
) {
  this.erreur = 'Ce SKU est déjà utilisé pour une variante de ce produit.';
  return;
}

if (this.chargementVariante) {
  return;
}

this.chargementVariante = true;

const donnees = {
  sku: this.variante.sku.trim(),
  name: this.variante.name.trim(),
  size: this.variante.size?.trim() || '',
  color: this.variante.color?.trim() || '',
  model: this.variante.model?.trim() || '',
  price: this.variante.price,
  compareAtPrice: this.variante.compareAtPrice,
  isActive: this.variante.isActive,
  initialQuantity: this.variante.initialQuantity,
  lowStockThreshold: this.variante.lowStockThreshold
};

this.produitsService.ajouterVariante(this.productId, donnees).subscribe({
  next: (response: any) => {
    console.log('RÉPONSE VARIANTE :', response);

    const varianteBackend =
      response?.data?.variant ||
      response?.data ||
      response?.variant ||
      null;

    const varianteAjoutee: VarianteProduit = {
      id: varianteBackend?.id || '',
      sku: varianteBackend?.sku || donnees.sku,
      name: varianteBackend?.name ?? donnees.name,
      size: varianteBackend?.size ?? donnees.size,
      color: varianteBackend?.color ?? donnees.color,
      model: varianteBackend?.model ?? donnees.model,
      price: Number(varianteBackend?.price ?? donnees.price ?? 0),
      compareAtPrice:
        varianteBackend?.compareAtPrice ?? donnees.compareAtPrice ?? null,
      isActive: varianteBackend?.isActive ?? donnees.isActive,
      quantityAvailable:
        varianteBackend?.quantityAvailable ?? donnees.initialQuantity
    };

    this.variantes = [...this.variantes, varianteAjoutee];
    this.variante = this.nouvelleVariante();
    this.chargementVariante = false;
    this.succes = 'La variante a été ajoutée avec succès.';
    this.cdr.detectChanges();
  },

  error: (error: any) => {
    this.chargementVariante = false;
    console.error('ERREUR AJOUT VARIANTE :', error);

    this.erreur =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.error?.data?.message ||
      error?.message ||
      'Impossible d’ajouter la variante.';

    this.cdr.detectChanges();
  }
});

}

supprimerVariante(index: number): void {
if (index < 0 || index >= this.variantes.length) {
return;
}

const variante = this.variantes[index];

if (!variante) {
  return;
}

if (!variante.id) {
  this.variantes = this.variantes.filter((_, i) => i !== index);
  this.cdr.detectChanges();
  return;
}

Swal.fire({
  icon: 'warning',
  title: 'Supprimer la variante ?',
  text: 'Cette action est irréversible.',
  showCancelButton: true,
  confirmButtonText: 'Oui, supprimer',
  cancelButtonText: 'Annuler',
  confirmButtonColor: '#dc2626',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  allowOutsideClick: false
}).then(result => {
  if (!result.isConfirmed) {
    return;
  }

  this.produitsService.supprimerVariante(this.productId, variante.id).subscribe({
    next: () => {
      this.variantes = this.variantes.filter((_, i) => i !== index);
      this.cdr.detectChanges();

      Swal.fire({
        icon: 'success',
        title: 'Variante supprimée',
        text: 'La variante a été supprimée avec succès.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#111827',
        allowOutsideClick: false
      });
    },

    error: (error: any) => {
      console.error('ERREUR SUPPRESSION VARIANTE :', error);

      this.erreur =
        error?.error?.error?.message ||
        error?.error?.message ||
        'Impossible de supprimer la variante.';

      this.cdr.detectChanges();

      Swal.fire({
        icon: 'error',
        title: 'Suppression impossible',
        text: this.erreur,
        confirmButtonText: 'OK',
        confirmButtonColor: '#111827'
      });
    }
  });
});

}

terminerVariantes(): void {
this.erreur = '';
this.succes = '';
this.etape = 4;
this.cdr.detectChanges();
}

retourEtape2(): void {
this.erreur = '';
this.succes = '';
this.etape = 2;
this.cdr.detectChanges();
}

retourEtape3(): void {
this.erreur = '';
this.succes = '';
this.etape = 3;
this.cdr.detectChanges();
}

selectionnerImages(event: Event): void {
const input = event.target as HTMLInputElement;

if (!input.files || input.files.length === 0) {
  return;
}

this.erreur = '';
this.succes = '';

const fichiers = Array.from(input.files);
const typesAutorises = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const fichiersValides = fichiers.filter(
  fichier => typesAutorises.includes(fichier.type)
);

const fichiersRefuses = fichiers.filter(
  fichier => !typesAutorises.includes(fichier.type)
);

if (fichiersRefuses.length > 0) {
  this.erreur =
    'Certains fichiers ont été refusés. Utilisez uniquement JPG, PNG, WEBP ou GIF. Le format AVIF n’est pas pris en charge.';
}

const nouveauxFichiers: File[] = [];

fichiersValides.forEach(fichier => {
  const existeDeja = this.fichiersSelectionnes.some(
    fichierExistant =>
      this.getCleFichier(fichierExistant) === this.getCleFichier(fichier)
  );

  if (!existeDeja) {
    nouveauxFichiers.push(fichier);
  }
});

this.fichiersSelectionnes = [
  ...this.fichiersSelectionnes,
  ...nouveauxFichiers
];

input.value = '';
this.cdr.detectChanges();

}

private getCleFichier(fichier: File): string {
return [
fichier.name,
fichier.size,
fichier.lastModified
].join('_');
}

getNomFichier(fichier: File): string {
return fichier.name;
}

getApercuFichier(fichier: File): string {
const cle = this.getCleFichier(fichier);
const apercuExistant = this.apercusFichiers.get(cle);

if (apercuExistant) {
  return apercuExistant;
}

const url = URL.createObjectURL(fichier);
this.apercusFichiers.set(cle, url);

return url;

}

uploaderImages(): void {
this.erreur = '';
this.succes = '';

if (!this.productId) {
  this.erreur = 'Le produit n’a pas encore été créé.';
  return;
}

if (this.fichiersSelectionnes.length === 0) {
  this.erreur = 'Veuillez sélectionner au moins une image.';
  return;
}

if (this.chargementImage) {
  return;
}

this.chargementImage = true;

let nombreTraitees = 0;
let nombreErreurs = 0;

const fichiers = [...this.fichiersSelectionnes];
const total = fichiers.length;
const ordreBase = this.images.length;

fichiers.forEach((fichier, index) => {
  const apercuUrl = this.getApercuFichier(fichier);

  this.filesService.upload(fichier, 'PRODUCT_IMAGE').subscribe({
    next: (response: any) => {
      console.log('FICHIER UPLOADÉ :', response);

      const fileId =
        response?.data?.id ||
        response?.data?.fileId ||
        response?.id ||
        response?.fileId ||
        '';

      if (!fileId) {
        console.error('FILE ID INTROUVABLE :', response);
        nombreErreurs++;
        nombreTraitees++;

        this.verifierFinUpload(
          nombreTraitees,
          nombreErreurs,
          total
        );
        return;
      }

      const isPrimary = ordreBase === 0 && index === 0;
      const sortOrder = ordreBase + index;

      this.associerImageAuProduit(
        fileId,
        index,
        fichier.name,
        apercuUrl,
        isPrimary,
        sortOrder,
        () => {
          nombreTraitees++;
          this.verifierFinUpload(
            nombreTraitees,
            nombreErreurs,
            total
          );
        },
        () => {
          nombreTraitees++;
          nombreErreurs++;

          this.verifierFinUpload(
            nombreTraitees,
            nombreErreurs,
            total
          );
        }
      );
    },

    error: (error: any) => {
      console.error('ERREUR UPLOAD IMAGE COMPLÈTE :', error);
      console.error('DETAIL ERREUR BACKEND :', error?.error?.error);
      console.error('MESSAGE BACKEND :', error?.error?.error?.message);
      console.error('STATUT HTTP :', error?.status);
      console.error('RÉPONSE BACKEND COMPLÈTE :', error?.error);

      nombreTraitees++;
      nombreErreurs++;

      this.verifierFinUpload(
        nombreTraitees,
        nombreErreurs,
        total
      );
    }
  });
});

}

associerImageAuProduit(
fileId: string,
index: number,
nom: string,
apercuUrl: string,
isPrimary: boolean,
sortOrder: number,
succesCallback: () => void,
erreurCallback: () => void
): void {
const variantId = this.variantes.length > 0
? this.variantes[0].id || null
: null;

const imageData = {
  fileId,
  variantId,
  isPrimary,
  sortOrder
};

console.log('ASSOCIATION IMAGE AU PRODUIT :', imageData);

this.http.post<any>(
  `${this.apiUrl}/admin/products/${this.productId}/images`,
  imageData,
  { withCredentials: true }
).subscribe({
  next: (response: any) => {
    console.log('IMAGE ASSOCIÉE AU PRODUIT :', response);

    const imageId =
      response?.data?.id ||
      response?.data?.imageId ||
      response?.data?.image?.id ||
      response?.id ||
      response?.imageId ||
      '';

    const nouvelleImage: ImageProduit = {
      fileId,
      imageId,
      variantId,
      nom,
      url: apercuUrl,
      isPrimary,
      sortOrder,
      chargement: false,
      erreur: ''
    };

    this.images = [
      ...this.images,
      nouvelleImage
    ].sort((a, b) => a.sortOrder - b.sortOrder);

    this.cdr.detectChanges();
    succesCallback();
  },

  error: (error: any) => {
    console.error('ERREUR ASSOCIATION IMAGE :', error);

    this.erreur =
      error?.error?.error?.message ||
      error?.error?.message ||
      'Impossible d’associer l’image au produit.';

    this.cdr.detectChanges();
    erreurCallback();
  }
});

}

verifierFinUpload(
nombreTraitees: number,
nombreErreurs: number,
total: number
): void {
if (nombreTraitees < total) {
return;
}

this.chargementImage = false;

if (nombreErreurs === 0) {
  this.succes = 'Les images ont été ajoutées avec succès.';
  this.fichiersSelectionnes = [];
} else if (nombreErreurs < total) {
  this.succes =
    'Certaines images ont été ajoutées, mais certaines ont échoué.';
} else {
  this.erreur = 'Impossible d’ajouter les images sélectionnées.';
}

this.cdr.detectChanges();

}

supprimerImage(index: number): void {
if (index < 0 || index >= this.images.length) {
return;
}

const image = this.images[index];

if (!image) {
  return;
}

if (!image.imageId) {
  this.images = this.images.filter((_, i) => i !== index);
  this.recalculerImagesPrincipales();
  this.cdr.detectChanges();
  return;
}

Swal.fire({
  icon: 'warning',
  title: 'Supprimer l’image ?',
  text: 'Cette action est irréversible.',
  showCancelButton: true,
  confirmButtonText: 'Oui, supprimer',
  cancelButtonText: 'Annuler',
  confirmButtonColor: '#dc2626',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  allowOutsideClick: false
}).then(result => {
  if (!result.isConfirmed) {
    return;
  }

  this.http.delete(
    `${this.apiUrl}/admin/products/${this.productId}/images/${image.imageId}`,
    { withCredentials: true }
  ).subscribe({
    next: () => {
      this.images = this.images.filter((_, i) => i !== index);
      this.recalculerImagesPrincipales();
      this.cdr.detectChanges();

      Swal.fire({
        icon: 'success',
        title: 'Image supprimée',
        text: 'L’image a été supprimée avec succès.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#111827',
        allowOutsideClick: false
      });
    },

    error: (error: any) => {
      console.error('ERREUR SUPPRESSION IMAGE :', error);

      this.erreur =
        error?.error?.error?.message ||
        error?.error?.message ||
        'Impossible de supprimer cette image.';

      this.cdr.detectChanges();

      Swal.fire({
        icon: 'error',
        title: 'Suppression impossible',
        text: this.erreur,
        confirmButtonText: 'OK',
        confirmButtonColor: '#111827'
      });
    }
  });
});

}

definirImagePrincipale(index: number): void {
if (index < 0 || index >= this.images.length) {
return;
}

this.images = this.images.map((image, i) => ({
  ...image,
  isPrimary: i === index
}));

this.succes = 'Image principale définie.';
this.cdr.detectChanges();

}

recalculerImagesPrincipales(): void {
if (this.images.length === 0) {
return;
}

const imagePrincipaleExiste = this.images.some(
  image => image.isPrimary
);

if (!imagePrincipaleExiste) {
  this.images = this.images.map((image, index) => ({
    ...image,
    isPrimary: index === 0
  }));
}

this.images = this.images
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((image, index) => ({
    ...image,
    sortOrder: index
  }));

}

terminerImages(): void {
this.erreur = '';
this.succes = '';

this.recalculerImagesPrincipales();
this.creationTerminee = false;
this.etape = 5;

this.cdr.detectChanges();

}

retourEtape4(): void {
this.erreur = '';
this.succes = '';
this.etape = 4;
this.cdr.detectChanges();
}

getNombreVariantes(): number {
return this.variantes.length;
}

getNombreImages(): number {
return this.images.length;
}

getStatutProduit(): ProduitStatus {
return this.produit.status || 'DRAFT';
}

getLibelleStatutProduit(): string {
return this.getLibelleStatut(this.getStatutProduit());
}

getLibelleStatut(status: ProduitStatus): string {
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
return 'Brouillon';
}
}

terminerCreation(): void {
this.erreur = '';
this.succes = '';

if (!this.productId) {
  this.erreur =
    'Impossible de terminer la création : produit introuvable.';
  this.cdr.detectChanges();
  return;
}

this.creationTerminee = true;
this.succes = 'Produit créé avec succès.';
this.cdr.detectChanges();

Swal.fire({
  icon: 'success',
  title: 'Produit créé avec succès',
  text: 'Le produit a été créé et enregistré avec succès.',
  confirmButtonText: 'Voir le produit',
  confirmButtonColor: '#111827',
  allowOutsideClick: false,
  allowEscapeKey: false
}).then(result => {
  if (result.isConfirmed) {
    this.voirProduit();
  }
});

}

retourProduits(): void {
this.router.navigate(['/produits']);
}

voirProduit(): void {
if (!this.productId) {
this.router.navigate(['/produits']);
return;
}

this.router.navigate(['/produits', this.productId]);

}
}