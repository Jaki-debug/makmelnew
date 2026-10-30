import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
id: string;
name: string;
description: string | null;
isSystem: boolean;
createdAt: string;
updatedAt: string;
}

export interface RoleListResponse {
success: boolean;
data: Role[];
meta: {
page: number;
limit: number;
total: number;
totalPages: number;
hasPreviousPage: boolean;
hasNextPage: boolean;
};
message?: string;
}

@Injectable({
providedIn: 'root'
})
export class RoleService {

private apiUrl = 'https://api.commecheznous.fr/api/v1/admin/roles';

constructor(private http: HttpClient) {}

getRoles(
page = 1,
limit = 20,
search = ''
): Observable<RoleListResponse> {

let params = new HttpParams()
  .set('page', page.toString())
  .set('limit', limit.toString());

if (search.trim()) {
  params = params.set('search', search.trim());
}

return this.http.get<RoleListResponse>(
  this.apiUrl,
  {
    params: params,
    withCredentials: true
  }
);

}

getRole(id: string): Observable<any> {
return this.http.get(
this.apiUrl + '/' + id,
{
withCredentials: true
}
);
}

createRole(data: any): Observable<any> {
return this.http.post(
this.apiUrl,
data,
{
withCredentials: true
}
);
}

updateRole(id: string, data: any): Observable<any> {
return this.http.patch(
this.apiUrl + '/' + id,
data,
{
withCredentials: true
}
);
}

deleteRole(id: string): Observable<any> {
return this.http.delete(
this.apiUrl + '/' + id,
{
withCredentials: true
}
);
}

getRolePermissions(id: string): Observable<any> {
return this.http.get(
this.apiUrl + '/' + id + '/permissions',
{
withCredentials: true
}
);
}

updateRolePermissions(
id: string,
permissionCodes: string[]
): Observable<any> {
return this.http.put(
this.apiUrl + '/' + id + '/permissions',
{
permissionCodes: permissionCodes
},
{
withCredentials: true
}
);
}

getPermissions(): Observable<any> {
return this.http.get(
'https://api.commecheznous.fr/api/v1/admin/permissions',
{
withCredentials: true
}
);
}

getPermission(id: string): Observable<any> {
return this.http.get(
'https://api.commecheznous.fr/api/v1/admin/permissions/' + id,
{
withCredentials: true
}
);
}
}
