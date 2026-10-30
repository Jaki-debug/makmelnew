import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
Categorie,
CategorieRequest,
CategoriesListResponse,
CategorieResponse
} from '../models/categorie';

@Injectable({
providedIn: 'root'
})
export class CategoriesService {

private apiUrl = 'https://api.commecheznous.fr/api/v1';

constructor(
private http: HttpClient
) {}

getCategories(
page: number = 1,
limit: number = 20,
search: string = '',
isActive?: boolean,
parentId?: string
): Observable<CategoriesListResponse> {

let params = new HttpParams()
  .set('page', page.toString())
  .set('limit', limit.toString());

if (search.trim()) {
  params = params.set(
    'search',
    search.trim()
  );
}

if (isActive !== undefined) {
  params = params.set(
    'isActive',
    isActive.toString()
  );
}

if (parentId) {
  params = params.set(
    'parentId',
    parentId
  );
}

return this.http.get<CategoriesListResponse>(
  `${this.apiUrl}/admin/categories`,
  {
    params,
    withCredentials: true
  }
);

}

getCategorie(
id: string
): Observable<CategorieResponse> {

return this.http.get<CategorieResponse>(
  `${this.apiUrl}/admin/categories/${id}`,
  {
    withCredentials: true
  }
);

}

getCategoriesSelect(): Observable<Categorie[]> {

return this.http.get<Categorie[]>(
  `${this.apiUrl}/admin/categories/select`,
  {
    withCredentials: true
  }
);

}

createCategorie(
data: CategorieRequest
): Observable<CategorieResponse> {

return this.http.post<CategorieResponse>(
  `${this.apiUrl}/admin/categories`,
  data,
  {
    withCredentials: true
  }
);

}

updateCategorie(
id: string,
data: CategorieRequest
): Observable<CategorieResponse> {

return this.http.patch<CategorieResponse>(
  `${this.apiUrl}/admin/categories/${id}`,
  data,
  {
    withCredentials: true
  }
);

}

deleteCategorie(
id: string
): Observable<any> {

return this.http.delete(
  `${this.apiUrl}/admin/categories/${id}`,
  {
    withCredentials: true
  }
);

}
}