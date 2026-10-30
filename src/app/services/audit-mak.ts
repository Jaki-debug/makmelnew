
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ============================================================
// TYPES
// ============================================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PAYMENT'
  | 'REFUND'
  | 'ORDER_STATUS_CHANGE'
  | 'STOCK_ADJUSTMENT'
  | 'EXPORT'
  | 'OTHER';

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: AuditAction;
  module?: string;
  userId?: string;
  customerId?: string;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================
// SERVICE AUDIT
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class AuditMakService {

  private readonly apiUrl = '/api/v1/admin/audit-logs';

  constructor(
    private http: HttpClient
  ) {}

  // ============================================================
  // LISTE PAGINÉE ET FILTRES
  // GET /api/v1/admin/audit-logs
  // ============================================================

  getAuditLogs(
    filtres: AuditLogFilters = {}
  ): Observable<any> {

    let params = new HttpParams()
      .set('page', String(filtres.page ?? 1))
      .set('limit', String(filtres.limit ?? 20));

    if (filtres.action) {
      params = params.set('action', filtres.action);
    }

    if (filtres.module?.trim()) {
      params = params.set('module', filtres.module.trim());
    }

    if (filtres.userId?.trim()) {
      params = params.set('userId', filtres.userId.trim());
    }

    if (filtres.customerId?.trim()) {
      params = params.set('customerId', filtres.customerId.trim());
    }

    if (filtres.entityType?.trim()) {
      params = params.set('entityType', filtres.entityType.trim());
    }

    if (filtres.entityId?.trim()) {
      params = params.set('entityId', filtres.entityId.trim());
    }

    if (filtres.dateFrom?.trim()) {
      params = params.set('dateFrom', filtres.dateFrom.trim());
    }

    if (filtres.dateTo?.trim()) {
      params = params.set('dateTo', filtres.dateTo.trim());
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  // ============================================================
  // DÉTAIL D'UNE ENTRÉE D'AUDIT
  // GET /api/v1/admin/audit-logs/:id
  // ============================================================

  getAuditLogById(id: string): Observable<any> {
    const identifiant = encodeURIComponent(id);

    return this.http.get<any>(
      `${this.apiUrl}/${identifiant}`
    );
  }
}