
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { Router, NavigationEnd } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

import {
  debounceTime,
  distinctUntilChanged,
  filter
} from 'rxjs/operators';

import { ClientAuthService } from '../services/client-auth';
import { ClientCategoriesService } from '../services/client-categories';
import { ClientPanier } from '../services/client-panier';

@Component({
  selector: 'app-client-header',
  standalone: false,
  templateUrl: './client-header.html',
  styleUrl: './client-header.css'
})
export class ClientHeader implements OnInit, OnDestroy {

  searchTerm = '';
  categorieSelectionneeId = '';
  categories: any[] = [];

  clientConnecte = false;
  prenomClient = '';
  menuCompteOuvert = false;

  nombreArticlesPanier = 0;
  panierOuvert = false;

  private rechercheSubject = new Subject<string>();

  private rechercheSubscription?: Subscription;
  private navigationSubscription?: Subscription;
  private authSubscription?: Subscription;
  private categoriesSubscription?: Subscription;
  private panierSubscription?: Subscription;

  constructor(
    private router: Router,
    private clientAuthService: ClientAuthService,
    private categoriesService: ClientCategoriesService,
    private panierService: ClientPanier,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  // INITIALISATION

  ngOnInit(): void {

    this.rechercheSubscription =
      this.rechercheSubject.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(() => {
        this.rechercher();
      });

    this.synchroniserDepuisUrl();

    this.navigationSubscription =
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.synchroniserDepuisUrl();
        this.panierOuvert = false;
      });

    this.authSubscription =
      this.clientAuthService.clientConnecte$.subscribe(
        (client: any) => {

          if (client) {
            this.clientConnecte = true;

            this.prenomClient =
              client.firstName ||
              client.firstname ||
              client.prenom ||
              client.name ||
              '';
          } else {
            this.clientConnecte = false;
            this.prenomClient = '';
            this.menuCompteOuvert = false;
          }

          this.changeDetectorRef.detectChanges();
        }
      );

    this.panierSubscription =
      this.panierService.panierMisAJour$.subscribe(() => {
        this.chargerNombreArticles();
      });

    this.chargerCategories();
    this.verifierConnexion();
    this.initialiserBadgePanier();
  }

  // SYNCHRONISATION AVEC L'URL

  private synchroniserDepuisUrl(): void {
    const params = this.router.parseUrl(
      this.router.url
    ).queryParams;

    this.searchTerm = params['search'] || '';
    this.categorieSelectionneeId = params['category'] || '';

    this.changeDetectorRef.detectChanges();
  }

  // CATÉGORIES

  chargerCategories(): void {
    this.categoriesSubscription =
      this.categoriesService.getCategories().subscribe({

        next: (response: any) => {

          const donnees =
            response?.data?.items ??
            response?.data?.content ??
            response?.data?.categories ??
            response?.data?.data ??
            response?.data ??
            response?.items ??
            response?.content ??
            response?.categories ??
            response;

          const liste = Array.isArray(donnees)
            ? donnees
            : [];

          const resultat = new Map<string, any>();

          const parcourir = (
            elements: any[],
            parentIdHerite: string | null = null
          ): void => {

            for (const categorie of elements) {

              if (!categorie) {
                continue;
              }

              const idBrut =
                categorie.id ??
                categorie.categoryId ??
                categorie.category_id ??
                categorie.categorieId ??
                categorie.categorie_id;

              const nom =
                categorie.name ??
                categorie.nom ??
                categorie.label ??
                categorie.libelle;

              const parentBrut =
                categorie.parentId ??
                categorie.parent_id ??
                categorie.parent?.id ??
                parentIdHerite ??
                null;

              const id = idBrut == null
                ? ''
                : String(idBrut).trim();

              const parentId = parentBrut == null
                ? ''
                : String(parentBrut).trim();

              const active =
                categorie.active !== false &&
                categorie.isActive !== false &&
                categorie.is_active !== false;

              if (id && nom && !parentId && active) {
                resultat.set(id, {
                  id,
                  nom: String(nom),
                  parentId: ''
                });
              }

              const enfants =
                categorie.children ??
                categorie.subcategories ??
                categorie.subCategories ??
                categorie.sub_categories ??
                [];

              if (Array.isArray(enfants)) {
                parcourir(
                  enfants,
                  id || parentIdHerite
                );
              }
            }
          };

          parcourir(liste);

          this.categories = Array.from(
            resultat.values()
          ).sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr')
          );

          this.changeDetectorRef.detectChanges();
        },

        error: (erreur: any) => {
          console.error(
            'Erreur lors du chargement des catégories :',
            erreur
          );

          this.categories = [];
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  // RECHERCHE ET FILTRES

  onRechercheChange(terme: string): void {
    this.searchTerm = terme;
    this.rechercheSubject.next(terme);
  }

  onCategorieChange(categorieId: string): void {
    this.categorieSelectionneeId = categorieId || '';
    this.rechercher();
  }

  rechercher(): void {
    const recherche = this.searchTerm.trim();

    this.router.navigate(
      ['/client/produitcatalogue'],
      {
        queryParams: {
          search: recherche || null,
          category: this.categorieSelectionneeId || null
        }
      }
    );
  }

  // CONNEXION CLIENT

  verifierConnexion(): void {
    this.clientAuthService.getProfil().subscribe({
      next: (response: any) => {

        const profil = response?.data || response;

        if (profil) {
          this.clientAuthService.setClientConnecte(profil);
        }

        this.changeDetectorRef.detectChanges();
      },

      error: () => {
        this.clientConnecte = false;
        this.prenomClient = '';
        this.menuCompteOuvert = false;

        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // BADGE DU PANIER

  private initialiserBadgePanier(): void {
    this.panierService.creerOuRecuperer().subscribe({
      next: () => {
        this.chargerNombreArticles();
      },

      error: (erreur: any) => {
        console.error(
          'Impossible d’initialiser le panier :',
          erreur
        );

        this.chargerNombreArticles();
      }
    });
  }

  chargerNombreArticles(): void {
    this.panierService.recuperer().subscribe({
      next: (response: any) => {

        let donnees: any = response;

        for (let i = 0; i < 5; i++) {

          if (
            donnees?.data &&
            typeof donnees.data === 'object' &&
            !Array.isArray(donnees.data)
          ) {
            donnees = donnees.data;

          } else if (
            donnees?.cart &&
            typeof donnees.cart === 'object' &&
            !Array.isArray(donnees.cart)
          ) {
            donnees = donnees.cart;

          } else if (
            donnees?.panier &&
            typeof donnees.panier === 'object' &&
            !Array.isArray(donnees.panier)
          ) {
            donnees = donnees.panier;

          } else if (
            donnees?.result &&
            typeof donnees.result === 'object' &&
            !Array.isArray(donnees.result)
          ) {
            donnees = donnees.result;

          } else {
            break;
          }
        }

        const articles =
          donnees?.items ??
          donnees?.articles ??
          donnees?.cartItems ??
          donnees?.cart_items ??
          donnees?.lines;

        if (Array.isArray(articles)) {

          this.nombreArticlesPanier = articles.reduce(
            (total: number, article: any) => {
              const quantite = Number(
                article?.quantity ??
                article?.quantite ??
                1
              );

              return total + (
                Number.isFinite(quantite) && quantite > 0
                  ? quantite
                  : 1
              );
            },
            0
          );

        } else {

          this.nombreArticlesPanier = Math.max(
            0,
            Number(
              donnees?.totalQuantity ??
              donnees?.itemCount ??
              donnees?.totalItems ??
              donnees?.total_items ??
              donnees?.count ??
              0
            ) || 0
          );
        }

        this.changeDetectorRef.detectChanges();
      },

      error: (erreur: any) => {
        console.error(
          'Erreur lors de la récupération du panier :',
          erreur
        );

        this.nombreArticlesPanier = 0;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // OUVERTURE ET FERMETURE DU TIROIR

  allerPanier(): void {
    this.menuCompteOuvert = false;
    this.panierOuvert = true;

    this.changeDetectorRef.detectChanges();
  }

  ouvrirPanier(): void {
    this.allerPanier();
  }

  fermerPanier(): void {
    this.panierOuvert = false;
    this.changeDetectorRef.detectChanges();
  }

  // NAVIGATION

  allerAccueil(): void {
    this.router.navigate(['/client']);
  }

  allerBoutique(): void {
    this.router.navigate(['/client/produitcatalogue']);
  }

  allerConnexion(): void {
    this.router.navigate(['/client/connexion']);
  }

  allerCompte(): void {
    this.menuCompteOuvert = false;
    this.router.navigate(['/client/compte']);
  }

  
 allerMesCommandes(): void {
  this.menuCompteOuvert = false;
  this.router.navigate(['/client/mes-commandes']);
  }

  // MENU DU COMPTE

  ouvrirMenuCompte(): void {
    this.menuCompteOuvert = !this.menuCompteOuvert;
  }

  fermerMenuCompte(): void {
    this.menuCompteOuvert = false;
  }

  // DÉCONNEXION

  seDeconnecter(): void {
    this.clientAuthService.deconnecter().subscribe({
      next: () => this.finaliserDeconnexion(),
      error: () => this.finaliserDeconnexion()
    });
  }

  private finaliserDeconnexion(): void {

    this.clientAuthService.effacerClientConnecte();

    this.clientConnecte = false;
    this.prenomClient = '';
    this.menuCompteOuvert = false;
    this.panierOuvert = false;
    this.nombreArticlesPanier = 0;

    this.changeDetectorRef.detectChanges();

    this.router.navigate(['/client']);
  }

  // DESTRUCTION DU COMPOSANT

  ngOnDestroy(): void {
    this.rechercheSubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.categoriesSubscription?.unsubscribe();
    this.panierSubscription?.unsubscribe();

    this.rechercheSubject.complete();
  }
}