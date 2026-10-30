import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientProduitsService {

  private apiUrl = 'https://api.commecheznous.fr/api/v1/products';
  private filesUrl = 'https://api.commecheznous.fr/api/v1/files';

  constructor(
    private http: HttpClient
  ) {}

  getProduits(
    page: number = 1,
    limit: number = 50,
    search: string = ''
  ): Observable<any> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search.trim()) {
      params = params.set(
        'search',
        search.trim()
      );
    }

    return this.http.get<any>(
      this.apiUrl,
      {
        params,
        withCredentials: true
      }
    );
  }

  getProduit(
    id: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`,
      {
        withCredentials: true
      }
    );
  }

  getProduitParSlug(
    slug: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/slug/${slug}`,
      {
        withCredentials: true
      }
    );
  }

  getImageUrl(
    fileId: string | null | undefined
  ): string {

    if (!fileId) {
      return 'assets/images/products/product-default.jpg';
    }

    return `${this.filesUrl}/${fileId}`;
  }
}