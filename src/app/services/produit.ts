import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Produit,
  ProduitRequest,
  ProduitResponse,
  ProduitsListResponse,
  ProduitStatus
} from '../models/produit';

/**
 * Filtres de recherche des produits.
 *
 * Attention : les paramètres envoyés doivent correspondre
 * aux paramètres réellement pris en charge par le backend.
 */
export interface ProduitFiltres {
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  brand?: string;
  inStock?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProduitsService {

  private readonly apiUrl = 'https://api.commecheznous.fr/api/v1';

  constructor(
    private http: HttpClient
  ) {}

  // ============================================================
  // CONSTRUCTION DES PARAMÈTRES DE RECHERCHE
  // ============================================================

  private construireFiltres(
    params: HttpParams,
    filtres?: ProduitFiltres
  ): HttpParams {

    if (!filtres) {
      return params;
    }

    // Prix minimum
    if (
      filtres.minPrice !== undefined &&
      filtres.minPrice !== null &&
      Number.isFinite(filtres.minPrice)
    ) {
      params = params.set(
        'minPrice',
        filtres.minPrice.toString()
      );
    }

    // Prix maximum
    if (
      filtres.maxPrice !== undefined &&
      filtres.maxPrice !== null &&
      Number.isFinite(filtres.maxPrice)
    ) {
      params = params.set(
        'maxPrice',
        filtres.maxPrice.toString()
      );
    }

    // Taille
    if (filtres.size?.trim()) {
      params = params.set(
        'size',
        filtres.size.trim()
      );
    }

    // Couleur
    if (filtres.color?.trim()) {
      params = params.set(
        'color',
        filtres.color.trim()
      );
    }

    // Marque
    if (filtres.brand?.trim()) {
      params = params.set(
        'brand',
        filtres.brand.trim()
      );
    }

    // Disponibilité en stock.
    // La valeur false est aussi envoyée lorsqu'elle est explicitement fournie.
    if (filtres.inStock !== undefined) {
      params = params.set(
        'inStock',
        String(filtres.inStock)
      );
    }

    return params;
  }

  private construireParametres(
    page: number,
    limit: number,
    categoryId?: string,
    search: string = '',
    filtres?: ProduitFiltres
  ): HttpParams {

    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (categoryId?.trim()) {
      params = params.set(
        'categoryId',
        categoryId.trim()
      );
    }

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
      );
    }

    params = this.construireFiltres(params, filtres);

    return params;
  }

  // ============================================================
  // LISTE DES PRODUITS DU BACK-OFFICE
  // ============================================================

  getProduits(
    page: number = 1,
    limit: number = 20,
    categoryId?: string,
    search: string = '',
    status?: ProduitStatus,
    filtres?: ProduitFiltres
  ): Observable<ProduitsListResponse> {

    let params = this.construireParametres(
      page,
      limit,
      categoryId,
      search,
      filtres
    );

    // Statut du produit pour le back-office.
    if (status) {
      params = params.set(
        'status',
        status
      );
    }

    console.log(
      'PARAMÈTRES PRODUITS :',
      params.toString()
    );

    return this.http.get<ProduitsListResponse>(
      `${this.apiUrl}/admin/products`,
      {
        params,
        withCredentials: true
      }
    );
  }

  // ============================================================
  // CATALOGUE PUBLIC
  // ============================================================

  /**
   * Recherche dans le catalogue public.
   *
   * Selon la documentation fournie, GET /products retourne
   * les produits actifs et documente les filtres catégorie,
   * prix, taille et couleur.
   */
  getCatalogueProduits(
    page: number = 1,
    limit: number = 20,
    categoryId?: string,
    search: string = '',
    filtres?: ProduitFiltres
  ): Observable<ProduitsListResponse> {

    const params = this.construireParametres(
      page,
      limit,
      categoryId,
      search,
      filtres
    );

    console.log(
      'PARAMÈTRES DU CATALOGUE :',
      params.toString()
    );

    return this.http.get<ProduitsListResponse>(
      `${this.apiUrl}/products`,
      {
        params,
        withCredentials: true
      }
    );
  }

  // ============================================================
  // PRODUITS PAR CATÉGORIE
  // ============================================================

  getProduitsParCategorie(
    categoryId: string,
    page: number = 1,
    limit: number = 20,
    filtres?: ProduitFiltres
  ): Observable<ProduitsListResponse> {

    return this.getProduits(
      page,
      limit,
      categoryId,
      '',
      undefined,
      filtres
    );
  }

  // ============================================================
  // DÉTAIL D'UN PRODUIT
  // ============================================================

  getProduit(
    id: string
  ): Observable<ProduitResponse> {

    return this.http.get<ProduitResponse>(
      `${this.apiUrl}/admin/products/${encodeURIComponent(id)}`,
      {
        withCredentials: true
      }
    );
  }

  // ============================================================
  // CRÉATION D'UN PRODUIT
  // ============================================================

  createProduit(
    data: ProduitRequest
  ): Observable<ProduitResponse> {

    return this.http.post<ProduitResponse>(
      `${this.apiUrl}/admin/products`,
      data,
      {
        withCredentials: true
      }
    );
  }

  // ============================================================
  // MODIFICATION D'UN PRODUIT
  // ============================================================

  updateProduit(
    id: string,
    data: ProduitRequest
  ): Observable<ProduitResponse> {

    return this.http.patch<ProduitResponse>(
      `${this.apiUrl}/admin/products/${encodeURIComponent(id)}`,
      data,
      {
        withCredentials: true
      }
    );
  }

  // ============================================================
  // SUPPRESSION / ARCHIVAGE D'UN PRODUIT
  // ============================================================

  deleteProduit(
    id: string
  ): Observable<ProduitResponse> {

    return this.http.delete<ProduitResponse>(
      `${this.apiUrl}/admin/products/${encodeURIComponent(id)}`,
      {
        withCredentials: true
      }
    );
  }

  // ============================================================
  // AJOUT D'UNE VARIANTE
  // ============================================================

  ajouterVariante(
    productId: string,
    data: {
      sku: string;
      name: string;
      size?: string;
      color?: string;
      model?: string;
      price: number;
      compareAtPrice?: number | null;
      isActive?: boolean;
      initialQuantity?: number;
      lowStockThreshold?: number;
    }
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/admin/products/${encodeURIComponent(productId)}/variants`,
      data,
      {
        withCredentials: true
      }
    );
  }

  // ============================================================
  // MODIFICATION D'UNE VARIANTE
  // ============================================================

  modifierVariante(
    productId: string,
    variantId: string,
    data: {
      sku: string;
      name: string;
      size?: string;
      color?: string;
      model?: string;
      price: number;
      compareAtPrice?: number | null;
      isActive?: boolean;
      lowStockThreshold?: number;
    }
  ): Observable<any> {

    return this.http.patch(
      `${this.apiUrl}/admin/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      data,
      {
        withCredentials: true
      }
    );
  }

  // ============================================================
  // SUPPRESSION / DÉSACTIVATION D'UNE VARIANTE
  // ============================================================

  supprimerVariante(
    productId: string,
    variantId: string
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/admin/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      {
        withCredentials: true
      }
    );
  }
}