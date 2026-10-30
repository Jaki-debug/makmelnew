
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  EMPTY,
  Observable,
  Subscription,
  of,
  throwError
} from 'rxjs';

import {
  catchError,
  finalize,
  map,
  switchMap,
  tap
} from 'rxjs/operators';

import { ClientProduitsService } from '../services/client-produits';
import { ClientCategoriesService } from '../services/client-categories';
import { ClientPanier } from '../services/client-panier';

import { Produit } from '../models/produit';
import { Categorie } from '../models/categorie';

import type {
  FiltresClientProduit
} from '../client-produit-filtres-couleur/client-produit-filtres-couleur';

interface ProduitClient extends Produit {
  imageUrl?: string;
  imageFileId?: string;
}

@Component({
  selector: 'app-client-produit-catalogue',
  standalone: false,
  templateUrl: './client-produit-catalogue.html',
  styleUrl: './client-produit-catalogue.css'
})
export class ClientProduitCatalogue implements OnInit, OnDestroy {

  recherche = '';

  produits: ProduitClient[] = [];

  categories: Categorie[] = [];

  categorieSelectionneeId = '';

  chargement = true;

  erreur = '';

  categoriesMap: { [key: string]: string } = {};

  ajoutEnCoursId: string | null = null;

  messagePanier = '';

  erreurAjoutPanier = '';

  // Filtres reçus du composant de filtres.
  filtresActifs: FiltresClientProduit = {};

  private rechercheSubscription?: Subscription;
  private categoriesSubscription?: Subscription;
  private produitsSubscription?: Subscription;
  private ajoutPanierSubscription?: Subscription;

  private variantesCache = new Map<string, any>();

  private readonly imageParDefaut =
    'assets/images/products/product-default.jpg';

  constructor(
    private produitsService: ClientProduitsService,
    private categoriesService: ClientCategoriesService,
    private panierService: ClientPanier,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.rechercheSubscription =
      this.route.queryParamMap.subscribe(params => {
        this.recherche = params.get('search') || '';

        this.categorieSelectionneeId = String(
          params.get('category') || ''
        ).trim().toLowerCase();

        this.changeDetectorRef.detectChanges();
      });

    this.chargerCategories();
    this.chargerProduits();
  }

  ngOnDestroy(): void {
    this.rechercheSubscription?.unsubscribe();
    this.categoriesSubscription?.unsubscribe();
    this.produitsSubscription?.unsubscribe();
    this.ajoutPanierSubscription?.unsubscribe();
  }

  // =====================================================
  // CATÉGORIES
  // =====================================================

  chargerCategories(): void {
    this.categoriesSubscription?.unsubscribe();

    this.categoriesSubscription =
      this.categoriesService.getCategories().subscribe({
        next: (response: any) => {
          let categoriesBackend: any[] = [];

          if (Array.isArray(response?.data?.items)) {
            categoriesBackend = response.data.items;
          } else if (Array.isArray(response?.data?.categories)) {
            categoriesBackend = response.data.categories;
          } else if (Array.isArray(response?.data?.data)) {
            categoriesBackend = response.data.data;
          } else if (Array.isArray(response?.data)) {
            categoriesBackend = response.data;
          } else if (Array.isArray(response?.items)) {
            categoriesBackend = response.items;
          } else if (Array.isArray(response?.categories)) {
            categoriesBackend = response.categories;
          } else if (Array.isArray(response)) {
            categoriesBackend = response;
          }

          this.categories =
            this.extraireCategories(categoriesBackend);

          this.categoriesMap = {};

          this.categories.forEach((categorie: Categorie) => {
            const id = String(categorie.id)
              .trim()
              .toLowerCase();

            const nom = String(categorie.name || '').trim();

            if (id && nom) {
              this.categoriesMap[id] = nom;
            }
          });

          this.verifierCategoriesProduits();

          this.changeDetectorRef.detectChanges();
        },

        error: (error: any) => {
          console.error('ERREUR CATEGORIES :', error);

          this.categories = [];
          this.categoriesMap = {};

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  extraireCategories(liste: any[]): Categorie[] {
    const resultat = new Map<string, Categorie>();

    const parcourir = (
      elements: any[],
      parentIdHerite: string | null = null
    ): void => {
      for (const element of elements) {
        if (!element || element.id == null) {
          continue;
        }

        const nom = element.name ?? element.nom;

        if (!nom) {
          continue;
        }

        const id = String(element.id);

        const parentIdBrut =
          element.parentId ??
          element.parent_id ??
          element.parent?.id ??
          parentIdHerite ??
          null;

        const parentId = parentIdBrut == null
          ? null
          : String(parentIdBrut);

        const categorie: Categorie = {
          id,
          name: String(nom),
          parentId,
          description: element.description ?? null,
          imageId: element.imageId ?? element.image_id ?? null,
          sortOrder: Number(
            element.sortOrder ?? element.sort_order ?? 0
          ),
          isActive:
            element.isActive !== false &&
            element.is_active !== false,
          parent: element.parent
            ? {
                ...element.parent,
                id: String(element.parent.id)
              }
            : null
        };

        if (categorie.isActive) {
          resultat.set(id, categorie);
        }

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
    this.produitsSubscription?.unsubscribe();

    this.chargement = true;
    this.erreur = '';

    this.produitsSubscription =
      this.produitsService.getProduits(1, 50, '').subscribe({
        next: (response: any) => {
          let produitsBackend: any[] = [];

          if (Array.isArray(response?.data?.items)) {
            produitsBackend = response.data.items;
          } else if (Array.isArray(response?.data?.products)) {
            produitsBackend = response.data.products;
          } else if (Array.isArray(response?.data?.data)) {
            produitsBackend = response.data.data;
          } else if (Array.isArray(response?.data)) {
            produitsBackend = response.data;
          } else if (Array.isArray(response?.items)) {
            produitsBackend = response.items;
          } else if (Array.isArray(response?.products)) {
            produitsBackend = response.products;
          } else if (Array.isArray(response)) {
            produitsBackend = response;
          }

          this.produits = produitsBackend.map((produit: any) => {
            const fileId = this.getFileId(produit);

            const imageUrl = fileId
              ? `/api/v1/files/${fileId}`
              : this.getExistingImageUrl(produit);

            const produitClient: ProduitClient = {
              ...produit,
              imageFileId: fileId,
              imageUrl
            };

            const variante =
              this.obtenirVarianteConnue(produitClient);

            if (variante && produitClient.id != null) {
              this.variantesCache.set(
                String(produitClient.id),
                variante
              );
            }

            return produitClient;
          });

          this.verifierCategoriesProduits();

          this.chargement = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error: any) => {
          console.error('ERREUR PRODUITS :', error);

          this.produits = [];

          this.erreur =
            error?.error?.error?.message ||
            error?.error?.message ||
            error?.message ||
            'Impossible de charger les produits.';

          this.chargement = false;

          this.changeDetectorRef.detectChanges();
        }
      });
  }

  verifierCategoriesProduits(): void {
    this.produits.forEach((produit: ProduitClient) => {
      const categorie = this.getCategorie(produit);

      if (!categorie) {
        return;
      }
    });
  }

  // =====================================================
  // NORMALISATION DES CATÉGORIES DES PRODUITS
  // =====================================================

  private ajouterIdentifiantCategorie(
    resultat: Set<string>,
    valeur: any
  ): void {
    if (valeur == null || valeur === '') {
      return;
    }

    if (typeof valeur === 'object') {
      if (Array.isArray(valeur)) {
        valeur.forEach(element => {
          this.ajouterIdentifiantCategorie(resultat, element);
        });

        return;
      }

      const id =
        valeur.id ??
        valeur.categoryId ??
        valeur.category_id ??
        valeur.categorieId ??
        valeur.categorie_id ??
        valeur.productCategoryId ??
        valeur.product_category_id;

      if (id != null && id !== '') {
        resultat.add(String(id).trim().toLowerCase());
      }

      return;
    }

    resultat.add(String(valeur).trim().toLowerCase());
  }

  getCategoryIds(produit: Produit): Set<string> {
    const p = produit as any;
    const resultat = new Set<string>();

    [
      'categoryId',
      'category_id',
      'categorieId',
      'categorie_id',
      'productCategoryId',
      'product_category_id'
    ].forEach(champ => {
      this.ajouterIdentifiantCategorie(resultat, p?.[champ]);
    });

    [
      'category',
      'categorie',
      'productCategory',
      'product_category'
    ].forEach(champ => {
      this.ajouterIdentifiantCategorie(resultat, p?.[champ]);
    });

    [
      'categories',
      'productCategories',
      'product_categories',
      'categoriesProduit'
    ].forEach(champ => {
      this.ajouterIdentifiantCategorie(resultat, p?.[champ]);
    });

    return resultat;
  }

  getCategoryId(produit: Produit): string {
    return this.getCategoryIds(produit).values().next().value || '';
  }

  getCategorie(produit: Produit): string {
    const p = produit as any;
    const categoryId = this.getCategoryId(produit);

    if (p?.category?.name || p?.category?.nom) {
      return p.category.name || p.category.nom;
    }

    if (p?.categorie?.name || p?.categorie?.nom) {
      return p.categorie.name || p.categorie.nom;
    }

    if (p?.categoryName || p?.category_name) {
      return p.categoryName || p.category_name;
    }

    if (p?.categories?.length) {
      const premiereCategorie = p.categories[0];

      if (premiereCategorie?.name || premiereCategorie?.nom) {
        return premiereCategorie.name || premiereCategorie.nom;
      }
    }

    if (!categoryId) {
      return 'Sans catégorie';
    }

    return this.categoriesMap[categoryId] || 'Sans catégorie';
  }

  // =====================================================
  // IMAGES
  // =====================================================

  getFileId(produit: any): string {
    return (
      produit?.primaryImageFileId ||
      produit?.primaryImage?.fileId ||
      produit?.primaryImage?.file?.id ||
      produit?.primaryImage?.file?.fileId ||
      produit?.image?.fileId ||
      produit?.image?.file?.id ||
      produit?.image?.file?.fileId ||
      produit?.images?.[0]?.fileId ||
      produit?.images?.[0]?.file?.id ||
      produit?.images?.[0]?.file?.fileId ||
      produit?.productImages?.[0]?.fileId ||
      produit?.productImages?.[0]?.file?.id ||
      produit?.productImages?.[0]?.file?.fileId ||
      produit?.imagesProduit?.[0]?.fileId ||
      produit?.imagesProduit?.[0]?.file?.id ||
      produit?.imagesProduit?.[0]?.file?.fileId ||
      ''
    );
  }

  getExistingImageUrl(produit: any): string {
    let url =
      produit?.primaryImageUrl ||
      produit?.primaryImage?.url ||
      produit?.imageUrl ||
      produit?.image?.url ||
      produit?.images?.[0]?.url ||
      produit?.productImages?.[0]?.url ||
      produit?.imagesProduit?.[0]?.url ||
      '';

    if (
      typeof url === 'string' &&
      (
        url.startsWith('https://api.commecheznous.fr') ||
        url.startsWith('http://127.0.0.1:3000')
      )
    ) {
      url = url.replace(
        /^http:\/\/(localhost|127\.0\.0\.1):3000/,
        ''
      );
    }

    return typeof url === 'string' ? url : '';
  }

  getImage(produit: ProduitClient): string {
    return produit.imageUrl || this.imageParDefaut;
  }

  imageErreur(produit: ProduitClient): void {
    produit.imageUrl = this.imageParDefaut;

    this.changeDetectorRef.detectChanges();
  }

  // =====================================================
  // CATÉGORIES ET FILTRES
  // =====================================================

  filtrerParCategorie(categorieId: string): void {
    this.categorieSelectionneeId = String(
      categorieId || ''
    ).trim().toLowerCase();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.categorieSelectionneeId || null
      },
      queryParamsHandling: 'merge'
    });
  }

  getIdsCategorieEtDescendants(
    categorieId: string
  ): Set<string> {
    const ids = new Set<string>();
    const aExplorer: string[] = [categorieId];

    while (aExplorer.length > 0) {
      const idCourant = aExplorer.pop()!
        .trim()
        .toLowerCase();

      if (!idCourant || ids.has(idCourant)) {
        continue;
      }

      ids.add(idCourant);

      const enfants = this.categories.filter(categorie =>
        String(categorie.parentId ?? '')
          .trim()
          .toLowerCase() === idCourant
      );

      for (const enfant of enfants) {
        const enfantId = String(enfant.id)
          .trim()
          .toLowerCase();

        if (!ids.has(enfantId)) {
          aExplorer.push(enfantId);
        }
      }
    }

    return ids;
  }

  /** Reçoit les filtres envoyés par le composant de filtres. */
  appliquerFiltres(filtres: FiltresClientProduit): void {
    this.filtresActifs = { ...(filtres || {}) };

    this.changeDetectorRef.detectChanges();
  }

  /** Filtre les produits selon la recherche, la catégorie et les critères. */
  produitsFiltres(): ProduitClient[] {
    const recherche = this.recherche
      .trim()
      .toLocaleLowerCase('fr');

    const categorieId = String(
      this.categorieSelectionneeId || ''
    ).trim().toLowerCase();

    const idsAutorises = categorieId
      ? this.getIdsCategorieEtDescendants(categorieId)
      : null;

    return this.produits.filter((produit: ProduitClient) => {
      const idsProduit = this.getCategoryIds(produit);

      const correspondCategorie =
        !idsAutorises ||
        Array.from(idsProduit).some(id => idsAutorises.has(id));

      const texteRecherche = [
        (produit as any)?.name,
        (produit as any)?.description,
        (produit as any)?.brand?.name,
        (produit as any)?.brandName,
        (produit as any)?.brand_name,
        this.getCategorie(produit)
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fr');

      const correspondRecherche =
        !recherche || texteRecherche.includes(recherche);

      return (
        correspondCategorie &&
        correspondRecherche &&
        this.correspondAuxFiltresProduit(
          produit,
          this.filtresActifs
        )
      );
    });
  }

  private correspondAuxFiltresProduit(
    produit: ProduitClient,
    filtres: FiltresClientProduit
  ): boolean {
    const aDesFiltres =
      filtres.minPrice !== undefined ||
      filtres.maxPrice !== undefined ||
      !!filtres.size?.trim() ||
      !!filtres.color?.trim() ||
      !!filtres.brand?.trim() ||
      filtres.inStock !== undefined;

    if (!aDesFiltres) {
      return true;
    }

    const variantes = this.extraireVariantes(produit);

    // Les critères de variante doivent correspondre à une même variante.
    const candidats = variantes.length > 0
      ? variantes
      : [produit];

    return candidats.some((variante: any) => {
      const taille = this.texteChamp(
        variante?.size ??
        variante?.attributes?.size ??
        variante?.options?.size ??
        (produit as any)?.size ??
        (produit as any)?.attributes?.size
      );

      const couleur = this.texteChamp(
        variante?.color ??
        variante?.colour ??
        variante?.attributes?.color ??
        variante?.attributes?.colour ??
        variante?.options?.color ??
        (produit as any)?.color ??
        (produit as any)?.colour ??
        (produit as any)?.attributes?.color
      );

      const marque = this.texteChamp(
        (produit as any)?.brand?.name ??
        (produit as any)?.brand?.label ??
        (produit as any)?.brandName ??
        (produit as any)?.brand_name ??
        (produit as any)?.manufacturer ??
        (produit as any)?.brand ??
        variante?.brand?.name ??
        variante?.brandName
      );

      if (
        filtres.size?.trim() &&
        !this.texteContient(taille, filtres.size)
      ) {
        return false;
      }

      if (
        filtres.color?.trim() &&
        !this.texteContient(couleur, filtres.color)
      ) {
        return false;
      }

      if (
        filtres.brand?.trim() &&
        !this.texteContient(marque, filtres.brand)
      ) {
        return false;
      }

      const prix = this.obtenirPrixFiltrable(
        produit as any,
        variante
      );

      if (
        filtres.minPrice !== undefined &&
        prix.max < filtres.minPrice
      ) {
        return false;
      }

      if (
        filtres.maxPrice !== undefined &&
        prix.min > filtres.maxPrice
      ) {
        return false;
      }

      if (filtres.inStock !== undefined) {
        const disponible = this.disponibiliteVariante(
          variante,
          produit as any
        );

        // Si le stock est inconnu, on ne suppose pas que le produit
        // est disponible ou indisponible.
        if (
          disponible === null ||
          disponible !== filtres.inStock
        ) {
          return false;
        }
      }

      return true;
    });
  }

  private texteChamp(valeur: any): string {
    if (valeur === null || valeur === undefined) {
      return '';
    }

    if (typeof valeur === 'object') {
      return String(
        valeur.name ?? valeur.label ?? valeur.value ?? ''
      ).trim();
    }

    return String(valeur).trim();
  }

  private texteContient(
    valeur: string,
    recherche: string
  ): boolean {
    return valeur
      .toLocaleLowerCase('fr')
      .includes(recherche.trim().toLocaleLowerCase('fr'));
  }

  /** Renvoie une plage de prix pour les produits à variantes. */
  private obtenirPrixFiltrable(
    produit: any,
    variante: any
  ): { min: number; max: number } {
    const prixVariante = this.nombreValide(
      variante?.price ??
      variante?.prix ??
      variante?.salePrice ??
      variante?.sale_price
    );

    if (prixVariante !== null) {
      return {
        min: prixVariante,
        max: prixVariante
      };
    }

    const prixSimple = this.nombreValide(
      produit?.price ??
      produit?.prix ??
      produit?.salePrice ??
      produit?.sale_price
    );

    if (prixSimple !== null) {
      return {
        min: prixSimple,
        max: prixSimple
      };
    }

    const prixMin = this.nombreValide(
      produit?.minPrice ?? produit?.min_price
    );

    const prixMax = this.nombreValide(
      produit?.maxPrice ?? produit?.max_price
    );

    if (prixMin !== null || prixMax !== null) {
      const min = prixMin ?? prixMax ?? 0;
      const max = prixMax ?? prixMin ?? min;

      return {
        min: Math.min(min, max),
        max: Math.max(min, max)
      };
    }

    // Sans prix connu, le produit ne peut pas satisfaire un filtre de prix.
    return {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    };
  }

  private nombreValide(valeur: any): number | null {
    if (
      valeur === null ||
      valeur === undefined ||
      valeur === ''
    ) {
      return null;
    }

    const nombre = Number(valeur);

    return Number.isFinite(nombre) ? nombre : null;
  }

  /** Retourne true/false si le stock est connu, sinon null. */
  private disponibiliteVariante(
    variante: any,
    produit: any
  ): boolean | null {
    const indicateurs = [
      variante?.inStock,
      variante?.in_stock,
      variante?.isAvailable,
      variante?.is_available,
      variante?.available,
      variante?.availableForSale,
      variante?.available_for_sale,
      produit?.inStock,
      produit?.in_stock,
      produit?.isAvailable,
      produit?.is_available,
      produit?.available
    ];

    for (const indicateur of indicateurs) {
      if (typeof indicateur === 'boolean') {
        return indicateur;
      }

      if (typeof indicateur === 'string') {
        const texte = indicateur.trim().toLowerCase();

        if ([
          'true',
          'yes',
          'oui',
          'available',
          'in_stock'
        ].includes(texte)) {
          return true;
        }

        if ([
          'false',
          'no',
          'non',
          'unavailable',
          'out_of_stock'
        ].includes(texte)) {
          return false;
        }
      }
    }

    const valeursStock = [
      variante?.quantityAvailable,
      variante?.quantity_available,
      variante?.availableQuantity,
      variante?.available_quantity,
      variante?.stockQuantity,
      variante?.stock_quantity,
      variante?.quantity,
      variante?.stock,
      variante?.inventory?.quantityAvailable,
      variante?.inventory?.quantity,
      produit?.quantityAvailable,
      produit?.quantity_available,
      produit?.availableQuantity,
      produit?.available_quantity,
      produit?.stockQuantity,
      produit?.stock_quantity,
      produit?.quantity,
      produit?.stock,
      produit?.inventory?.quantityAvailable,
      produit?.inventory?.quantity
    ];

    for (const valeur of valeursStock) {
      if (
        valeur !== null &&
        valeur !== undefined &&
        valeur !== ''
      ) {
        const quantite = Number(valeur);

        if (Number.isFinite(quantite)) {
          return quantite > 0;
        }
      }
    }

    return null;
  }

  rechercher(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.recherche.trim() || null,
        category: this.categorieSelectionneeId || null
      },
      queryParamsHandling: 'merge'
    });
  }

  reinitialiserRecherche(): void {
    this.recherche = '';
    this.categorieSelectionneeId = '';
    this.filtresActifs = {};

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: null,
        category: null
      },
      queryParamsHandling: 'merge'
    });

    this.changeDetectorRef.detectChanges();
  }

  // =====================================================
  // PRIX ET BADGES
  // =====================================================

  getPrix(produit: Produit): number {
    const p = produit as any;

    return Number(
      p?.minPrice ??
      p?.maxPrice ??
      p?.price ??
      p?.prix ??
      0
    );
  }

  getAncienPrix(produit: Produit): number {
    const p = produit as any;

    return Number(
      p?.compareAtPrice ??
      p?.oldPrice ??
      p?.ancienPrix ??
      0
    );
  }

  getBadge(produit: Produit): string {
    if (produit.status === 'ACTIVE') {
      return '';
    }

    return produit.status || '';
  }

  formatPrice(prix: number): string {
    return (
      new Intl.NumberFormat('fr-FR').format(prix) +
      ' FCFA'
    );
  }

  // =====================================================
  // NAVIGATION VERS LE PRODUIT
  // =====================================================

  voirProduit(produit: ProduitClient): void {
    if (!produit?.id) {
      return;
    }

    this.router.navigate(
      ['/client/produit', produit.id],
      {
        state: {
          imageUrl: produit.imageUrl,
          imageFileId: produit.imageFileId
        }
      }
    );
  }

  // =====================================================
  // VARIANTES
  // =====================================================

  private extraireVariantes(produitDetail: any): any[] {
    if (Array.isArray(produitDetail?.variants)) {
      return produitDetail.variants;
    }

    if (Array.isArray(produitDetail?.variantes)) {
      return produitDetail.variantes;
    }

    if (Array.isArray(produitDetail?.variant)) {
      return produitDetail.variant;
    }

    if (Array.isArray(produitDetail?.variante)) {
      return produitDetail.variante;
    }

    if (produitDetail?.primaryVariant) {
      return [produitDetail.primaryVariant];
    }

    if (produitDetail?.defaultVariant) {
      return [produitDetail.defaultVariant];
    }

    if (
      produitDetail?.variant &&
      typeof produitDetail.variant === 'object'
    ) {
      return [produitDetail.variant];
    }

    if (
      produitDetail?.variante &&
      typeof produitDetail.variante === 'object'
    ) {
      return [produitDetail.variante];
    }

    return [];
  }

  private obtenirPremiereVarianteActive(
    variantes: any[]
  ): any | null {
    return variantes.find((variante: any) => {
      const id =
        variante?.id ??
        variante?.variantId ??
        variante?.variant_id;

      const statut = String(variante?.status ?? '')
        .trim()
        .toUpperCase();

      const active =
        variante?.isActive !== false &&
        variante?.is_active !== false &&
        variante?.active !== false &&
        statut !== 'INACTIVE' &&
        statut !== 'DISABLED';

      const stock =
        variante?.quantityAvailable ??
        variante?.quantity_available ??
        variante?.availableQuantity ??
        variante?.available_quantity ??
        variante?.stock;

      const stockDisponible =
        stock == null || Number(stock) > 0;

      return (
        id != null &&
        String(id).trim() !== '' &&
        active &&
        stockDisponible
      );
    }) ?? null;
  }

  private obtenirVarianteConnue(produit: any): any | null {
    if (!produit) {
      return null;
    }

    const variantes = this.extraireVariantes(produit);

    const varianteActive =
      this.obtenirPremiereVarianteActive(variantes);

    if (varianteActive) {
      return varianteActive;
    }

    const identifiantDirect =
      produit?.primaryVariantId ??
      produit?.primary_variant_id ??
      produit?.defaultVariantId ??
      produit?.default_variant_id ??
      produit?.variantId ??
      produit?.variant_id;

    if (
      identifiantDirect != null &&
      String(identifiantDirect).trim() !== ''
    ) {
      return {
        id: String(identifiantDirect)
      };
    }

    return null;
  }

  private extraireProduitDetail(response: any): any {
    let donnees = response;

    for (let i = 0; i < 6; i++) {
      if (
        donnees?.data &&
        typeof donnees.data === 'object' &&
        !Array.isArray(donnees.data)
      ) {
        donnees = donnees.data;
        continue;
      }

      if (
        donnees?.product &&
        typeof donnees.product === 'object'
      ) {
        donnees = donnees.product;
        continue;
      }

      if (
        donnees?.produit &&
        typeof donnees.produit === 'object'
      ) {
        donnees = donnees.produit;
        continue;
      }

      if (
        donnees?.result &&
        typeof donnees.result === 'object'
      ) {
        donnees = donnees.result;
        continue;
      }

      break;
    }

    return donnees;
  }

  private obtenirVariantePourAjout(
    produit: ProduitClient
  ): Observable<any> {
    const produitId = String(produit.id);

    const varianteEnCache =
      this.variantesCache.get(produitId);

    if (varianteEnCache) {
      return of(varianteEnCache);
    }

    const varianteCatalogue =
      this.obtenirVarianteConnue(produit);

    if (varianteCatalogue) {
      this.variantesCache.set(produitId, varianteCatalogue);

      return of(varianteCatalogue);
    }

    return this.produitsService.getProduit(produitId).pipe(
      map((response: any) => {
        const produitDetail =
          this.extraireProduitDetail(response);

        const variante =
          this.obtenirVarianteConnue(produitDetail);

        if (!variante) {
          throw new Error(
            'Aucune variante active avec un stock disponible n’a été trouvée pour ce produit.'
          );
        }

        this.variantesCache.set(produitId, variante);

        return variante;
      })
    );
  }

  // =====================================================
  // AJOUT AU PANIER
  // =====================================================

  ajouterAuPanier(produit: Produit): void {
    if (!produit?.id) {
      this.erreurAjoutPanier = 'Produit introuvable.';
      this.messagePanier = '';
      return;
    }

    if (this.ajoutEnCoursId !== null) {
      return;
    }

    this.ajoutEnCoursId = String(produit.id);
    this.messagePanier = '';
    this.erreurAjoutPanier = '';

    this.changeDetectorRef.detectChanges();

    this.ajoutPanierSubscription?.unsubscribe();

    this.ajoutPanierSubscription =
      this.obtenirVariantePourAjout(produit as ProduitClient).pipe(
        switchMap((variante: any) => {
          const variantId =
            variante?.id ??
            variante?.variantId ??
            variante?.variant_id;

          if (
            variantId == null ||
            String(variantId).trim() === ''
          ) {
            return throwError(
              () => new Error(
                'Identifiant de variante introuvable.'
              )
            );
          }

          return this.panierService.ajouter(
            String(variantId),
            1
          );
        }),

        tap(() => {
          this.messagePanier =
            `${produit.name || 'Le produit'} a été ajouté au panier.`;
        }),

        catchError((error: any) => {
          this.erreurAjoutPanier =
            error?.error?.error?.message ??
            error?.error?.message ??
            error?.message ??
            'Impossible d’ajouter le produit au panier.';

          console.error('ERREUR AJOUT PANIER :', error);

          return EMPTY;
        }),

        finalize(() => {
          this.ajoutEnCoursId = null;

          this.changeDetectorRef.detectChanges();
        })
      ).subscribe();
  }
}
