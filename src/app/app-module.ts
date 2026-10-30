import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
import { ListCategorieProduit } from './list-categorie-produit/list-categorie-produit';
import { CreateProduit } from './create-produit/create-produit';
import { UpdateProduit } from './update-produit/update-produit';
import { DetailProduit } from './detail-produit/detail-produit';
import { Sidebar } from './sidebar/sidebar';
import { Home } from './home/home';
import { Login } from './login/login';
import { Mfa } from './mfa/mfa';
import { Securite } from './securite/securite';
import { Users } from './users/users';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeComponent } from 'angularx-qrcode';
import { UserDetail } from './user-detail/user-detail';
import { UserCreate } from './user-create/user-create';
import { UserUpdate } from './user-update/user-update';
import { ChangerMotDePasse } from './changer-mot-de-passe/changer-mot-de-passe';
import { Roles } from './roles/roles';
import { RoleDetail } from './role-detail/role-detail';
import { RoleCreate } from './role-create/role-create';
import { RolePermissions } from './role-permissions/role-permissions';
import { RoleUpdate } from './role-update/role-update';
import { Categories } from './categories/categories';
import { CategorieCreate } from './categorie-create/categorie-create';
import { SousCategorieCreate } from './sous-categorie-create/sous-categorie-create';
import { CategorieDetail } from './categorie-detail/categorie-detail';
import { CategorieUpdate } from './categorie-update/categorie-update';
import { SousCategorieDetail } from './sous-categorie-detail/sous-categorie-detail';
import { SousCategorieUpdate } from './sous-categorie-update/sous-categorie-update';
import { Produits } from './produits/produits';
import { ProduitCreate } from './produit-create/produit-create';
import { ProduitDetail } from './produit-detail/produit-detail';
import { ProduitUpdate } from './produit-update/produit-update';
import { BackofficeHeader } from './backoffice-header/backoffice-header';
import { MonProfilBackoffice } from './mon-profil-backoffice/mon-profil-backoffice';
import { ParametresBackoffice } from './parametres-backoffice/parametres-backoffice';
import { Inventory } from './inventory/inventory';
import { InventoryMovements } from './inventory-movements/inventory-movements';
import { MouvementStockCreate } from './mouvement-stock-create/mouvement-stock-create';
import { InventoryAlerts } from './inventory-alerts/inventory-alerts';
import { InventorySlowMoving } from './inventory-slow-moving/inventory-slow-moving';
import { InventoryPhysicalCounts } from './inventory-physical-counts/inventory-physical-counts';
import { InventoryPhysicalCountCreate } from './inventory-physical-count-create/inventory-physical-count-create';
import { PhysicalCountsHistory } from './inventory/physical-counts-history/physical-counts-history';
import { PhysicalCountHistoryDetail } from './inventory/physical-count-history-detail/physical-count-history-detail';
import { ClientHome } from './client-home/client-home';
import { ClientHeader } from './client-header/client-header';
import { ClientFooter } from './client-footer/client-footer';
import { ClientProduitCatalogue } from './client-produit-catalogue/client-produit-catalogue';
import { ClientProduitCard } from './client-produit-card/client-produit-card';
import { ClientProduitFiltres } from './client-produit-filtres/client-produit-filtres';
import { ClientCategories } from './client-categories/client-categories';
import { ClientConnexion } from './client-connexion/client-connexion';
import { ClientInscription } from './client-inscription/client-inscription';
import { ClientProfil } from './client-profil/client-profil';
import { ClientProduitDetail } from './client-produit-detail/client-produit-detail';
import { ClientProfilUpdatebyclient } from './client-profil-updatebyclient/client-profil-updatebyclient';
import { ClientAdresses } from './client-adresses/client-adresses';
import { ClientAdresseCreate } from './client-adresse-create/client-adresse-create';
import { ClientSecurite } from './client-securite/client-securite';
import { ClientConsentements } from './client-consentements/client-consentements';
import { ClientCompte } from './client-compte/client-compte';
import { AdminClient } from './admin-client/admin-client';
import { AdminClientDetail } from './admin-client-detail/admin-client-detail';
import { AdminClientUpdate } from './admin-client-update/admin-client-update';
import { ClientPanierMak } from './client-panier-mak/client-panier-mak';
import { ClientPanierArticleActions } from './client-panier-article-actions/client-panier-article-actions';
import { ClientPanierProduitMakActions } from './client-panier-produit-mak-actions/client-panier-produit-mak-actions';
import { ClientPanierTiroir } from './client-panier-tiroir/client-panier-tiroir';
import { CommandesRecuMak } from './commandes-recu-mak/commandes-recu-mak';
import { ClientCommandeMak } from './client-commande-mak/client-commande-mak';
import { ClientPasserCommande } from './client-passer-commande/client-passer-commande';
import { CommandesRecuDetail } from './commandes-recu-detail/commandes-recu-detail';
import { CommandesRecuMakDetail } from './commandes-recu-mak-detail/commandes-recu-mak-detail';
import { CommandesRecuMakDetailUpdateStatut } from './commandes-recu-mak-detail-update-statut/commandes-recu-mak-detail-update-statut';
import { ClientPasserCommandesDetail } from './client-passer-commandes-detail/client-passer-commandes-detail';
import { AdminDashboardMak } from './admin-dashboard-mak/admin-dashboard-mak';
import { RapportsMak } from './rapports-mak/rapports-mak';
import { AdminRapportsMak } from './admin-rapports-mak/admin-rapports-mak';
import { AdminAuditMak } from './admin-audit-mak/admin-audit-mak';
import { AdminNotifications } from './admin-notifications/admin-notifications';
import { AdminDashboardGeneral } from './admin-dashboard-general/admin-dashboard-general';

import {
  ClientProduitFiltresCouleurComponent
} from './client-produit-filtres-couleur/client-produit-filtres-couleur';
@NgModule({
  declarations: [
    App,
    ListCategorieProduit,
    CreateProduit,
    UpdateProduit,
    DetailProduit,
    Sidebar,
    Home,

    Login,
    Mfa,
    Securite,
    Users,
    UserDetail,
    UserCreate,
    UserUpdate,
    ChangerMotDePasse,
    Roles,
    RoleDetail,
    RoleCreate,
    RolePermissions,
    RoleUpdate,
    Categories,
    CategorieCreate,
    SousCategorieCreate,
    CategorieDetail,
    CategorieUpdate,
    SousCategorieDetail,
    SousCategorieUpdate,
    Produits,
    ProduitCreate,
    ProduitDetail,
    ProduitUpdate,
    BackofficeHeader,
    MonProfilBackoffice,
    ParametresBackoffice,
    Inventory,
    InventoryMovements,
    MouvementStockCreate,
    InventoryAlerts,
    InventorySlowMoving,
    InventoryPhysicalCounts,
    InventoryPhysicalCountCreate,
    PhysicalCountsHistory,
    PhysicalCountHistoryDetail,
    ClientHome,
    ClientHeader,
    ClientFooter,
    ClientProduitCatalogue,
    ClientProduitCard,
    ClientProduitFiltres,
    ClientCategories,
    ClientConnexion,
    ClientInscription,
    ClientProfil,
    ClientProduitDetail,
    ClientProfilUpdatebyclient,
    ClientAdresses,
    ClientAdresseCreate,
    ClientSecurite,
    ClientConsentements,
    ClientCompte,
    AdminClient,
    AdminClientDetail,
    AdminClientUpdate,
    ClientPanierMak,
    ClientPanierArticleActions,
    ClientPanierProduitMakActions,
    ClientPanierTiroir,
    CommandesRecuMak,
    ClientCommandeMak,
    ClientPasserCommande,
    CommandesRecuDetail,
    CommandesRecuMakDetail,
    CommandesRecuMakDetailUpdateStatut,
    ClientPasserCommandesDetail,
    AdminDashboardMak,
    RapportsMak,
    AdminRapportsMak,
    AdminAuditMak,
    AdminNotifications,
    AdminDashboardGeneral,
    ClientProduitFiltresCouleurComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    MatSnackBarModule,
    MatSnackBarModule,
    MatIconModule,
    QRCodeComponent,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
