
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'PUSH'
  | 'IN_APP';

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

export interface NotificationFilters {
  page: number;
  limit: number;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  customerId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private readonly apiUrl = 'https://api.commecheznous.fr/api/v1';

  constructor(private http: HttpClient) {}

  // Notifications du client connecté
  getNotificationsClient(
    page = 1,
    limit = 20
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    return this.http.get(
      `${this.apiUrl}/notifications`,
      { params }
    );
  }

  // Toutes les notifications pour l'administration
  getNotificationsAdmin(
    filtres: NotificationFilters
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', filtres.page)
      .set('limit', filtres.limit);

    if (filtres.channel) {
      params = params.set('channel', filtres.channel);
    }

    if (filtres.status) {
      params = params.set('status', filtres.status);
    }

    if (filtres.customerId?.trim()) {
      params = params.set(
        'customerId',
        filtres.customerId.trim()
      );
    }

    if (filtres.orderId?.trim()) {
      params = params.set(
        'orderId',
        filtres.orderId.trim()
      );
    }

    if (filtres.dateFrom) {
      params = params.set('dateFrom', filtres.dateFrom);
    }

    if (filtres.dateTo) {
      params = params.set('dateTo', filtres.dateTo);
    }

    return this.http.get(
      `${this.apiUrl}/admin/notifications`,
      { params }
    );
  }

  // Relancer une notification en échec
  relancerNotification(id: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/admin/notifications/${encodeURIComponent(id)}/retry`,
      {}
    );
  }
}
