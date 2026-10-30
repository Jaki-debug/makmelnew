
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Login } from './login/login';
import { Mfa } from './mfa/mfa';
import { Securite } from './securite/securite';

import { authGuard } from './guards/auth-guard';
import { permissionGuard } from './guards/permission-guard';

import { adminEntryGuard } from './guards/admin-entry-guard';
import { Users } from './users/users';
import { UserDetail } from './user-detail/user-detail';
import { UserCreate } from './user-create/user-create';
import { UserUpdate } from './user-update/user-update';

import { Roles } from './roles/roles';
import { RoleDetail } from './role-detail/role-detail';
import { RoleCreate } from './role-create/role-create';
import { RoleUpdate } from './role-update/role-update';
import { RolePermissions } from './role-permissions/role-permissions';

import { ChangerMotDePasse } from './changer-mot-de-passe/changer-mot-de-passe';

import { Categories } from './categories/categories';
import { CategorieCreate } from './categorie-create/categorie-create';
import { CategorieDetail } from './categorie-detail/categorie-detail';
import { CategorieUpdate } from './categorie-update/categorie-update';

import { MonProfilBackoffice } from './mon-profil-backoffice/mon-profil-backoffice';
import { ParametresBackoffice } from './parametres-backoffice/parametres-backoffice';
import { SousCategorieCreate } from './sous-categorie-create/sous-categorie-create';
import { SousCategorieUpdate } from './sous-categorie-update/sous-categorie-update';

import { Produits } from './produits/produits';
import { ProduitCreate } from './produit-create/produit-create';
import { ProduitDetail } from './produit-detail/produit-detail';
import { ProduitUpdate } from './produit-update/produit-update';

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
import { ClientProduitCatalogue } from './client-produit-catalogue/client-produit-catalogue';
import { ClientConnexion } from './client-connexion/client-connexion';
import { ClientInscription } from './client-inscription/client-inscription';
import { ClientProfil } from './client-profil/client-profil';
import { ClientProduitDetail } from './client-produit-detail/client-produit-detail';
import { ClientProfilUpdatebyclient } from './client-profil-updatebyclient/client-profil-updatebyclient';
import { ClientAdresses } from './client-adresses/client-adresses';
import { ClientAdresseCreate } from './client-adresse-create/client-adresse-create';
import { ClientCompte } from './client-compte/client-compte';
import { ClientConsentements } from './client-consentements/client-consentements';
import { ClientSecurite } from './client-securite/client-securite';

import { AdminClient } from './admin-client/admin-client';
import { AdminClientDetail } from './admin-client-detail/admin-client-detail';
import { AdminClientUpdate } from './admin-client-update/admin-client-update';

import { ClientPanierMak } from './client-panier-mak/client-panier-mak';
import { ClientCommandeMak } from './client-commande-mak/client-commande-mak';
import { clientAuthGuardGuard } from './guards/client-auth-guard-guard';

import { ClientPasserCommande } from './client-passer-commande/client-passer-commande';
import { ClientPasserCommandesDetail } from './client-passer-commandes-detail/client-passer-commandes-detail';

import { CommandesRecuMak } from './commandes-recu-mak/commandes-recu-mak';
import { CommandesRecuMakDetail } from './commandes-recu-mak-detail/commandes-recu-mak-detail';
import { CommandesRecuMakDetailUpdateStatut } from './commandes-recu-mak-detail-update-statut/commandes-recu-mak-detail-update-statut';

import { AdminDashboardMak } from './admin-dashboard-mak/admin-dashboard-mak';
import { AdminRapportsMak } from './admin-rapports-mak/admin-rapports-mak';
import { AdminAuditMak } from './admin-audit-mak/admin-audit-mak';
import { AdminNotifications } from './admin-notifications/admin-notifications';
import { AdminDashboardGeneral } from './admin-dashboard-general/admin-dashboard-general';

const routes: Routes = [

  // =====================================
  // CONNEXION ADMIN
  // URL : /connexion-admin
  // =====================================

  {
    path: 'connexion-admin',
    component: Login
  },

  // Ancienne adresse de connexion conservée
  {
    path: 'login',
    redirectTo: 'connexion-admin',
    pathMatch: 'full'
  },

  {
    path: 'mfa',
    component: Mfa
  },

  {
    path: 'changer-mot-de-passe',
    component: ChangerMotDePasse
  },

  // =====================================
  // CLIENT
  // =====================================

  {
    path: 'client',
    component: ClientHome,
    pathMatch: 'full'
  },

  // Catalogue public
  {
    path: 'client/produitcatalogue',
    component: ClientProduitCatalogue
  },

  {
    path: 'client/produit/:id',
    component: ClientProduitDetail
  },

  // Panier
  {
    path: 'client/panier-mak',
    component: ClientPanierMak
  },

  // Connexion et inscription client
  {
    path: 'client/connexion',
    component: ClientConnexion
  },

  {
    path: 'client/inscription',
    component: ClientInscription
  },

  // Profil client
  {
    path: 'client/profil',
    component: ClientProfil
  },

  {
    path: 'client/profil/modifier',
    component: ClientProfilUpdatebyclient
  },

  {
    path: 'client/adresses',
    component: ClientAdresses
  },

  {
    path: 'client/adresses/ajouter',
    component: ClientAdresseCreate
  },

  {
    path: 'client/compte',
    component: ClientCompte
  },

  {
    path: 'client/securite',
    component: ClientSecurite
  },

  {
    path: 'client/consentements',
    component: ClientConsentements
  },

  // Passage de commande
  {
    path: 'client/passer-commande',
    component: ClientPasserCommande
  },

  // Commandes du client protégées
  {
    path: 'client/mes-commandes',
    component: ClientCommandeMak,
    canActivate: [clientAuthGuardGuard]
  },

  {
    path: 'client/mes-commandes/:id',
    component: ClientPasserCommandesDetail,
    canActivate: [clientAuthGuardGuard]
  },

  // =====================================
  // GESTION DES CLIENTS PAR L'ADMIN
  // =====================================

  {
    path: 'admin/clients',
    component: AdminClient,
    canActivate: [authGuard]
  },

  {
    path: 'admin/client/:id',
    component: AdminClientDetail,
    canActivate: [authGuard]
  },

  {
    path: 'admin/client/update/:id',
    component: AdminClientUpdate,
    canActivate: [authGuard]
  },

  // =====================================
  // SÉCURITÉ ADMIN
  // =====================================

  {
    path: 'securite',
    component: Securite,
    canActivate: [authGuard]
  },

  // =====================================
  // UTILISATEURS
  // =====================================

  {
    path: 'users/ajouter',
    component: UserCreate,
    canActivate: [
      authGuard,
      permissionGuard('users.create')
    ]
  },

  {
    path: 'users/:id/modifier',
    component: UserUpdate,
    canActivate: [
      authGuard,
      permissionGuard('users.update')
    ]
  },

  {
    path: 'users/:id',
    component: UserDetail,
    canActivate: [
      authGuard,
      permissionGuard('users.read')
    ]
  },

  {
    path: 'users',
    component: Users,
    canActivate: [
      authGuard,
      permissionGuard('users.read')
    ]
  },

  // =====================================
  // RÔLES ET PERMISSIONS
  // =====================================

  {
    path: 'roles/ajouter',
    component: RoleCreate,
    canActivate: [
      authGuard,
      permissionGuard('roles.create')
    ]
  },

  {
    path: 'roles/:id/permissions',
    component: RolePermissions,
    canActivate: [
      authGuard,
      permissionGuard('roles.manage_permissions')
    ]
  },

  {
    path: 'roles/:id/modifier',
    component: RoleUpdate,
    canActivate: [
      authGuard,
      permissionGuard('roles.update')
    ]
  },

  {
    path: 'roles/:id',
    component: RoleDetail,
    canActivate: [
      authGuard,
      permissionGuard('roles.read')
    ]
  },

  {
    path: 'roles',
    component: Roles,
    canActivate: [
      authGuard,
      permissionGuard('roles.read')
    ]
  },

  // =====================================
  // PRODUITS ADMIN
  // =====================================

  {
    path: 'produits/ajouter',
    component: ProduitCreate,
    canActivate: [authGuard]
  },

  {
    path: 'produits/:id/modifier',
    component: ProduitUpdate,
    canActivate: [authGuard]
  },

  {
    path: 'produits/:id',
    component: ProduitDetail,
    canActivate: [authGuard]
  },

  {
    path: 'produits',
    component: Produits,
    canActivate: [authGuard]
  },

  // =====================================
  // PROFIL ET PARAMÈTRES ADMIN
  // =====================================

  {
    path: 'profil',
    component: MonProfilBackoffice,
    canActivate: [authGuard]
  },

  {
    path: 'parametres',
    component: ParametresBackoffice,
    canActivate: [authGuard]
  },

  // =====================================
  // CATÉGORIES
  // =====================================

  {
    path: 'categories/ajouter',
    component: CategorieCreate,
    canActivate: [authGuard]
  },

  {
    path: 'categories/sous-categorie/ajouter',
    component: SousCategorieCreate,
    canActivate: [authGuard]
  },

  {
    path: 'categories/sous-categorie/:id/modifier',
    component: SousCategorieUpdate,
    canActivate: [authGuard]
  },

  {
    path: 'categories/:id/modifier',
    component: CategorieUpdate,
    canActivate: [authGuard]
  },

  {
    path: 'categories/:id',
    component: CategorieDetail,
    canActivate: [authGuard]
  },

  {
    path: 'categories',
    component: Categories,
    canActivate: [authGuard]
  },

  // =====================================
  // INVENTAIRE
  // =====================================

  {
    path: 'inventory/physical-counts/ajouter',
    component: InventoryPhysicalCountCreate,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/physical-counts',
    component: InventoryPhysicalCounts,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/physical-counts-history',
    component: PhysicalCountsHistory,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/physical-counts-history/:id',
    component: PhysicalCountHistoryDetail,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/slow-moving',
    component: InventorySlowMoving,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/alerts',
    component: InventoryAlerts,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/movements/ajouter',
    component: MouvementStockCreate,
    canActivate: [authGuard]
  },

  {
    path: 'inventory/movements',
    component: InventoryMovements,
    canActivate: [authGuard]
  },

  {
    path: 'inventory',
    component: Inventory,
    canActivate: [authGuard]
  },

  // =====================================
  // COMMANDES ADMIN
  // =====================================

  {
    path: 'commandes-recu-mak',
    component: CommandesRecuMak,
    canActivate: [authGuard]
  },

  {
    path: 'commandes-recu-mak/:id',
    component: CommandesRecuMakDetail,
    canActivate: [authGuard]
  },

  {
    path: 'commandes-recu-mak-detail-update-statut',
    component: CommandesRecuMakDetailUpdateStatut,
    canActivate: [authGuard]
  },

  // =====================================
  // ADMIN : POINT D'ENTRÉE
  // /admin vérifie la session
  // =====================================

  {
    path: 'admin',
    component: AdminDashboardMak,
    canActivate: [adminEntryGuard],
    pathMatch: 'full'
  },

  // Tableau de bord Admin protégé
  {
    path: 'admin-dashboard-mak',
    component: AdminDashboardMak,
    canActivate: [authGuard]
  },

  {
    path: 'admin-rapports-mak',
    component: AdminRapportsMak,
    canActivate: [authGuard]
  },

  {
    path: 'admin/audit',
    component: AdminAuditMak,
    canActivate: [authGuard]
  },

  {
    path: 'admin/notifications',
    component: AdminNotifications,
    canActivate: [authGuard]
  },

  {
    path: 'admin/dashboard',
    component: AdminDashboardGeneral,
    canActivate: [authGuard]
  },

  // =====================================
  // PAGE D'ACCUEIL GÉNÉRALE : CATALOGUE
  // =====================================

  {
    path: '',
    redirectTo: 'client/produitcatalogue',
    pathMatch: 'full'
  },

  // URL inconnue : retour au catalogue
  {
    path: '**',
    redirectTo: 'client/produitcatalogue'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
