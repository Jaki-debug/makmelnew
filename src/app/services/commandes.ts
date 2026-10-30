
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommandesService {

  private readonly apiUrl = 'https://api.commecheznous.fr/api/v1/admin/orders';

  constructor(private http: HttpClient) {}

  lister(filtres: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    fulfillmentType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<any> {

    let params = new HttpParams()
      .set('page', filtres.page)
      .set('limit', filtres.limit);

    if (filtres.search?.trim()) {
      params = params.set('search', filtres.search.trim());
    }

    if (filtres.status) {
      params = params.set('status', filtres.status);
    }

    if (filtres.fulfillmentType) {
      params = params.set('fulfillmentType', filtres.fulfillmentType);
    }

    if (filtres.dateFrom) {
      params = params.set('dateFrom', filtres.dateFrom);
    }

    if (filtres.dateTo) {
      params = params.set('dateTo', filtres.dateTo);
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  detail(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${encodeURIComponent(id)}`
    );
  }

  changerStatut(id: string, status: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${encodeURIComponent(id)}/status`,
      { status }
    );
  }

  annuler(id: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${encodeURIComponent(id)}/cancel`,
      {}
    );
  }

  rembourser(id: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${encodeURIComponent(id)}/refund`,
      {}
    );
  }
}