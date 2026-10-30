import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Categorie } from '../models/categorie';

@Injectable({
providedIn: 'root'
})
export class ClientCategoriesService {

private apiUrl = 'https://api.commecheznous.fr/api/v1/categories';

constructor(
private http: HttpClient
) {}

getCategories(): Observable<any> {

return this.http.get<any>(
  this.apiUrl,
  {
    withCredentials: true
  }
);

}

getCategorie(
id: string
): Observable<any> {

return this.http.get<any>(
  `${this.apiUrl}/${id}`,
  {
    withCredentials: true
  }
);

}

getCategorieParSlug(
slug: string
): Observable<any> {

return this.http.get<any>(
  `${this.apiUrl}/slug/${slug}`,
  {
    withCredentials: true
  }
);

}

}