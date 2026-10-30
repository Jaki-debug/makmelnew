import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  InventoryResponse,
  InventoryMovement,
  InventoryAlert,
  SlowMovingItem,
  InventoryCount,
  InventoryCountRequest,
  StockInRequest,
  StockOutRequest,
  StockAdjustmentRequest,
  Inventory
} from '../models/inventory';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private readonly apiUrl = 'https://api.commecheznous.fr/api/v1/admin/inventory';

  constructor(private http: HttpClient) {}

  getInventory(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    lowStockOnly: boolean = false
  ): Observable<InventoryResponse> {

    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (lowStockOnly) {
      params = params.set('lowStockOnly', true);
    }

    return this.http.get<InventoryResponse>(this.apiUrl, { params });
  }

  getInventoryByVariant(variantId: string): Observable<Inventory> {
    return this.http.get<Inventory>(`${this.apiUrl}/${variantId}`);
  }

  getMovements(): Observable<any> {
    return this.http.get(`${this.apiUrl}/movements`);
  }

  getAlerts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/alerts`);
  }

  getSlowMovingItems(): Observable<any> {
    return this.http.get(`${this.apiUrl}/slow-moving`);
  }

  stockIn(data: StockInRequest): Observable<Inventory> {
    return this.http.post<Inventory>(
      `${this.apiUrl}/stock-in`,
      data
    );
  }

  stockOut(data: StockOutRequest): Observable<Inventory> {
    return this.http.post<Inventory>(
      `${this.apiUrl}/stock-out`,
      data
    );
  }

  adjustStock(data: StockAdjustmentRequest): Observable<Inventory> {
    return this.http.post<Inventory>(
      `${this.apiUrl}/adjust`,
      data
    );
  }

  createInventoryCount(
    data: InventoryCountRequest
  ): Observable<InventoryCount> {
    return this.http.post<InventoryCount>(
      `${this.apiUrl}/counts`,
      data
    );
  }

  getInventoryCount(id: string): Observable<InventoryCount> {
    return this.http.get<InventoryCount>(
      `${this.apiUrl}/counts/${id}`
    );
  }
}