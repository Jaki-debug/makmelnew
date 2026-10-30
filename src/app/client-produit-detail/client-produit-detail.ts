import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { ClientProduitsService } from '../services/client-produits';
import { ClientPanier } from '../services/client-panier';

import {
  Produit,
  VarianteProduit
} from '../models/produit';

@Component({
  selector: 'app-client-produit-detail',
  standalone: false,
  templateUrl: './client-produit-detail.html',
  styleUrl: './client-produit-detail.css'
})
export class ClientProduitDetail implements OnInit {

  produit: Produit | null = null;

  chargement = true;
  erreur = '';

  imageUrl = 'assets/images/products/product-default.jpg';

  imagesProduit: string[] = [];

  varianteSelectionnee: VarianteProduit | null = null;

  ajoutEnCours = false;
  messagePanier = '';
  erreurAjoutPanier = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produitsService: ClientProduitsService,
    private panierService: ClientPanier,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    if (state?.['imageUrl']) {
      this.imageUrl = state['imageUrl'];
    }

    this.chargerProduit();
  }

  /**
   * Charger les informations du produit et ses variantes.
   */
  chargerProduit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.erreur = 'Produit introuvable.';
      this.chargement = false;
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.chargement = true;
    this.erreur = '';
    this.messagePanier = '';
    this.erreurAjoutPanier = '';

    this.produitsService.getProduit(id).subscribe({
      next: (response: any) => {
        console.log('Réponse produit détail client :', response);

        const produitData =
          response?.data?.product ??
          response?.data?.produit ??
          response?.data ??
          response?.product ??
          response?.produit ??
          response;

        if (!produitData?.id) {
          this.produit = null;
          this.erreur = 'Produit introuvable.';
          this.chargement = false;
          this.changeDetectorRef.detectChanges();
          return;
        }

        this.produit = produitData;

        this.chargerImages(produitData);

        this.varianteSelectionnee = null;

        const variantesDisponibles =
          this.getVariantesDisponibles();

        if (variantesDisponibles.length === 1) {
          this.varianteSelectionnee = variantesDisponibles[0];
        }

        console.log('PRODUIT CLIENT :', this.produit);
        console.log('VARIANTES DISPONIBLES :', variantesDisponibles);

        this.chargement = false;
        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        console.error('Erreur chargement produit :', error);

        this.produit = null;

        this.erreur =
          error?.error?.error?.message ||
          error?.error?.message ||
          error?.message ||
          'Impossible de charger le produit.';

        this.chargement = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  /**
   * Charger les différentes images du produit.
   */
  chargerImages(produit: any): void {
    const images: string[] = [];

    const ajouterImage = (url: string): void => {
      if (url && !images.includes(url)) {
        images.push(url);
      }
    };

    // Image transmise depuis le catalogue.
    if (
      this.imageUrl &&
      this.imageUrl !== 'assets/images/products/product-default.jpg'
    ) {
      ajouterImage(this.normaliserUrlImage(this.imageUrl));
    }

    // Image principale.
    const primaryFileId =
      produit?.primaryImageFileId ||
      produit?.primaryImage?.fileId ||
      produit?.primaryImage?.file?.id ||
      produit?.primaryImage?.file?.fileId ||
      '';

    if (primaryFileId) {
      ajouterImage(`/api/v1/files/${primaryFileId}`);
    }

    // Images supplémentaires.
    const listesImages = [
      ...(Array.isArray(produit?.images) ? produit.images : []),
      ...(Array.isArray(produit?.productImages)
        ? produit.productImages
        : []),
      ...(Array.isArray(produit?.imagesProduit)
        ? produit.imagesProduit
        : [])
    ];

    listesImages.forEach((image: any) => {
      const fileId =
        image?.fileId ||
        image?.file?.id ||
        image?.file?.fileId ||
        '';

      if (fileId) {
        ajouterImage(`/api/v1/files/${fileId}`);
        return;
      }

      const url =
        image?.url ||
        image?.imageUrl ||
        '';

      if (typeof url === 'string' && url.trim()) {
        ajouterImage(this.normaliserUrlImage(url));
      }
    });

    // Autres structures possibles.
    const imageSimpleFileId =
      produit?.image?.fileId ||
      produit?.image?.file?.id ||
      produit?.image?.file?.fileId ||
      '';

    if (imageSimpleFileId) {
      ajouterImage(`/api/v1/files/${imageSimpleFileId}`);
    }

    const imageSimpleUrl =
      produit?.image?.url ||
      produit?.imageUrl ||
      produit?.primaryImageUrl ||
      '';

    if (imageSimpleUrl) {
      ajouterImage(this.normaliserUrlImage(imageSimpleUrl));
    }

    // Dernier recours.
    if (images.length === 0) {
      const fileId = this.getFileId(produit);

      if (fileId) {
        ajouterImage(`/api/v1/files/${fileId}`);
      } else {
        const existingImage = this.getExistingImageUrl(produit);

        if (existingImage) {
          ajouterImage(existingImage);
        }
      }
    }

    this.imagesProduit = images;

    this.imageUrl = images.length > 0
      ? images[0]
      : 'assets/images/products/product-default.jpg';

    this.changeDetectorRef.detectChanges();
  }

  /**
   * Sélectionner une image parmi les miniatures.
   * Cette méthode corrige l'erreur :
   * Property 'selectionnerImage' does not exist.
   */
  selectionnerImage(image: string): void {
    if (!image) {
      return;
    }

    this.imageUrl = image;
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Normaliser une URL d'image.
   */
  private normaliserUrlImage(url: string): string {
    if (!url) {
      return '';
    }

    return url.replace(
      /^http:\/\/(localhost|127\.0\.0\.1):3000/,
      ''
    );
  }

  /**
   * Récupérer l'URL d'une image.
   */
  getImageUrl(image: any): string {
    if (!image) {
      return '';
    }

    if (image.url) {
      return this.normaliserUrlImage(image.url);
    }

    const fileId =
      image.fileId ||
      image.file?.id ||
      image.file?.fileId ||
      image.fichierId ||
      image.fichier?.id ||
      image.fichier?.fileId;

    return fileId ? `/api/v1/files/${fileId}` : '';
  }

  /**
   * Retourner l'image principale actuellement affichée.
   */
  getImagePrincipale(): string {
    return this.imageUrl;
  }

  /**
   * Récupérer l'identifiant d'un fichier image.
   */
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

  /**
   * Récupérer une URL d'image déjà fournie par l'API.
   */
  getExistingImageUrl(produit: any): string {
    const url =
      produit?.primaryImageUrl ||
      produit?.primaryImage?.url ||
      produit?.imageUrl ||
      produit?.image?.url ||
      produit?.images?.[0]?.url ||
      produit?.productImages?.[0]?.url ||
      produit?.imagesProduit?.[0]?.url ||
      '';

    return typeof url === 'string'
      ? this.normaliserUrlImage(url)
      : '';
  }

  /**
   * Réagir à une erreur de chargement d'image.
   */
  imageErreur(): void {
    console.error(
      'Image impossible à afficher :',
      this.imageUrl
    );

    this.imageUrl =
      'assets/images/products/product-default.jpg';

    this.changeDetectorRef.detectChanges();
  }

  /**
   * Obtenir le nom de la catégorie.
   */
  getCategorie(): string {
    const produitPublic = this.produit as any;

    return (
      produitPublic?.category?.name ||
      produitPublic?.categorie?.name ||
      produitPublic?.categoryName ||
      produitPublic?.categorieName ||
      'Sans catégorie'
    );
  }

  /**
   * Obtenir le prix du produit ou de la variante sélectionnée.
   */
  getPrix(): number {
    if (!this.produit) {
      return 0;
    }

    if (this.varianteSelectionnee) {
      return Number(this.varianteSelectionnee.price || 0);
    }

    const produitPublic = this.produit as any;

    const prixDisponibles = this.getVariantesDisponibles()
      .map(variante => Number(variante.price || 0))
      .filter(prix => Number.isFinite(prix) && prix > 0);

    if (prixDisponibles.length > 0) {
      return Math.min(...prixDisponibles);
    }

    return Number(
      produitPublic?.minPrice ??
      produitPublic?.maxPrice ??
      produitPublic?.price ??
      produitPublic?.prix ??
      0
    );
  }

  /**
   * Obtenir l'ancien prix.
   */
  getAncienPrix(): number {
    if (this.varianteSelectionnee) {
      return Number(
        (this.varianteSelectionnee as any).compareAtPrice || 0
      );
    }

    const produitPublic = this.produit as any;

    return Number(
      produitPublic?.compareAtPrice ??
      produitPublic?.oldPrice ??
      produitPublic?.ancienPrix ??
      0
    );
  }

  /**
   * Récupérer les variantes disponibles.
   */
  getVariantesDisponibles(): VarianteProduit[] {
    const produitPublic = this.produit as any;

    const variantes =
      produitPublic?.variants ??
      produitPublic?.variantes ??
      produitPublic?.variante ??
      [];

    if (!Array.isArray(variantes)) {
      return [];
    }

    return variantes.filter((variante: VarianteProduit) =>
      this.varianteDisponible(variante)
    );
  }

  /**
   * Sélectionner une variante.
   */
  selectionnerVariante(variante: VarianteProduit): void {
    if (!this.varianteDisponible(variante)) {
      return;
    }

    this.varianteSelectionnee = variante;
    this.messagePanier = '';
    this.erreurAjoutPanier = '';

    this.changeDetectorRef.detectChanges();
  }

  /**
   * Vérifier si une variante peut être achetée.
   */
  varianteDisponible(variante: VarianteProduit): boolean {
    const v = variante as any;

    if (
      v?.isActive === false ||
      v?.is_active === false ||
      v?.active === false ||
      v?.status === 'INACTIVE'
    ) {
      return false;
    }

    const stock =
      v?.quantityAvailable ??
      v?.quantity_available ??
      v?.stock;

    // Si le stock n'est pas fourni, l'API confirmera la disponibilité.
    if (stock == null) {
      return true;
    }

    return Number(stock) > 0;
  }

  /**
   * Obtenir un message sur le stock.
   */
  getStockMessage(variante: VarianteProduit): string {
    const v = variante as any;

    if (!this.varianteDisponible(variante)) {
      return 'Indisponible ou en rupture de stock';
    }

    const stock =
      v?.quantityAvailable ??
      v?.quantity_available ??
      v?.stock;

    if (stock == null) {
      return 'Disponibilité à confirmer';
    }

    if (Number(stock) <= 5) {
      return `Plus que ${stock} disponible(s)`;
    }

    return 'En stock';
  }

  /**
   * Formater le prix en FCFA.
   */
  formatPrice(prix: number): string {
    return new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA';
  }

  /**
   * Retourner au catalogue client.
   */
  retournerCatalogue(): void {
    this.router.navigate(['/client/produitcatalogue']);
  }

  /**
   * Ajouter le produit au panier.
   * L'API attend variantId et quantity.
   */
  ajouterAuPanier(): void {
    if (!this.produit) {
      this.erreurAjoutPanier = 'Produit introuvable.';
      return;
    }

    if (this.ajoutEnCours) {
      return;
    }

    const variantes = this.getVariantesDisponibles();

    if (variantes.length === 0) {
      this.erreurAjoutPanier =
        'Ce produit ne possède aucune variante disponible à ajouter au panier.';
      this.messagePanier = '';
      return;
    }

    if (!this.varianteSelectionnee) {
      this.erreurAjoutPanier =
        'Veuillez sélectionner une variante avant de l’ajouter au panier.';
      this.messagePanier = '';
      return;
    }

    if (!this.varianteDisponible(this.varianteSelectionnee)) {
      this.erreurAjoutPanier =
        'Cette variante est actuellement indisponible.';
      this.messagePanier = '';
      return;
    }

    const variante = this.varianteSelectionnee as any;

    const variantId =
      variante.id ??
      variante.variantId ??
      variante.variant_id;

    if (variantId == null || String(variantId).trim() === '') {
      this.erreurAjoutPanier =
        'L’identifiant de cette variante est introuvable.';
      this.messagePanier = '';

      console.error(
        'Variante sans identifiant :',
        this.varianteSelectionnee
      );

      return;
    }

    this.ajoutEnCours = true;
    this.erreurAjoutPanier = '';
    this.messagePanier = '';

    this.panierService.ajouter(String(variantId), 1).subscribe({
      next: (response: any) => {
        this.ajoutEnCours = false;

        this.messagePanier =
          `${this.produit?.name || 'Le produit'} a été ajouté au panier.`;

        console.log('Ajout panier réussi :', response);
        console.log('Variante ajoutée :', variante);

        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        this.ajoutEnCours = false;

        this.erreurAjoutPanier =
          error?.error?.error?.message ??
          error?.error?.message ??
          'Impossible d’ajouter ce produit au panier. Veuillez réessayer.';

        console.error('ERREUR AJOUT PANIER :', error);

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  /**
   * Ouvrir la page panier côté client.
   */
  allerPanier(): void {
    this.router.navigate(['/client/panier-mak']);
  }
}