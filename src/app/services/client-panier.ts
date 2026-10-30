import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientPanier {

  private readonly apiUrl = '/api/v1/cart';

  /**
   * Cache de la dernière lecture du panier.
   * Il est invalidé après chaque modification réussie.
   */
  private panierCache$?: Observable<any>;

  /**
   * Notification destinée au badge du panier
   * et aux autres composants abonnés.
   */
  private readonly panierMisAJourSubject =
    new Subject<void>();

  readonly panierMisAJour$ =
    this.panierMisAJourSubject.asObservable();

  constructor(
    private http: HttpClient
  ) {}

  /**
   * POST /api/v1/cart
   * Créer ou récupérer le panier actif.
   */
  creerOuRecuperer(): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      null,
      {
        withCredentials: true
      }
    ).pipe(
      tap(() => {
        this.invaliderCache();
      })
    );
  }

  /**
   * GET /api/v1/cart
   * Récupérer le panier actif.
   *
   * Plusieurs composants peuvent partager la même lecture.
   */
  recuperer(): Observable<any> {
    if (!this.panierCache$) {
      this.panierCache$ = this.http.get<any>(
        this.apiUrl,
        {
          withCredentials: true
        }
      ).pipe(
        tap({
          error: () => {
            this.invaliderCache();
          }
        }),
        shareReplay({
          bufferSize: 1,
          refCount: false
        })
      );
    }

    return this.panierCache$;
  }

  /**
   * DELETE /api/v1/cart
   * Vider entièrement le panier.
   */
  vider(): Observable<any> {
    return this.http.delete<any>(
      this.apiUrl,
      {
        withCredentials: true
      }
    ).pipe(
      tap(() => {
        this.apresModification();
      })
    );
  }

  /**
   * POST /api/v1/cart/items
   * Ajouter un article ou augmenter sa quantité.
   */
  ajouter(
    variantId: string,
    quantity: number = 1
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/items`,
      {
        variantId,
        quantity
      },
      {
        withCredentials: true
      }
    ).pipe(
      tap(() => {
        this.apresModification();
      })
    );
  }

  /**
   * PATCH /api/v1/cart/items/{itemId}
   * Modifier la quantité d'une ligne.
   *
   * itemId doit être l'identifiant de la ligne du panier,
   * et non l'identifiant du produit ou de sa variante.
   */
  modifierQuantite(
    itemId: string,
    quantity: number
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/items/${encodeURIComponent(itemId)}`,
      {
        quantity
      },
      {
        withCredentials: true
      }
    ).pipe(
      tap(() => {
        this.apresModification();
      })
    );
  }

  /**
   * DELETE /api/v1/cart/items/{itemId}
   * Supprimer une ligne du panier.
   */
  supprimer(
    itemId: string
  ): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/items/${encodeURIComponent(itemId)}`,
      {
        withCredentials: true
      }
    ).pipe(
      tap(() => {
        this.apresModification();
      })
    );
  }

  /**
   * POST /api/v1/cart/merge
   * Fusionner le panier invité après connexion.
   */
  fusionnerInvite(): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/merge`,
      null,
      {
        withCredentials: true
      }
    ).pipe(
      tap(() => {
        this.apresModification();
      })
    );
  }

  /**
   * Après une mutation réussie :
   * 1. invalider le cache pour éviter les anciennes données ;
   * 2. prévenir les composants abonnés.
   */
  private apresModification(): void {
    this.invaliderCache();
    this.panierMisAJourSubject.next();
  }

  /**
   * Forcer la prochaine lecture à interroger l'API.
   */
  private invaliderCache(): void {
    this.panierCache$ = undefined;
  }
}