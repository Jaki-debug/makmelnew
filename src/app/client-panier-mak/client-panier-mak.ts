import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import { ClientPanier } from '../services/client-panier';

import {
  ClientPanierMak as ClientPanierMakModel
} from '../models/client-panier-mak';

import {
  ArticlePanierMak
} from '../models/article-panier-mak';

@Component({
  selector: 'app-client-panier-mak',
  standalone: false,
  templateUrl: './client-panier-mak.html',
  styleUrl: './client-panier-mak.css'
})
export class ClientPanierMak implements OnInit {

  panier: ClientPanierMakModel | null = null;
  articles: ArticlePanierMak[] = [];

  chargement = false;
  actionEnCours = false;

  erreur = '';
  messageSucces = '';

  constructor(
    private panierService: ClientPanier,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initialiserPanier();
  }

  // INITIALISER LE PANIER

  initialiserPanier(): void {
    this.chargement = true;
    this.erreur = '';
    this.messageSucces = '';

    this.changeDetectorRef.detectChanges();

    this.panierService.creerOuRecuperer().subscribe({
      next: (reponse: any) => {
        if (this.appliquerPanier(reponse)) {
          this.chargement = false;
          this.changeDetectorRef.detectChanges();
          return;
        }

        this.chargerPanier(false);
      },

      error: (error: any) => {
        console.error('Erreur initialisation panier :', error);

        this.panierService.recuperer().subscribe({
          next: (reponse: any) => {
            this.chargement = false;

            if (!this.appliquerPanier(reponse)) {
              this.erreur = this.lireErreur(error);
            }

            this.changeDetectorRef.detectChanges();
          },

          error: (erreurLecture: any) => {
            this.chargement = false;
            this.erreur = this.lireErreur(erreurLecture);
            this.changeDetectorRef.detectChanges();
          }
        });
      }
    });
  }

  // CHARGER LE PANIER

  chargerPanier(afficherChargement = true): void {
    if (afficherChargement) {
      this.chargement = true;
    }

    this.erreur = '';
    this.changeDetectorRef.detectChanges();

    this.panierService.recuperer().subscribe({
      next: (reponse: any) => {
        this.chargement = false;

        if (!this.appliquerPanier(reponse)) {
          this.erreur =
            'La réponse de l’API ne contient pas un panier identifiable.';
        }

        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        this.chargement = false;
        this.erreur = this.lireErreur(error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // EXTRAIRE LE PANIER DE LA RÉPONSE API

  private appliquerPanier(reponse: any): boolean {
    let donnees: any = reponse;

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
        donnees?.cart &&
        typeof donnees.cart === 'object' &&
        !Array.isArray(donnees.cart)
      ) {
        donnees = donnees.cart;
        continue;
      }

      if (
        donnees?.panier &&
        typeof donnees.panier === 'object' &&
        !Array.isArray(donnees.panier)
      ) {
        donnees = donnees.panier;
        continue;
      }

      if (
        donnees?.result &&
        typeof donnees.result === 'object' &&
        !Array.isArray(donnees.result)
      ) {
        donnees = donnees.result;
        continue;
      }

      break;
    }

    if (
      !donnees ||
      typeof donnees !== 'object' ||
      Array.isArray(donnees)
    ) {
      return false;
    }

    const listeArticles =
      donnees.items ??
      donnees.articles ??
      donnees.cartItems ??
      donnees.cart_items ??
      donnees.lines;

    const contientListeArticles = Array.isArray(listeArticles);

    const contientIdPanier =
      donnees.cartId != null ||
      donnees.cart_id != null;

    const contientTotalPanier =
      donnees.totalAmount != null ||
      donnees.grandTotal != null ||
      donnees.subtotal != null ||
      donnees.total != null;

    const contientStatutPanier =
      donnees.status != null &&
      (
        donnees.createdAt != null ||
        donnees.customerId != null ||
        donnees.guestCartToken != null ||
        donnees.guestToken != null
      );

    const contientIdentiteEtTotal =
      donnees.id != null && contientTotalPanier;

    const panierIdentifiable =
      contientListeArticles ||
      contientIdPanier ||
      contientStatutPanier ||
      contientIdentiteEtTotal;

    if (!panierIdentifiable) {
      console.warn(
        'Réponse API non reconnue comme panier :',
        reponse
      );
      return false;
    }

    this.panier = donnees as ClientPanierMakModel;

    this.articles = contientListeArticles
      ? listeArticles as ArticlePanierMak[]
      : [];

    return true;
  }

  // AJOUTER UN ARTICLE

  ajouterArticle(variantId: string, quantity = 1): void {
    if (
      !variantId ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      this.erreur =
        'Veuillez sélectionner une variante et une quantité valide.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    if (this.actionEnCours) {
      return;
    }

    this.demarrerAction();

    this.panierService.ajouter(variantId, quantity).subscribe({
      next: (reponse: any) => {
        this.traiterSuccesMutation(
          reponse,
          'Article ajouté au panier.'
        );
      },

      error: (error: any) => {
        this.actionEnCours = false;
        this.erreur = this.lireErreur(error);
        console.error('Erreur ajout article :', error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // MODIFIER LA QUANTITÉ

  modifierQuantite(
    article: ArticlePanierMak,
    nouvelleQuantite: number
  ): void {
    if (this.actionEnCours) {
      return;
    }

    if (
      !Number.isInteger(nouvelleQuantite) ||
      nouvelleQuantite < 0
    ) {
      return;
    }

    if (nouvelleQuantite === 0) {
      this.supprimerArticle(article);
      return;
    }

    const itemId = this.obtenirIdArticle(article);

    if (!itemId) {
      this.erreur =
        'Identifiant de la ligne du panier introuvable.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    if (nouvelleQuantite === this.obtenirQuantite(article)) {
      return;
    }

    this.demarrerAction();

    this.panierService.modifierQuantite(
      itemId,
      nouvelleQuantite
    ).subscribe({
      next: (reponse: any) => {
        this.traiterSuccesMutation(
          reponse,
          'Quantité mise à jour.'
        );
      },

      error: (error: any) => {
        this.actionEnCours = false;
        this.erreur = this.lireErreur(error);
        console.error('Erreur modification quantité :', error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  modifierQuantiteArticle(
    article: ArticlePanierMak,
    variation: number
  ): void {
    const nouvelleQuantite =
      this.obtenirQuantite(article) + variation;

    this.modifierQuantite(article, nouvelleQuantite);
  }

  // SUPPRIMER UN ARTICLE

  supprimerArticle(article: ArticlePanierMak): void {
    if (this.actionEnCours) {
      return;
    }

    const itemId = this.obtenirIdArticle(article);

    if (!itemId) {
      this.erreur =
        'Identifiant de la ligne du panier introuvable.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.demarrerAction();

    this.panierService.supprimer(itemId).subscribe({
      next: (reponse: any) => {
        this.traiterSuccesMutation(
          reponse,
          'Article retiré du panier.'
        );
      },

      error: (error: any) => {
        this.actionEnCours = false;
        this.erreur = this.lireErreur(error);
        console.error('Erreur suppression article :', error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // VIDER LE PANIER

  viderPanier(): void {
    if (
      this.actionEnCours ||
      this.articles.length === 0
    ) {
      return;
    }

    this.demarrerAction();

    this.panierService.vider().subscribe({
      next: () => {
        this.actionEnCours = false;
        this.panier = null;
        this.articles = [];
        this.chargement = false;
        this.erreur = '';
        this.messageSucces = 'Votre panier a été vidé.';
        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        this.actionEnCours = false;
        this.erreur = this.lireErreur(error);
        console.error('Erreur vidage panier :', error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // FUSION DU PANIER INVITÉ

  fusionnerPanierInvite(): void {
    if (this.actionEnCours) {
      return;
    }

    this.demarrerAction();

    this.panierService.fusionnerInvite().subscribe({
      next: (reponse: any) => {
        this.traiterSuccesMutation(
          reponse,
          'Panier fusionné.'
        );
      },

      error: (error: any) => {
        this.actionEnCours = false;
        this.erreur = this.lireErreur(error);
        console.error('Erreur fusion panier :', error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // ACTUALISER LE PANIER APRÈS UNE ACTION

  private traiterSuccesMutation(
    reponse: any,
    message: string
  ): void {
    this.messageSucces = message;
    this.erreur = '';

    if (this.appliquerPanier(reponse)) {
      this.actionEnCours = false;
      this.chargement = false;
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.panierService.recuperer().subscribe({
      next: (panierActualise: any) => {
        if (!this.appliquerPanier(panierActualise)) {
          this.erreur =
            'L’action a réussi, mais le panier actualisé ne peut pas être affiché.';
        }

        this.actionEnCours = false;
        this.chargement = false;
        this.changeDetectorRef.detectChanges();
      },

      error: (error: any) => {
        this.actionEnCours = false;
        this.chargement = false;

        this.erreur =
          'L’action a été envoyée, mais le panier actualisé n’a pas pu être récupéré. ' +
          this.lireErreur(error);

        console.error('Erreur rechargement panier :', error);
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // PASSER LA COMMANDE

  passerCommande(): void {
    if (this.actionEnCours || this.chargement) {
      return;
    }

    if (this.articles.length === 0) {
      this.erreur =
        'Ajoutez au moins un article avant de passer commande.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.erreur = '';
    this.messageSucces = '';

    this.router.navigate(['/client/passer-commande']);
  }

  // CONTINUER MES ACHATS : REDIRIGER VERS LE CATALOGUE

  continuerAchats(): void {
    this.router.navigate(['/client/produitcatalogue']);
  }

  // IDENTIFIANT DE L'ARTICLE

  obtenirIdArticle(article: ArticlePanierMak): string {
    const ligne = article as any;

    const id =
      ligne.itemId ??
      ligne.item_id ??
      ligne.cartItemId ??
      ligne.cart_item_id ??
      ligne.cartItem?.id ??
      ligne.cart_item?.id ??
      ligne.id;

    return id != null ? String(id) : '';
  }

  // NOM DU PRODUIT

  obtenirNom(article: ArticlePanierMak): string {
    const ligne = article as any;

    return ligne.productName ??
      ligne.product_name ??
      ligne.name ??
      ligne.product?.name ??
      ligne.product?.nom ??
      ligne.product?.title ??
      ligne.variant?.product?.name ??
      ligne.variant?.product?.nom ??
      ligne.title ??
      'Article';
  }

  // VARIANTE

  obtenirVariante(article: ArticlePanierMak): string {
    const ligne = article as any;

    return ligne.variantName ??
      ligne.variant_name ??
      ligne.variant?.name ??
      ligne.variant?.label ??
      '';
  }

  // IMAGE DU PRODUIT

  obtenirImage(article: ArticlePanierMak): string {
    const ligne = article as any;

    const images =
      ligne.product?.images ??
      ligne.variant?.product?.images;

    const premiereImage = images?.[0];

    if (typeof premiereImage === 'string') {
      return premiereImage;
    }

    return ligne.imageUrl ??
      ligne.image_url ??
      ligne.image ??
      ligne.product?.imageUrl ??
      ligne.product?.image_url ??
      ligne.product?.image ??
      premiereImage?.url ??
      premiereImage?.src ??
      ligne.variant?.product?.imageUrl ??
      ligne.variant?.product?.image ??
      '';
  }

  // QUANTITÉ

  obtenirQuantite(article: ArticlePanierMak): number {
    const ligne = article as any;

    const quantite = Number(
      ligne.quantity ??
      ligne.quantite ??
      ligne.qty ??
      1
    );

    return Number.isFinite(quantite) && quantite > 0
      ? quantite
      : 1;
  }

  // PRIX UNITAIRE

  obtenirPrix(article: ArticlePanierMak): number {
    const ligne = article as any;

    return this.convertirNombre(
      ligne.unitPrice ??
      ligne.unit_price ??
      ligne.price ??
      ligne.product?.unitPrice ??
      ligne.product?.unit_price ??
      ligne.product?.price ??
      ligne.variant?.price
    );
  }

  // TOTAL D'UNE LIGNE

  obtenirTotalLigne(article: ArticlePanierMak): number {
    const ligne = article as any;

    const total =
      ligne.totalPrice ??
      ligne.total_price ??
      ligne.lineTotal ??
      ligne.line_total ??
      ligne.subtotal;

    if (total !== undefined && total !== null) {
      return this.convertirNombre(total);
    }

    return this.obtenirPrix(article) *
      this.obtenirQuantite(article);
  }

  // MÉTHODES UTILISÉES PAR LE HTML

  getNom(article: ArticlePanierMak): string {
    return this.obtenirNom(article);
  }

  getVariante(article: ArticlePanierMak): string {
    return this.obtenirVariante(article);
  }

  getImage(article: ArticlePanierMak): string {
    return this.obtenirImage(article);
  }

  getQuantite(article: ArticlePanierMak): number {
    return this.obtenirQuantite(article);
  }

  getPrix(article: ArticlePanierMak): number {
    return this.obtenirPrix(article);
  }

  getTotalLigne(article: ArticlePanierMak): number {
    return this.obtenirTotalLigne(article);
  }

  totalQuantite(): number {
    return this.articles.reduce(
      (total, article) =>
        total + this.obtenirQuantite(article),
      0
    );
  }

  getTotalPanier(): number {
    const panier = this.panier as any;

    const totalServeur =
      panier?.totalAmount ??
      panier?.grandTotal ??
      panier?.total ??
      panier?.subtotal;

    if (
      totalServeur !== undefined &&
      totalServeur !== null
    ) {
      return this.convertirNombre(totalServeur);
    }

    return this.articles.reduce(
      (total, article) =>
        total + this.obtenirTotalLigne(article),
      0
    );
  }

  // FORMATER UN PRIX EN FCFA

  formaterPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(prix);
  }

  // GESTION DES ACTIONS

  private demarrerAction(): void {
    this.actionEnCours = true;
    this.erreur = '';
    this.messageSucces = '';
    this.changeDetectorRef.detectChanges();
  }

  private convertirNombre(
    valeur: number | string | undefined
  ): number {
    if (typeof valeur === 'number') {
      return Number.isFinite(valeur) ? valeur : 0;
    }

    if (typeof valeur === 'string') {
      const nombre = Number(
        valeur
          .replace(/\s/g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '')
      );

      return Number.isFinite(nombre) ? nombre : 0;
    }

    return 0;
  }

  private lireErreur(error: any): string {
    const message =
      error?.error?.error?.message ??
      error?.error?.message ??
      error?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (
      typeof message === 'string' &&
      message.trim() !== ''
    ) {
      return message;
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}