import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardPeriodeMak {
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardMakService {

  private readonly apiUrl =
    'https://api.commecheznous.fr/api/v1/admin/dashboard';

  constructor(private http: HttpClient) {}

  // ==========================================
  // VUE D'ENSEMBLE
  // GET /api/v1/admin/dashboard
  // ==========================================

  getOverview(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // ==========================================
  // STATISTIQUES DES VENTES
  // GET /api/v1/admin/dashboard/sales
  // ==========================================

  getSales(
    periode: DashboardPeriodeMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/sales`,
      { params: this.creerParamsPeriode(periode) }
    );
  }

  // ==========================================
  // STATISTIQUES DES COMMANDES
  // GET /api/v1/admin/dashboard/orders
  // ==========================================

  getOrders(
    periode: DashboardPeriodeMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/orders`,
      { params: this.creerParamsPeriode(periode) }
    );
  }

  // ==========================================
  // STATISTIQUES DU STOCK
  // GET /api/v1/admin/dashboard/inventory
  // ==========================================

  getInventory(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/inventory`
    );
  }

  // ==========================================
  // STATISTIQUES DES CLIENTS
  // GET /api/v1/admin/dashboard/customers
  // ==========================================

  getCustomers(
    periode: DashboardPeriodeMak = {}
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/customers`,
      { params: this.creerParamsPeriode(periode) }
    );
  }

  // ==========================================
  // CONSTRUIRE LES PARAMÈTRES DE PÉRIODE
  // ==========================================

  private creerParamsPeriode(
    periode: DashboardPeriodeMak
  ): HttpParams {
    let params = new HttpParams();

    if (periode.dateFrom) {
      params = params.set('dateFrom', periode.dateFrom);
    }

    if (periode.dateTo) {
      params = params.set('dateTo', periode.dateTo);
    }

    return params;
  }
}