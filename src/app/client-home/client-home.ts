import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { Router } from '@angular/router';

import { Subject } from 'rxjs';

import {
  finalize,
  take,
  takeUntil
} from 'rxjs/operators';

import { Produit } from '../models/produit';
import { Categorie } from '../models/categorie';

import { ClientCategoriesService } from '../services/client-categories';
import { ClientProduitsService } from '../services/client-produits';

// =====================================================
// INTERFACE PRODUIT DE LA PAGE D'ACCUEIL
// =====================================================

interface ProduitHome extends Produit {
  imageUrl?: string;
  imageFileId?: string;
}

// =====================================================
// INTERFACE CATÉGORIE DE LA PAGE D'ACCUEIL
// =====================================================

interface CategorieHome extends Categorie {
  imageUrl?: string;
  imageFileId?: string;
}

// =====================================================
// COMPOSANT CLIENT HOME
// =====================================================

@Component({
  selector: 'app-client-home',
  standalone: false,
  templateUrl: './client-home.html',
  styleUrl: './client-home.css'
})
export class ClientHome implements OnInit, OnDestroy {

  // =====================================================
  // DONNÉES
  // =====================================================

  produitsPopulaires: ProduitHome[] = [];

  /**
   * La page d'accueil conserve uniquement les catégories
   * principales. Les sous-catégories restent disponibles
   * dans le catalogue.
   */
  categories: CategorieHome[] = [];

  // =====================================================
  // ÉTATS DE CHARGEMENT
  // =====================================================

  chargementProduits = false;

  chargementCategories = false;

  erreurProduits = '';

  erreurCategories = '';

  // =====================================================
  // CONFIGURATION DES IMAGES
  // =====================================================

  private readonly imageParDefaut =
    'assets/images/products/product-default.jpg';

  // =====================================================
  // GESTION DES ABONNEMENTS
  // =====================================================

  private readonly destroy$ = new Subject<void>();

  // =====================================================
  // CONSTRUCTEUR
  // =====================================================

  constructor(
    private readonly router: Router,
    private readonly categoriesService: ClientCategoriesService,
    private readonly produitsService: ClientProduitsService
  ) {}

  // =====================================================
  // INITIALISATION
  // =====================================================

  ngOnInit(): void {
    this.chargerCategories();
    this.chargerProduits();
  }

  // =====================================================
  // DESTRUCTION DU COMPOSANT
  // =====================================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =====================================================
  // CHARGEMENT DES CATÉGORIES
  // =====================================================

  chargerCategories(): void {

    if (this.chargementCategories) {
      return;
    }

    this.chargementCategories = true;
    this.erreurCategories = '';

    this.categoriesService
      .getCategories()
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargementCategories = false;
        })
      )
      .subscribe({

        next: (reponse: any) => {

          if (reponse?.success === false) {
            this.categories = [];

            this.erreurCategories =
              reponse?.message ||
              'Impossible de charger les catégories.';

            return;
          }

          const categoriesBackend =
            this.extraireListe<any>(
              reponse,
              [
                'categories',
                'category',
                'catégories'
              ]
            );

          // Normalisation des catégories et de leurs images.
          const categoriesNormalisees =
            this.normaliserCategories(categoriesBackend);

          // IMPORTANT :
          // Afficher uniquement les catégories sans parent.
          this.categories =
            categoriesNormalisees.filter(
              (categorie: CategorieHome) =>
                this.estCategoriePrincipale(categorie)
            );
        },

        error: (error: any) => {

          console.error(
            'ERREUR CHARGEMENT CATÉGORIES :',
            error
          );

          this.categories = [];

          this.erreurCategories =
            error?.status === 0
              ? 'Le serveur est inaccessible. Vérifiez votre connexion.'
              : (
                  error?.error?.error?.message ||
                  error?.error?.message ||
                  'Impossible de charger les catégories. Réessayez.'
                );
        }
      });
  }

  // =====================================================
  // DÉTECTION DES CATÉGORIES PRINCIPALES
  // =====================================================

  private estCategoriePrincipale(
    categorie: CategorieHome
  ): boolean {

    const parentId = categorie.parentId;

    return (
      parentId === null ||
      parentId === undefined ||
      String(parentId).trim() === ''
    );
  }

  // =====================================================
  // NORMALISATION DES CATÉGORIES
  // =====================================================

  private normaliserCategories(
    liste: any[]
  ): CategorieHome[] {

    const resultat = new Map<string, CategorieHome>();

    const parcourir = (
      elements: any[],
      parentIdHerite: string | null = null
    ): void => {

      for (const element of elements) {

        if (!element || typeof element !== 'object') {
          continue;
        }

        const idBrut =
          element.id ??
          element._id;

        if (
          idBrut === null ||
          idBrut === undefined ||
          String(idBrut).trim() === ''
        ) {
          continue;
        }

        const nom =
          element.name ??
          element.nom;

        if (
          typeof nom !== 'string' ||
          nom.trim() === ''
        ) {
          continue;
        }

        const id = String(idBrut);

        const parentBrut =
          element.parentId ??
          element.parent_id ??
          element.parentCategoryId ??
          element.parent_category_id ??
          element.parent?.id ??
          element.parent?._id ??
          parentIdHerite ??
          null;

        const parentId =
          parentBrut === null ||
          parentBrut === undefined ||
          parentBrut === ''
            ? null
            : (
                typeof parentBrut === 'object'
                  ? String(
                      parentBrut.id ??
                      parentBrut._id ??
                      ''
                    ) || null
                  : String(parentBrut)
              );

        const estActive =
          element.isActive !== false &&
          element.is_active !== false &&
          element.active !== false;

        // Récupération de l'identifiant du fichier image.
        const imageFileId =
          this.getCategoryFileId(element);

        // Récupération de l'URL si elle existe déjà.
        const imageUrlExistante =
          this.getExistingCategoryImageUrl(element);

        const imageUrl = imageFileId
          ? this.construireUrlFichier(imageFileId)
          : (
              imageUrlExistante ||
              this.imageParDefaut
            );

        const categorie = {
          ...element,

          id,

          name: nom.trim(),

          parentId,

          description:
            element.description ?? null,

          imageId:
            imageFileId ||
            element.imageId ||
            element.image_id ||
            null,

          imageFileId:
            imageFileId || undefined,

          imageUrl,

          sortOrder: Number(
            element.sortOrder ??
            element.sort_order ??
            0
          ),

          isActive: estActive,

          parent: element.parent
            ? {
                ...element.parent,
                id: String(
                  element.parent.id ??
                  element.parent._id ??
                  ''
                )
              }
            : null

        } as CategorieHome;

        if (estActive) {
          resultat.set(id, categorie);
        }

        // Les sous-catégories sont normalisées pour identifier
        // correctement leurs parents, mais ne seront pas affichées
        // sur la page d'accueil.
        const enfants =
          element.children ??
          element.subcategories ??
          element.subCategories ??
          element.sub_categories ??
          [];

        if (Array.isArray(enfants)) {
          parcourir(enfants, id);
        }
      }
    };

    parcourir(Array.isArray(liste) ? liste : []);

    return Array.from(resultat.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }

  // =====================================================
  // CHARGEMENT DES PRODUITS
  // =====================================================

  chargerProduits(): void {

    if (this.chargementProduits) {
      return;
    }

    this.chargementProduits = true;
    this.erreurProduits = '';

    this.produitsService
      .getProduits(1, 8, '')
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        finalize(() => {
          this.chargementProduits = false;
        })
      )
      .subscribe({

        next: (reponse: any) => {

          if (reponse?.success === false) {

            this.produitsPopulaires = [];

            this.erreurProduits =
              reponse?.message ||
              'Impossible de charger les produits.';

            return;
          }

          const produitsBackend =
            this.extraireListe<any>(
              reponse,
              [
                'products',
                'produits',
                'product'
              ]
            );

          // Préparation des produits et de leurs images.
          this.produitsPopulaires =
            produitsBackend.map(
              (produit: any): ProduitHome => {

                const fileId =
                  this.getFileId(produit);

                const imageUrl = fileId
                  ? this.construireUrlFichier(fileId)
                  : this.getExistingImageUrl(produit);

                return {
                  ...produit,

                  id:
                    produit.id ??
                    produit._id,

                  imageFileId:
                    fileId || undefined,

                  imageUrl:
                    imageUrl || this.imageParDefaut

                } as ProduitHome;
              }
            );
        },

        error: (error: any) => {

          console.error(
            'ERREUR CHARGEMENT PRODUITS :',
            error
          );

          this.produitsPopulaires = [];

          this.erreurProduits =
            error?.status === 0
              ? 'Le serveur est inaccessible. Vérifiez votre connexion.'
              : (
                  error?.error?.error?.message ||
                  error?.error?.message ||
                  error?.message ||
                  'Impossible de charger les produits. Réessayez.'
                );
        }
      });
  }

  // =====================================================
  // EXTRACTION DES LISTES DE L'API
  // =====================================================

  private extraireListe<T>(
    reponse: unknown,
    clesMetier: string[],
    profondeur = 0
  ): T[] {

    if (Array.isArray(reponse)) {
      return reponse as T[];
    }

    if (
      !reponse ||
      typeof reponse !== 'object' ||
      profondeur > 6
    ) {
      return [];
    }

    const objet =
      reponse as Record<string, unknown>;

    const clesListes = [
      ...clesMetier,
      'items',
      'results',
      'docs',
      'content',
      'records'
    ];

    for (const cle of clesListes) {

      const valeur = objet[cle];

      if (Array.isArray(valeur)) {
        return valeur as T[];
      }
    }

    const clesEnveloppes = [
      'data',
      'result',
      'payload',
      'response'
    ];

    for (const cle of clesEnveloppes) {

      const valeur = objet[cle];

      if (
        valeur !== null &&
        typeof valeur === 'object'
      ) {

        const resultat = this.extraireListe<T>(
          valeur,
          clesMetier,
          profondeur + 1
        );

        if (resultat.length > 0) {
          return resultat;
        }

        if (Array.isArray(valeur)) {
          return valeur as T[];
        }
      }
    }

    return [];
  }

  // =====================================================
  // CONSTRUCTION DES URLS DE FICHIERS
  // =====================================================

  /**
   * Même route de fichiers que celle utilisée par le catalogue.
   */
  private construireUrlFichier(fileId: string): string {

    return `/api/v1/files/${encodeURIComponent(fileId)}`;
  }

  // =====================================================
  // IMAGES DES CATÉGORIES
  // =====================================================

  /**
   * Récupère l'identifiant du fichier image d'une catégorie.
   */
  private getCategoryFileId(categorie: any): string {

    const image =
      categorie?.image ??
      categorie?.imageFile ??
      categorie?.image_file ??
      null;

    const valeur =
      categorie?.imageFileId ||
      categorie?.image_file_id ||
      categorie?.imageId ||
      categorie?.image_id ||
      categorie?.primaryImageFileId ||
      categorie?.primary_image_file_id ||
      image?.fileId ||
      image?.file_id ||
      image?.file?.id ||
      image?.file?._id ||
      image?.file?.fileId ||
      image?.file?.file_id ||
      categorie?.images?.[0]?.fileId ||
      categorie?.images?.[0]?.file_id ||
      categorie?.images?.[0]?.file?.id ||
      categorie?.images?.[0]?.file?._id ||
      categorie?.images?.[0]?.file?.fileId ||
      null;

    if (valeur && typeof valeur === 'object') {

      const id =
        valeur.id ??
        valeur._id ??
        valeur.fileId ??
        valeur.file_id;

      return id == null ? '' : String(id);
    }

    return valeur == null ? '' : String(valeur);
  }

  /**
   * Récupère une URL d'image déjà fournie par le backend.
   */
  private getExistingCategoryImageUrl(
    categorie: any
  ): string {

    let url =
      categorie?.imageUrl ||
      categorie?.imageURL ||
      categorie?.image_url ||
      categorie?.image?.url ||
      categorie?.image?.imageUrl ||
      categorie?.image?.image_url ||
      categorie?.imageFile?.url ||
      categorie?.image_file?.url ||
      categorie?.images?.[0]?.url ||
      categorie?.images?.[0]?.imageUrl ||
      '';

    if (typeof url !== 'string') {
      return '';
    }

    url = url.trim();

    if (!url) {
      return '';
    }

    return this.normaliserUrlImage(url);
  }

  /**
   * Remplace une URL locale absolue par son chemin relatif
   * lorsque le backend répond avec localhost:3000.
   */
  private normaliserUrlImage(url: string): string {

    return url.replace(
      /^http:\/\/(localhost|127\.0\.0\.1):3000/,
      ''
    );
  }

  /**
   * Appelée par le HTML lorsqu'une image de catégorie échoue.
   */
  imageErreurCategorie(categorie: CategorieHome): void {

    if (!categorie) {
      return;
    }

    if (categorie.imageUrl !== this.imageParDefaut) {
      categorie.imageUrl = this.imageParDefaut;
    }
  }

  // =====================================================
  // IMAGES DES PRODUITS
  // =====================================================

  /**
   * Reprend les différents formats d'identifiants rencontrés
   * dans les données du catalogue.
   */
  getFileId(produit: any): string {

    const valeur =
      produit?.primaryImageFileId ||
      produit?.primary_image_file_id ||
      produit?.primaryImage?.fileId ||
      produit?.primaryImage?.file_id ||
      produit?.primaryImage?.file?.id ||
      produit?.primaryImage?.file?._id ||
      produit?.primaryImage?.file?.fileId ||
      produit?.imageFileId ||
      produit?.image_file_id ||
      produit?.imageId ||
      produit?.image_id ||
      produit?.image?.fileId ||
      produit?.image?.file_id ||
      produit?.image?.file?.id ||
      produit?.image?.file?._id ||
      produit?.image?.file?.fileId ||
      produit?.images?.[0]?.fileId ||
      produit?.images?.[0]?.file_id ||
      produit?.images?.[0]?.file?.id ||
      produit?.images?.[0]?.file?._id ||
      produit?.images?.[0]?.file?.fileId ||
      produit?.productImages?.[0]?.fileId ||
      produit?.productImages?.[0]?.file_id ||
      produit?.productImages?.[0]?.file?.id ||
      produit?.productImages?.[0]?.file?._id ||
      produit?.productImages?.[0]?.file?.fileId ||
      produit?.imagesProduit?.[0]?.fileId ||
      produit?.imagesProduit?.[0]?.file?.id ||
      produit?.imagesProduit?.[0]?.file?.fileId ||
      '';

    if (valeur && typeof valeur === 'object') {

      const id =
        valeur.id ??
        valeur._id ??
        valeur.fileId ??
        valeur.file_id;

      return id == null ? '' : String(id);
    }

    return valeur == null ? '' : String(valeur);
  }

  /**
   * Récupère une URL d'image déjà présente dans le produit.
   */
  getExistingImageUrl(produit: any): string {

    const url =
      produit?.primaryImageUrl ||
      produit?.primary_image_url ||
      produit?.primaryImage?.url ||
      produit?.primaryImage?.imageUrl ||
      produit?.imageUrl ||
      produit?.imageURL ||
      produit?.image_url ||
      produit?.image?.url ||
      produit?.image?.imageUrl ||
      produit?.images?.[0]?.url ||
      produit?.images?.[0]?.imageUrl ||
      produit?.productImages?.[0]?.url ||
      produit?.productImages?.[0]?.imageUrl ||
      produit?.imagesProduit?.[0]?.url ||
      '';

    if (typeof url !== 'string') {
      return '';
    }

    const urlNettoyee = url.trim();

    if (!urlNettoyee) {
      return '';
    }

    return this.normaliserUrlImage(urlNettoyee);
  }

  /**
   * Renvoie l'image à afficher dans la carte du produit.
   */
  getImage(produit: ProduitHome): string {

    return (
      produit?.imageUrl ||
      this.imageParDefaut
    );
  }

  /**
   * Remplace une image de produit qui n'a pas pu être chargée.
   */
  imageErreur(produit: ProduitHome): void {

    if (!produit) {
      return;
    }

    if (produit.imageUrl !== this.imageParDefaut) {
      produit.imageUrl = this.imageParDefaut;
    }
  }

  // =====================================================
  // NOM DU PRODUIT
  // =====================================================

  nomProduit(produit: Produit): string {

    const p = produit as any;

    const nom =
      p?.name ??
      p?.nom ??
      p?.title ??
      p?.titre ??
      p?.productName ??
      p?.product_name ??
      p?.nomProduit;

    return (
      typeof nom === 'string' &&
      nom.trim() !== ''
    )
      ? nom.trim()
      : 'Produit';
  }

  // =====================================================
  // DESCRIPTION DU PRODUIT
  // =====================================================

  descriptionProduit(produit: Produit): string {

    const p = produit as any;

    const description =
      p?.shortDescription ??
      p?.short_description ??
      p?.description ??
      p?.resume ??
      p?.details;

    return typeof description === 'string'
      ? description.trim()
      : '';
  }

  // =====================================================
  // PRIX DU PRODUIT
  // =====================================================

  prixProduit(produit: Produit): string {

    const p = produit as any;

    const brut =
      p?.minPrice ??
      p?.price ??
      p?.prix ??
      p?.sellingPrice ??
      p?.selling_price ??
      p?.salePrice ??
      p?.sale_price ??
      p?.unitPrice ??
      p?.unit_price;

    const montant =
      typeof brut === 'object' && brut !== null
        ? (
            brut.amount ??
            brut.value ??
            brut.price
          )
        : brut;

    if (
      montant === null ||
      montant === undefined ||
      montant === ''
    ) {
      return '';
    }

    const nombre = Number(montant);

    if (!Number.isFinite(nombre)) {
      return String(montant);
    }

    return (
      new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 0
      }).format(nombre) +
      ' FCFA'
    );
  }

  // =====================================================
  // NAVIGATION VERS LA BOUTIQUE
  // =====================================================

  rechercher(): void {

    this.router.navigate([
      '/client/produitcatalogue'
    ]);
  }

  // =====================================================
  // NAVIGATION VERS UNE CATÉGORIE
  // =====================================================

  voirCategorie(categorie: Categorie): void {

    const valeur = categorie as any;

    const id =
      valeur?.id ??
      valeur?._id;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ''
    ) {
      return;
    }

    this.router.navigate(
      ['/client/produitcatalogue'],
      {
        queryParams: {
          category: String(id)
        }
      }
    );
  }

  // =====================================================
  // NAVIGATION VERS UN PRODUIT
  // =====================================================

  voirProduit(produit: Produit): void {

    const valeur = produit as any;

    const id =
      valeur?.id ??
      valeur?._id;

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ''
    ) {
      return;
    }

    this.router.navigate([
      '/client/produit',
      String(id)
    ]);
  }

  // =====================================================
  // TRACKBY CATÉGORIES
  // =====================================================

  suivreCategorie(
    index: number,
    categorie: Categorie
  ): string | number {

    const valeur = categorie as any;

    return (
      valeur?.id ??
      valeur?._id ??
      index
    );
  }

  // =====================================================
  // TRACKBY PRODUITS
  // =====================================================

  suivreProduit(
    index: number,
    produit: Produit
  ): string | number {

    const valeur = produit as any;

    return (
      valeur?.id ??
      valeur?._id ??
      index
    );
  }

  // =====================================================
  // AJOUT AU PANIER
  // =====================================================

  ajouterAuPanier(produit: Produit): void {

    // À raccorder au service ClientPanier si l'ajout rapide
    // au panier est activé sur la page d'accueil.

    console.info(
      'Produit sélectionné pour le panier :',
      produit
    );
  }
}