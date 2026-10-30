import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
providedIn: 'root'
})
export class ClientAuthService {

private apiUrl = 'https://api.commecheznous.fr/api/v1/customers';

private clientConnecteSubject = new BehaviorSubject<any>(
this.getClientStocke()
);

clientConnecte$ = this.clientConnecteSubject.asObservable();

constructor(private http: HttpClient) {}

// Inscription d'un client
inscrire(data: any): Observable<any> {
return this.http.post(
this.apiUrl + '/register',
data,
{ withCredentials: true }
);
}

// Connexion d'un client
connecter(data: any): Observable<any> {
return this.http.post(
this.apiUrl + '/login',
data,
{ withCredentials: true }
);
}

// Renouvellement de session
refresh(): Observable<any> {
return this.http.post(
this.apiUrl + '/refresh',
{},
{ withCredentials: true }
);
}

// Déconnexion
deconnecter(): Observable<any> {
return this.http.post(
this.apiUrl + '/logout',
{},
{ withCredentials: true }
);
}

// Récupération du profil depuis l'API
getProfil(): Observable<any> {
return this.http.get(
this.apiUrl + '/me',
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Modification du profil
modifierProfil(data: any): Observable<any> {
return this.http.patch(
this.apiUrl + '/me',
data,
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Changement du mot de passe
changerMotDePasse(data: any): Observable<any> {
return this.http.patch(
this.apiUrl + '/me/password',
data,
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Récupération des adresses du client
getAdresses(): Observable<any> {
return this.http.get(
this.apiUrl + '/me/addresses',
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Ajout d'une adresse
ajouterAdresse(data: any): Observable<any> {
return this.http.post(
this.apiUrl + '/me/addresses',
data,
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Modification d'une adresse
modifierAdresse(id: string, data: any): Observable<any> {
return this.http.patch(
this.apiUrl + '/me/addresses/' + encodeURIComponent(id),
data,
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Suppression d'une adresse
supprimerAdresse(id: string): Observable<any> {
return this.http.delete(
this.apiUrl + '/me/addresses/' + encodeURIComponent(id),
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Récupération des consentements
getConsentements(): Observable<any> {
return this.http.get(
this.apiUrl + '/me/consents',
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Modification des consentements
modifierConsentements(consents: any[]): Observable<any> {
return this.http.put(
this.apiUrl + '/me/consents',
{ consents: consents },
{
withCredentials: true,
headers: this.getHeaders()
}
);
}

// Enregistrement local du client connecté
setClientConnecte(client: any): void {
if (client === null || client === undefined) {
this.effacerClientConnecte();
return;
}

if (typeof localStorage !== 'undefined') {
  localStorage.setItem(
    'clientConnecte',
    JSON.stringify(client)
  );
}

this.clientConnecteSubject.next(client);

}

// Récupération du client connecté
getClientConnecte(): any {
return this.clientConnecteSubject.value;
}

// Vérification de la présence d'un token client
estConnecte(): boolean {
return !!this.getAccessToken();
}

// Effacement des informations locales du client
effacerClientConnecte(): void {
if (typeof localStorage !== 'undefined') {
localStorage.removeItem('clientConnecte');
localStorage.removeItem('clientAccessToken');
}

this.clientConnecteSubject.next(null);

}

// Enregistrement du jeton d'accès
setAccessToken(token: string): void {
if (typeof localStorage === 'undefined') {
return;
}

if (token) {
  localStorage.setItem('clientAccessToken', token);
} else {
  localStorage.removeItem('clientAccessToken');
}

}

// Récupération du jeton d'accès
getAccessToken(): string | null {
if (typeof localStorage === 'undefined') {
return null;
}

return localStorage.getItem('clientAccessToken');

}

// Création des en-têtes HTTP
private getHeaders(): HttpHeaders {
const token = this.getAccessToken();

if (!token) {
  return new HttpHeaders();
}

return new HttpHeaders({
  Authorization: 'Bearer ' + token
});

}

// Lecture du client stocké localement
private getClientStocke(): any {
if (typeof localStorage === 'undefined') {
return null;
}

const client = localStorage.getItem('clientConnecte');

if (!client) {
  return null;
}

try {
  return JSON.parse(client);
} catch {
  localStorage.removeItem('clientConnecte');
  return null;
}

}
// Récupération de la liste des clients
listerClients(): Observable<any> {
  return this.http.get<any>(
    this.apiUrl,
    { withCredentials: true }
  );
}
}