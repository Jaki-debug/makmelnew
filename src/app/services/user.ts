import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
id: string;
email: string;
firstName: string;
lastName: string;
phone: string | null;
status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
mfaEnabled: boolean;
roles: string[];
lastLoginAt: string | null;
createdAt: string;
}

export interface UserListResponse {
success: boolean;
data: User[];
meta: {
page: number;
limit: number;
total: number;
totalPages: number;
hasPreviousPage: boolean;
hasNextPage: boolean;
};
}

export interface RoleSelect {
id: string;
label: string;
}

export interface RoleSelectResponse {
success: boolean;
data: RoleSelect[];
message: string;
}

@Injectable({
providedIn: 'root'
})
export class UserService {

private apiUrl = 'https://api.commecheznous.fr/api/v1/admin/users';
private rolesUrl = 'https://api.commecheznous.fr/api/v1/admin/roles';

constructor(private http: HttpClient) {}

getUsers(
page: number = 1,
limit: number = 20,
search: string = '',
status: string = '',
roleId: string = ''
): Observable<UserListResponse> {

let params = new HttpParams()
  .set('page', page.toString())
  .set('limit', limit.toString());

if (search.trim()) {
  params = params.set('search', search.trim());
}

if (status) {
  params = params.set('status', status);
}

if (roleId) {
  params = params.set('roleId', roleId);
}

return this.http.get<UserListResponse>(
  this.apiUrl,
  {
    params: params,
    withCredentials: true
  }
);

}

getUser(id: string): Observable<any> {
return this.http.get(
this.apiUrl + '/' + id,
{
withCredentials: true
}
);
}

createUser(data: any): Observable<any> {
return this.http.post(
this.apiUrl,
data,
{
withCredentials: true
}
);
}

updateUser(id: string, data: any): Observable<any> {
return this.http.patch(
this.apiUrl + '/' + id,
data,
{
withCredentials: true
}
);
}

deleteUser(id: string): Observable<any> {
return this.http.delete(
this.apiUrl + '/' + id,
{
withCredentials: true
}
);
}

activateUser(id: string): Observable<any> {
return this.http.post(
this.apiUrl + '/' + id + '/activate',
{},
{
withCredentials: true
}
);
}

deactivateUser(id: string): Observable<any> {
return this.http.post(
this.apiUrl + '/' + id + '/deactivate',
{},
{
withCredentials: true
}
);
}

resetPassword(id: string): Observable<any> {
return this.http.post(
this.apiUrl + '/' + id + '/reset-password',
{},
{
withCredentials: true
}
);
}

getRolesSelect(): Observable<RoleSelectResponse> {
return this.http.get<RoleSelectResponse>(
this.rolesUrl + '/select',
{
withCredentials: true
}
);
}
}