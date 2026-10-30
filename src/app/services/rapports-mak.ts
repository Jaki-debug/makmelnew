
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PeriodeRapportMak {
  dateFrom?: string;
  dateTo?: string;
}

export type TypeRapportMak =
  | 'SALES'
  | 'ORDERS'
  | 'PRODUCTS'
  | 'INVENTORY'
  | 'CUSTOMERS'
  | 'PAYMENTS'
  | 'LOYALTY';

export type FormatRapportMak = 'CSV' | 'XLSX' | 'PDF';

export interface ExportRapportMak {
  report: TypeRapportMak;
  format: FormatRapportMak;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RapportsMakService {

  private readonly apiUrl =
    'https://api.commecheznous.fr/api/v1/admin/reports';

  constructor(private http: HttpClient) {}

  /**
   * Rapport des ventes regroupées par jour.
   */
  getSales(
    periode: PeriodeRapportMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/sales`,
      {
        params: this.creerParamsPeriode(periode)
      }
    );
  }

  /**
   * Rapport détaillé des commandes.
   */
  getOrders(
    periode: PeriodeRapportMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/orders`,
      {
        params: this.creerParamsPeriode(periode)
      }
    );
  }

  /**
   * Rapport des produits : quantités vendues et chiffre d'affaires.
   */
  getProducts(
    periode: PeriodeRapportMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/products`,
      {
        params: this.creerParamsPeriode(periode)
      }
    );
  }

  /**
   * Rapport instantané de l'inventaire.
   * Cet endpoint ne nécessite pas de période.
   */
  getInventory(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/inventory`
    );
  }

  /**
   * Rapport des clients : commandes et dépenses sur la période.
   */
  getCustomers(
    periode: PeriodeRapportMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/customers`,
      {
        params: this.creerParamsPeriode(periode)
      }
    );
  }

  /**
   * Rapport détaillé des paiements.
   */
  getPayments(
    periode: PeriodeRapportMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/payments`,
      {
        params: this.creerParamsPeriode(periode)
      }
    );
  }

  /**
   * Rapport de fidélité : points gagnés et utilisés par client.
   */
  getLoyalty(
    periode: PeriodeRapportMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/loyalty`,
      {
        params: this.creerParamsPeriode(periode)
      }
    );
  }

  /**
   * Exporte un rapport en CSV, XLSX ou PDF.
   * La réponse est récupérée sous forme de Blob.
   */
  exportReport(
    demande: ExportRapportMak
  ): Observable<Blob> {
    const payload: ExportRapportMak = {
      report: demande.report,
      format: demande.format
    };

    if (demande.report !== 'INVENTORY') {
      if (demande.dateFrom) {
        payload.dateFrom = demande.dateFrom;
      }

      if (demande.dateTo) {
        payload.dateTo = demande.dateTo;
      }
    }

    return this.http.post(
      `${this.apiUrl}/export`,
      payload,
      {
        responseType: 'blob' as const
      }
    );
  }

  /**
   * Construit les paramètres de période communs aux rapports.
   */
  private creerParamsPeriode(
    periode: PeriodeRapportMak
  ): HttpParams {
    let params = new HttpParams();

    if (periode.dateFrom) {
      params = params.set(
        'dateFrom',
        periode.dateFrom
      );
    }

    if (periode.dateTo) {
      params = params.set(
        'dateTo',
        periode.dateTo
      );
    }

    return params;
  }
}