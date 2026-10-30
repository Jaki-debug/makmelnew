import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaiementsService {

  private readonly apiUrl = 'https://api.commecheznous.fr/api/v1/admin/payments';

  constructor(private http: HttpClient) {}

  // Lister les paiements avec filtres et pagination
  lister(filtres: {
    page: number;
    limit: number;
    status?: string;
    method?: string;
    orderId?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<any> {

    let params = new HttpParams()
      .set('page', filtres.page)
      .set('limit', filtres.limit);

    if (filtres.status) {
      params = params.set('status', filtres.status);
    }

    if (filtres.method) {
      params = params.set('method', filtres.method);
    }

    if (filtres.orderId) {
      params = params.set('orderId', filtres.orderId);
    }

    if (filtres.customerId) {
      params = params.set('customerId', filtres.customerId);
    }

    if (filtres.dateFrom) {
      params = params.set('dateFrom', filtres.dateFrom);
    }

    if (filtres.dateTo) {
      params = params.set('dateTo', filtres.dateTo);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  // Lister les paiements associés à une commande
  listerParCommande(orderId: string): Observable<any> {
    return this.lister({
      page: 1,
      limit: 100,
      orderId
    });
  }

  // Consulter le détail d'un paiement
  detail(paiementId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${encodeURIComponent(paiementId)}`
    );
  }

  // Confirmer manuellement un paiement reçu à la boutique
  marquerReussi(
    paiementId: string,
    paidAmount: number,
    providerReference: string
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${encodeURIComponent(paiementId)}/mark-success`,
      {
        paidAmount,
        providerReference
      }
    );
  }

  // Marquer manuellement un paiement comme échoué
  marquerEchoue(
    paiementId: string,
    reason: string
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${encodeURIComponent(paiementId)}/mark-failed`,
      {
        reason
      }
    );
  }

  // Annuler un paiement encore en attente
  annuler(paiementId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${encodeURIComponent(paiementId)}/cancel`,
      {}
    );
  }
}