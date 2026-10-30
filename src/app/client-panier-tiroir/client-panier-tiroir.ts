import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ClientPanier } from '../services/client-panier';

@Component({
  selector: 'app-client-panier-tiroir',
  standalone: false,
  templateUrl: './client-panier-tiroir.html',
  styleUrl: './client-panier-tiroir.css'
})
export class ClientPanierTiroir implements OnChanges, OnDestroy {

  @Input() ouvert = false;

  @Output() fermeture = new EventEmitter<void>();

  articles: any[] = [];

  chargement = false;
  actionEnCours = false;

  erreur = '';
  messageSucces = '';

  private readonly imageParDefaut =
    'assets/images/produit-defaut.png';

  private readonly timersQuantite =
    new Map<string, ReturnType<typeof setTimeout>>();

  private readonly quantitesEnAttente =
    new Map<string, number>();

  private readonly quantitesConfirmees =
    new Map<string, number>();

  private readonly sauvegardesEnCours =
    new Set<string>();

  private readonly abonnements = new Subscription();

  private detruit = false;

  constructor(
    private panierService: ClientPanier,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  // ==========================================
  // ACTUALISATION DE LA VUE
  // ==========================================

  private actualiserVue(): void {
    if (!this.detruit) {
      this.cdr.detectChanges();
    }
  }

  get miseAJourQuantiteEnCours(): boolean {
    return (
      this.timersQuantite.size > 0 ||
      this.sauvegardesEnCours.size > 0
    );
  }

  // ==========================================
  // CYCLE DE VIE
  // ==========================================

  ngOnChanges(changements: SimpleChanges): void {
    if (
      changements['ouvert'] &&
      changements['ouvert'].currentValue === true
    ) {
      this.chargerPanier();
    }

    this.actualiserVue();
  }

  ngOnDestroy(): void {
    this.detruit = true;

    this.timersQuantite.forEach(timer => {
      clearTimeout(timer);
    });

    this.timersQuantite.clear();
    this.abonnements.unsubscribe();
  }

  // ==========================================
  // FERMETURE DU TIROIR
  // ==========================================

  fermerTiroir(): void {
    this.fermeture.emit();
  }

  // ==========================================
  // PASSAGE À LA COMMANDE
  // ==========================================

  passerCommande(): void {
    if (
      this.chargement ||
      this.actionEnCours ||
      this.miseAJourQuantiteEnCours ||
      this.articles.length === 0
    ) {
      return;
    }

    this.erreur = '';
    this.messageSucces = '';

    this.fermerTiroir();

    this.router.navigate(['/client/passer-commande']).then(
      succes => {
        if (!succes) {
          this.erreur =
            'Impossible d’ouvrir le formulaire de commande.';
          this.actualiserVue();
        }
      }
    );
  }

  // ==========================================
  // CHARGEMENT DU PANIER
  // ==========================================

  chargerPanier(): void {
    if (
      this.chargement ||
      this.actionEnCours ||
      this.miseAJourQuantiteEnCours
    ) {
      return;
    }

    this.chargement = true;
    this.erreur = '';
    this.messageSucces = '';

    this.actualiserVue();

    this.abonnements.add(
      this.panierService.recuperer().subscribe({
        next: (reponse: any) => {
          const panierTrouve = this.appliquerPanier(reponse);

          if (panierTrouve) {
            this.chargement = false;
          } else {
            this.recupererApresCreation();
          }

          this.actualiserVue();
        },

        error: (error: any) => {
          if (error?.status === 404) {
            this.creerPanier();
            return;
          }

          this.chargement = false;
          this.erreur = this.lireErreur(error);

          this.actualiserVue();
        }
      })
    );
  }

  private creerPanier(): void {
    this.chargement = true;
    this.erreur = '';

    this.actualiserVue();

    this.abonnements.add(
      this.panierService.creerOuRecuperer().subscribe({
        next: (reponse: any) => {
          const panierTrouve = this.appliquerPanier(reponse);

          if (panierTrouve) {
            this.chargement = false;
          } else {
            this.recupererApresCreation();
          }

          this.actualiserVue();
        },

        error: (error: any) => {
          if (error?.status === 409) {
            this.recupererApresCreation();
            return;
          }

          this.chargement = false;
          this.erreur = this.lireErreur(error);

          this.actualiserVue();
        }
      })
    );
  }

  private recupererApresCreation(): void {
    this.abonnements.add(
      this.panierService.recuperer().subscribe({
        next: (reponse: any) => {
          this.appliquerPanier(reponse);
          this.chargement = false;

          this.actualiserVue();
        },

        error: (error: any) => {
          this.chargement = false;
          this.erreur = this.lireErreur(error);

          this.actualiserVue();
        }
      })
    );
  }

  private appliquerPanier(reponse: any): boolean {
    const candidats: any[] = [reponse];

    const clesImbriquees = [
      'data',
      'cart',
      'panier',
      'result',
      'payload'
    ];

    const clesArticles = [
      'items',
      'articles',
      'cartItems',
      'cart_items',
      'cartLines',
      'cart_lines',
      'lines'
    ];

    while (candidats.length > 0) {
      const candidat = candidats.shift();

      if (Array.isArray(candidat)) {
        this.articles = candidat;
        this.actualiserVue();
        return true;
      }

      if (
        !candidat ||
        typeof candidat !== 'object'
      ) {
        continue;
      }

      for (const cle of clesArticles) {
        if (Array.isArray(candidat[cle])) {
          this.articles = candidat[cle];
          this.actualiserVue();
          return true;
        }
      }

      for (const cle of clesImbriquees) {
        const valeur = candidat[cle];

        if (
          valeur &&
          typeof valeur === 'object'
        ) {
          candidats.push(valeur);
        }
      }
    }

    this.articles = [];
    this.actualiserVue();

    return false;
  }

  // ==========================================
  // IDENTIFICATION DES ARTICLES
  // ==========================================

  obtenirIdArticle(article: any): string {
    const id =
      article?.itemId ??
      article?.item_id ??
      article?.cartItemId ??
      article?.cart_item_id ??
      article?.cartItem?.id ??
      article?.cart_item?.id ??
      article?.id;

    return id !== undefined && id !== null
      ? String(id)
      : '';
  }

  obtenirNomArticle(article: any): string {
    const produit =
      article?.product ??
      article?.variant?.product ??
      article?.productVariant?.product ??
      article?.product_variant?.product ??
      article?.produit ??
      {};

    const nom =
      article?.productName ??
      article?.product_name ??
      article?.name ??
      article?.nom ??
      produit?.name ??
      produit?.nom ??
      produit?.title ??
      produit?.libelle ??
      article?.title;

    if (typeof nom === 'string' && nom.trim()) {
      return nom;
    }

    return 'Article';
  }

  obtenirVariante(article: any): string {
    const variante =
      article?.variant ??
      article?.productVariant ??
      article?.product_variant ??
      article?.variante ??
      {};

    const elements: string[] = [];

    const taille =
      variante?.size ??
      variante?.taille ??
      article?.size ??
      article?.taille;

    const couleur =
      variante?.color ??
      variante?.couleur ??
      article?.color ??
      article?.couleur;

    const pointure =
      variante?.shoeSize ??
      variante?.shoe_size ??
      article?.shoeSize ??
      article?.shoe_size ??
      article?.pointure;

    if (taille) {
      elements.push('Taille : ' + taille);
    }

    if (couleur) {
      elements.push('Couleur : ' + couleur);
    }

    if (pointure) {
      elements.push('Pointure : ' + pointure);
    }

    if (elements.length > 0) {
      return elements.join(' · ');
    }

    const reference =
      variante?.sku ??
      variante?.reference ??
      variante?.name ??
      article?.sku;

    return reference ? String(reference) : '';
  }

  obtenirImage(article: any): string {
    const produit =
      article?.product ??
      article?.variant?.product ??
      article?.productVariant?.product ??
      article?.product_variant?.product ??
      article?.produit ??
      {};

    let image =
      article?.imageUrl ??
      article?.image_url ??
      article?.image ??
      article?.photo ??
      produit?.imageUrl ??
      produit?.image_url ??
      produit?.image ??
      produit?.photo ??
      produit?.mainImage ??
      produit?.main_image ??
      produit?.images?.[0];

    if (Array.isArray(image)) {
      image = image[0];
    }

    if (image && typeof image === 'object') {
      image =
        image.url ??
        image.imageUrl ??
        image.image_url ??
        image.path ??
        image.src;
    }

    return typeof image === 'string' && image.trim()
      ? image
      : this.imageParDefaut;
  }

  gererErreurImage(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (image) {
      image.onerror = null;
      image.src = this.imageParDefaut;
    }
  }

  // ==========================================
  // QUANTITÉS ET PRIX
  // ==========================================

  obtenirQuantite(article: any): number {
    const valeur =
      article?.quantity ??
      article?.quantite ??
      article?.qty ??
      1;

    const quantite = this.convertirNombre(valeur);

    return Number.isFinite(quantite) && quantite >= 1
      ? Math.floor(quantite)
      : 1;
  }

  obtenirPrix(article: any): number {
    const produit =
      article?.product ??
      article?.variant?.product ??
      article?.productVariant?.product ??
      article?.product_variant?.product ??
      {};

    const variante =
      article?.variant ??
      article?.productVariant ??
      article?.product_variant ??
      {};

    const prixBrut =
      article?.unitPrice ??
      article?.unit_price ??
      article?.price ??
      article?.prix ??
      variante?.unitPrice ??
      variante?.unit_price ??
      variante?.price ??
      produit?.unitPrice ??
      produit?.unit_price ??
      produit?.price ??
      produit?.prix ??
      0;

    if (prixBrut && typeof prixBrut === 'object') {
      return this.convertirNombre(
        prixBrut.amount ??
        prixBrut.value ??
        prixBrut.price ??
        0
      );
    }

    return this.convertirNombre(prixBrut);
  }

  obtenirTotalLigne(article: any): number {
    const totalBrut =
      article?.lineTotal ??
      article?.line_total ??
      article?.totalPrice ??
      article?.total_price ??
      article?.subtotal ??
      article?.subTotal;

    if (
      totalBrut !== undefined &&
      totalBrut !== null &&
      totalBrut !== ''
    ) {
      if (typeof totalBrut === 'object') {
        return this.convertirNombre(
          totalBrut.amount ??
          totalBrut.value ??
          0
        );
      }

      return this.convertirNombre(totalBrut);
    }

    return this.obtenirPrix(article) *
      this.obtenirQuantite(article);
  }

  get totalQuantite(): number {
    return this.articles.reduce(
      (total: number, article: any) =>
        total + this.obtenirQuantite(article),
      0
    );
  }

  get totalPanier(): number {
    return this.articles.reduce(
      (total: number, article: any) =>
        total + this.obtenirTotalLigne(article),
      0
    );
  }

  formaterPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(prix) + ' FCFA';
  }

  private convertirNombre(valeur: any): number {
    if (typeof valeur === 'number') {
      return Number.isFinite(valeur) ? valeur : 0;
    }

    if (valeur === null || valeur === undefined) {
      return 0;
    }

    const texte = String(valeur)
      .trim()
      .replace(/\s/g, '')
      .replace(/[^\d,.-]/g, '')
      .replace(',', '.');

    const nombre = Number(texte);

    return Number.isFinite(nombre) ? nombre : 0;
  }

  // ==========================================
  // MODIFICATION RAPIDE DE LA QUANTITÉ
  // ==========================================

  modifierQuantite(
    article: any,
    nouvelleQuantite: number
  ): void {
    if (
      this.actionEnCours ||
      this.chargement ||
      !Number.isInteger(nouvelleQuantite) ||
      nouvelleQuantite < 1
    ) {
      return;
    }

    const id = this.obtenirIdArticle(article);

    if (!id) {
      this.erreur =
        'Identifiant de la ligne du panier introuvable.';

      this.actualiserVue();
      return;
    }

    const quantiteActuelle =
      this.obtenirQuantite(article);

    if (nouvelleQuantite === quantiteActuelle) {
      return;
    }

    if (!this.quantitesConfirmees.has(id)) {
      this.quantitesConfirmees.set(
        id,
        quantiteActuelle
      );
    }

    this.quantitesEnAttente.set(id, nouvelleQuantite);

    this.actualiserQuantiteLocale(id, nouvelleQuantite);

    this.erreur = '';
    this.messageSucces = '';

    const ancienTimer = this.timersQuantite.get(id);

    if (ancienTimer) {
      clearTimeout(ancienTimer);
    }

    const timer = setTimeout(() => {
      this.timersQuantite.delete(id);
      this.actualiserVue();
      this.sauvegarderQuantite(id);
    }, 350);

    this.timersQuantite.set(id, timer);

    this.actualiserVue();
  }

  private actualiserQuantiteLocale(
    id: string,
    quantite: number
  ): void {
    this.articles = this.articles.map((ligne: any) => {
      if (this.obtenirIdArticle(ligne) !== id) {
        return ligne;
      }

      const copie = { ...ligne };

      if (
        'quantity' in copie ||
        (!('quantite' in copie) && !('qty' in copie))
      ) {
        copie.quantity = quantite;
      }

      if ('quantite' in copie) {
        copie.quantite = quantite;
      }

      if ('qty' in copie) {
        copie.qty = quantite;
      }

      const sousTotal =
        this.obtenirPrix(copie) * quantite;

      const champsTotal = [
        'lineTotal',
        'line_total',
        'totalPrice',
        'total_price',
        'subtotal',
        'subTotal'
      ];

      champsTotal.forEach((champ: string) => {
        if (
          copie[champ] !== undefined &&
          copie[champ] !== null
        ) {
          copie[champ] = sousTotal;
        }
      });

      return copie;
    });

    this.actualiserVue();
  }

  private sauvegarderQuantite(id: string): void {
    if (
      this.detruit ||
      this.actionEnCours ||
      this.sauvegardesEnCours.has(id)
    ) {
      return;
    }

    const quantite = this.quantitesEnAttente.get(id);

    if (quantite === undefined) {
      return;
    }

    const quantiteConfirmee =
      this.quantitesConfirmees.get(id);

    if (quantiteConfirmee === quantite) {
      this.quantitesEnAttente.delete(id);
      this.actualiserVue();
      return;
    }

    this.sauvegardesEnCours.add(id);
    this.actualiserVue();

    this.abonnements.add(
      this.panierService
        .modifierQuantite(id, quantite)
        .subscribe({
          next: () => {
            this.quantitesConfirmees.set(id, quantite);

            if (
              this.quantitesEnAttente.get(id) === quantite
            ) {
              this.quantitesEnAttente.delete(id);
            }

            this.messageSucces = 'Quantité mise à jour.';
            this.erreur = '';

            this.actualiserVue();
          },

          error: (error: any) => {
            if (
              this.quantitesEnAttente.get(id) === quantite
            ) {
              this.quantitesEnAttente.delete(id);

              const derniereQuantiteConfirmee =
                this.quantitesConfirmees.get(id);

              if (
                derniereQuantiteConfirmee !== undefined
              ) {
                this.actualiserQuantiteLocale(
                  id,
                  derniereQuantiteConfirmee
                );
              }

              this.erreur = this.lireErreur(error);
            }

            console.error(
              'Erreur lors de la modification de quantité :',
              error
            );

            this.actualiserVue();
            this.finaliserSauvegardeQuantite(id);
          },

          complete: () => {
            this.finaliserSauvegardeQuantite(id);
          }
        })
    );
  }

  private finaliserSauvegardeQuantite(id: string): void {
    this.sauvegardesEnCours.delete(id);

    const quantiteAttendue =
      this.quantitesEnAttente.get(id);

    const quantiteConfirmee =
      this.quantitesConfirmees.get(id);

    this.actualiserVue();

    if (quantiteAttendue === undefined) {
      return;
    }

    if (quantiteAttendue === quantiteConfirmee) {
      this.quantitesEnAttente.delete(id);
      this.actualiserVue();
      return;
    }

    if (!this.timersQuantite.has(id)) {
      const timer = setTimeout(() => {
        this.timersQuantite.delete(id);
        this.actualiserVue();
        this.sauvegarderQuantite(id);
      }, 0);

      this.timersQuantite.set(id, timer);
      this.actualiserVue();
    }
  }

  // ==========================================
  // SUPPRESSION D'UN ARTICLE
  // ==========================================

  supprimerArticle(article: any): void {
    if (
      this.actionEnCours ||
      this.chargement
    ) {
      return;
    }

    if (this.miseAJourQuantiteEnCours) {
      this.erreur =
        'Attendez la fin de la mise à jour des quantités avant de supprimer un article.';

      this.actualiserVue();
      return;
    }

    const id = this.obtenirIdArticle(article);

    if (!id) {
      this.erreur =
        'Impossible de supprimer cet article : identifiant introuvable.';

      this.actualiserVue();
      return;
    }

    const anciennesLignes = [...this.articles];

    this.articles = this.articles.filter(
      (ligne: any) =>
        this.obtenirIdArticle(ligne) !== id
    );

    this.quantitesEnAttente.delete(id);
    this.quantitesConfirmees.delete(id);

    this.actualiserVue();

    this.executerAction(
      this.panierService.supprimer(id),
      'Article supprimé du panier.',
      anciennesLignes
    );
  }

  // ==========================================
  // VIDER LE PANIER
  // ==========================================

  viderPanier(): void {
    if (
      this.actionEnCours ||
      this.chargement
    ) {
      return;
    }

    if (this.miseAJourQuantiteEnCours) {
      this.erreur =
        'Attendez la fin des modifications avant de vider le panier.';

      this.actualiserVue();
      return;
    }

    if (this.articles.length === 0) {
      return;
    }

    const anciennesLignes = [...this.articles];

    this.articles = [];

    this.quantitesEnAttente.clear();
    this.quantitesConfirmees.clear();

    this.actualiserVue();

    this.executerAction(
      this.panierService.vider(),
      'Le panier a été vidé.',
      anciennesLignes
    );
  }

  // ==========================================
  // EXÉCUTION DES ACTIONS
  // ==========================================

  private executerAction(
    operation: Observable<any>,
    message: string,
    anciennesLignes: any[]
  ): void {
    this.actionEnCours = true;
    this.erreur = '';
    this.messageSucces = '';

    this.actualiserVue();

    this.abonnements.add(
      operation.subscribe({
        next: () => {
          this.messageSucces = message;
          this.erreur = '';

          this.actualiserVue();
        },

        error: (error: any) => {
          this.articles = anciennesLignes;
          this.erreur = this.lireErreur(error);
          this.actionEnCours = false;

          this.actualiserVue();
        },

        complete: () => {
          this.actionEnCours = false;

          this.actualiserVue();
        }
      })
    );
  }

  // ==========================================
  // GESTION DES ERREURS
  // ==========================================

  private lireErreur(error: any): string {
    const corps = error?.error;

    if (typeof corps === 'string' && corps.trim()) {
      return corps;
    }

    const message =
      corps?.message ??
      corps?.error ??
      corps?.details ??
      error?.message;

    if (Array.isArray(message)) {
      return message.join(' ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error?.status === 0) {
      return 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
    }

    if (error?.status === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }

    if (error?.status === 403) {
      return 'Vous n’êtes pas autorisée à effectuer cette action.';
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }
}