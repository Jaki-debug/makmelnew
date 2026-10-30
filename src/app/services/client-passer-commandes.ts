import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdresseCommande {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
}

export interface ArticlePanierDetail {
  id?: string;
  productId?: string;
  variantId?: string;
  name?: string;
  productName?: string;
  imageUrl?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface PanierDetail {
  id?: string;
  items?: ArticlePanierDetail[];
  articles?: ArticlePanierDetail[];
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  itemCount?: number;
}

export interface NouvelleCommande {
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  paymentMethod: string;
  addressId?: string;
  address?: AdresseCommande;
  deliveryZoneId?: string;
  couponCode?: string;
  notes?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientPasserCommandes {

  private readonly apiUrl = '/api/v1/orders';
  private readonly paiementsUrl = '/api/v1/payments';

  constructor(private http: HttpClient) {}

  // ==========================================
  // CRÉER UNE COMMANDE
  // ==========================================

  passerCommande(commande: NouvelleCommande): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      commande,
      { withCredentials: true }
    );
  }

  // ==========================================
  // RÉCUPÉRER LES COMMANDES DU CLIENT
  // ==========================================

  recupererCommandes(
    page: number = 1,
    limit: number = 20
  ): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: {
        page: page.toString(),
        limit: limit.toString()
      },
      withCredentials: true
    });
  }

  // ==========================================
  // RÉCUPÉRER LE DÉTAIL D'UNE COMMANDE
  // ==========================================

  recupererCommande(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }

  // ==========================================
  // RÉCUPÉRER LE DÉTAIL D'UN PAIEMENT
  // GET /api/v1/payments/{id}
  // ==========================================

  recupererPaiement(paiementId: string): Observable<any> {
    return this.http.get<any>(
      `${this.paiementsUrl}/${encodeURIComponent(paiementId)}`,
      { withCredentials: true }
    );
  }
}