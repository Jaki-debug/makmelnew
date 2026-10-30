import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginRequest {
email: string;
password: string;
}

export interface User {
id: string;
email: string;
firstName: string;
lastName: string;
roles: string[];
permissions: string[];
mfaEnabled: boolean;
mustChangePassword: boolean;
}

export interface LoginResponse {
success: boolean;
data: {
mfaRequired?: boolean;
mfaToken?: string;
passwordChangeToken?: string;
accessToken?: string;
user?: User;
};
message: string;
}

export interface MfaVerifyResponse {
success: boolean;
data: {
passwordChangeToken?: string;
accessToken?: string;
user?: User;
};
message: string;
}

export interface MeResponse {
success: boolean;
data: User;
message: string;
}

export interface MfaSetupResponse {
success: boolean;
data: {
secret: string;
otpauthUrl: string;
};
message: string;
}

@Injectable({
providedIn: 'root'
})
export class Auth {

private apiUrl = 'https://api.commecheznous.fr/api/v1/auth';

constructor(
private http: HttpClient
) {}

login(
email: string,
password: string
): Observable<LoginResponse> {

return this.http.post<LoginResponse>(
  this.apiUrl + '/login',
  {
    email: email,
    password: password
  },
  {
    withCredentials: true
  }
);

}

verifyMfa(
mfaToken: string,
code: string
): Observable<MfaVerifyResponse> {

return this.http.post<MfaVerifyResponse>(
  this.apiUrl + '/mfa/verify',
  {
    mfaToken: mfaToken,
    code: code
  },
  {
    withCredentials: true
  }
);

}

me(): Observable<MeResponse> {

return this.http.get<MeResponse>(
  this.apiUrl + '/me',
  {
    withCredentials: true
  }
);

}

refresh(): Observable<any> {

return this.http.post(
  this.apiUrl + '/refresh',
  {},
  {
    withCredentials: true
  }
);

}

logout(): Observable<any> {

return this.http.post(
  this.apiUrl + '/logout',
  {},
  {
    withCredentials: true
  }
);

}

changePassword(
currentPassword: string,
newPassword: string
): Observable<any> {

return this.http.patch(
  this.apiUrl + '/change-password',
  {
    currentPassword: currentPassword,
    newPassword: newPassword
  },
  {
    withCredentials: true
  }
);

}

changePasswordRequired(
passwordChangeToken: string,
currentPassword: string,
newPassword: string
): Observable<any> {

const headers = new HttpHeaders({
  Authorization: `Bearer ${passwordChangeToken}`
});

return this.http.post(
  this.apiUrl + '/change-password-required',
  {
    currentPassword: currentPassword,
    newPassword: newPassword
  },
  {
    headers: headers,
    withCredentials: true
  }
);

}

mfaSetup(): Observable<MfaSetupResponse> {

return this.http.post<MfaSetupResponse>(
  this.apiUrl + '/mfa/setup',
  {},
  {
    withCredentials: true
  }
);

}

mfaConfirm(
code: string
): Observable<any> {

return this.http.post(
  this.apiUrl + '/mfa/confirm',
  {
    code: code
  },
  {
    withCredentials: true
  }
);

}

mfaDisable(
code: string
): Observable<any> {

return this.http.post(
  this.apiUrl + '/mfa/disable',
  {
    code: code
  },
  {
    withCredentials: true
  }
);

}

isLoggedIn(): boolean {
return !!this.getToken();
}

getToken(): string | null {
return localStorage.getItem(
'accessToken'
);
}

setToken(
token: string
): void {

localStorage.setItem(
  'accessToken',
  token
);

}

removeToken(): void {

localStorage.removeItem(
  'accessToken'
);

}

getMfaToken(): string | null {

return localStorage.getItem(
  'mfaToken'
);

}

setMfaToken(
token: string
): void {

localStorage.setItem(
  'mfaToken',
  token
);

}

removeMfaToken(): void {

localStorage.removeItem(
  'mfaToken'
);

}

getPasswordChangeToken(): string | null {

return localStorage.getItem(
  'passwordChangeToken'
);

}

setPasswordChangeToken(
token: string
): void {

localStorage.setItem(
  'passwordChangeToken',
  token
);

}

removePasswordChangeToken(): void {

localStorage.removeItem(
  'passwordChangeToken'
);

}

getUtilisateur(): User | null {

const utilisateur =
  localStorage.getItem(
    'utilisateur'
  );

if (utilisateur) {
  return JSON.parse(utilisateur);
}

return null;

}

setUtilisateur(
utilisateur: User
): void {

localStorage.setItem(
  'utilisateur',
  JSON.stringify(utilisateur)
);

}

getRole(): string | null {

const utilisateur =
  this.getUtilisateur();

if (
  !utilisateur ||
  !utilisateur.roles
) {
  return null;
}

return utilisateur.roles[0] || null;

}

getPermissions(): string[] {

const utilisateur =
  this.getUtilisateur();

if (
  !utilisateur ||
  !utilisateur.permissions
) {
  return [];
}

return utilisateur.permissions;

}

hasPermission(
permission: string
): boolean {

return this
  .getPermissions()
  .includes(permission);

}

hasAnyPermission(
permissions: string[]
): boolean {

return permissions.some(
  permission =>
    this.hasPermission(permission)
);

}

hasAllPermissions(
permissions: string[]
): boolean {

return permissions.every(
  permission =>
    this.hasPermission(permission)
);

}

saveSession(
accessToken: string,
user: User
): void {

this.setToken(
  accessToken
);

this.setUtilisateur(
  user
);

this.removeMfaToken();
this.removePasswordChangeToken();

}

clearSession(): void {

localStorage.removeItem(
  'accessToken'
);

localStorage.removeItem(
  'utilisateur'
);

localStorage.removeItem(
  'mfaToken'
);

localStorage.removeItem(
  'passwordChangeToken'
);

}
}