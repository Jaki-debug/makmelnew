import {
ChangeDetectorRef,
Component,
OnInit
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { CommandesService } from '../services/commandes';
import { PaiementsService } from '../services/paiements';

@Component({
selector: 'app-commandes-recu-mak-detail',
standalone: false,
templateUrl: './commandes-recu-mak-detail.html',
styleUrl: './commandes-recu-mak-detail.css'
})
export class CommandesRecuMakDetail implements OnInit {

commandeId: string | number = '';
commande: any = null;
paiementCommande: any = null;

chargement = false;
erreur = '';

chargementStatut = false;
erreurStatut = '';
succesStatut = '';

nouveauStatut = '';

chargementPaiement = false;
chargementStatutPaiement = false;
erreurStatutPaiement = '';
succesStatutPaiement = '';
referencePaiement = '';

// État visuel du bouton de copie
copieReussie = false;

private temporisateurCopie: ReturnType<typeof setTimeout> | null = null;

readonly statutsDisponibles = [
{ valeur: 'PENDING', libelle: 'En attente' },
{ valeur: 'CONFIRMED', libelle: 'Confirmée' },
{ valeur: 'PROCESSING', libelle: 'En préparation' },
{ valeur: 'READY_FOR_PICKUP', libelle: 'Prête à retirer' },
{ valeur: 'OUT_FOR_DELIVERY', libelle: 'En cours de livraison' },
{ valeur: 'DELIVERED', libelle: 'Livrée' },
{ valeur: 'COMPLETED', libelle: 'Terminée' },
{ valeur: 'CANCELLED', libelle: 'Annulée' },
{ valeur: 'REFUNDED', libelle: 'Remboursée' }
];

constructor(
private route: ActivatedRoute,
private commandesService: CommandesService,
private paiementsService: PaiementsService,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.route.paramMap.subscribe(params => {
const id = params.get('id');

  if (!id) {
    this.erreur = 'Identifiant de commande introuvable.';
    this.cdr.detectChanges();
    return;
  }

  this.commandeId = id;
  this.chargerDetail();
});

}

// ==========================================
// CHARGER LE DÉTAIL DE LA COMMANDE
// ==========================================

chargerDetail(): void {
if (!this.commandeId) {
this.erreur = 'Identifiant de commande invalide.';
this.cdr.detectChanges();
return;
}

this.chargement = true;
this.erreur = '';
this.erreurStatut = '';
this.succesStatut = '';
this.erreurStatutPaiement = '';
this.succesStatutPaiement = '';

this.cdr.detectChanges();

this.commandesService.detail(String(this.commandeId)).subscribe({
  next: (reponse: any) => {
    const donnees =
      reponse?.data?.order ??
      reponse?.data?.commande ??
      reponse?.data ??
      reponse?.order ??
      reponse?.commande ??
      reponse;

    if (!donnees || typeof donnees !== 'object') {
      this.commande = null;
      this.erreur = 'Aucune information trouvée pour cette commande.';
      this.chargement = false;
      this.cdr.detectChanges();
      return;
    }

    this.commande = donnees;

    this.nouveauStatut = String(
      donnees?.status ??
      donnees?.statut ??
      'PENDING'
    ).toUpperCase();

    this.paiementCommande =
      donnees?.payment ??
      donnees?.paiement ??
      (Array.isArray(donnees?.payments)
        ? donnees.payments[0]
        : null) ??
      (Array.isArray(donnees?.paiements)
        ? donnees.paiements[0]
        : null);

    this.chargement = false;
    this.cdr.detectChanges();

    this.chargerPaiement();
  },

  error: (error: any) => {
    console.error(
      'Erreur lors du chargement de la commande :',
      error
    );

    this.erreur =
      error?.error?.error?.message ??
      error?.error?.message ??
      'Impossible de charger le détail de cette commande.';

    this.chargement = false;
    this.cdr.detectChanges();
  }
});

}

// ==========================================
// MODIFIER LE STATUT DE LA COMMANDE
// ==========================================

changerStatut(): void {
this.erreurStatut = '';
this.succesStatut = '';

if (!this.commandeId || !this.commande) {
  this.erreurStatut = 'Impossible d’identifier la commande.';
  this.cdr.detectChanges();
  return;
}

const statutSelectionne = String(this.nouveauStatut).toUpperCase();
const statutActuel = this.statutActuel;

if (!statutSelectionne) {
  this.erreurStatut = 'Veuillez sélectionner un statut.';
  this.cdr.detectChanges();
  return;
}

const statutAutorise = this.statutsDisponibles.some(
  item => item.valeur === statutSelectionne
);

if (!statutAutorise) {
  this.erreurStatut = 'Le statut sélectionné est invalide.';
  this.cdr.detectChanges();
  return;
}

if (statutSelectionne === statutActuel) {
  this.erreurStatut = 'Veuillez sélectionner un statut différent.';
  this.cdr.detectChanges();
  return;
}

this.chargementStatut = true;
this.cdr.detectChanges();

this.commandesService
  .changerStatut(String(this.commandeId), statutSelectionne)
  .subscribe({
    next: (reponse: any) => {
      const donnees =
        reponse?.data?.order ??
        reponse?.data?.commande ??
        reponse?.data ??
        reponse?.order ??
        reponse?.commande ??
        reponse;

      const statutEnregistre = String(
        donnees?.status ??
        donnees?.statut ??
        statutSelectionne
      ).toUpperCase();

      this.commande = {
        ...this.commande,
        ...(donnees && typeof donnees === 'object' ? donnees : {}),
        status: statutEnregistre
      };

      this.nouveauStatut = statutEnregistre;
      this.succesStatut =
        'Le statut de la commande a été enregistré avec succès.';

      this.erreurStatut = '';
      this.chargementStatut = false;
      this.cdr.detectChanges();
    },

    error: (error: any) => {
      console.error(
        'Erreur lors de la modification du statut :',
        error
      );

      this.erreurStatut =
        this.extraireMessageErreur(error) ||
        'Impossible de modifier le statut. Vérifiez les transitions autorisées par l’API.';

      this.succesStatut = '';
      this.chargementStatut = false;
      this.nouveauStatut = statutActuel;
      this.cdr.detectChanges();
    }
  });

}

// ==========================================
// CHARGER LE PAIEMENT ASSOCIÉ
// ==========================================

chargerPaiement(): void {
if (!this.commandeId) {
return;
}

this.chargementPaiement = true;
this.erreurStatutPaiement = '';
this.cdr.detectChanges();

this.paiementsService
  .listerParCommande(String(this.commandeId))
  .subscribe({
    next: (reponse: any) => {
      const paiements = this.extrairePaiements(reponse);

      const paiementTrouve = paiements.find((paiement: any) => {
        const idCommande =
          paiement?.orderId ??
          paiement?.order_id ??
          paiement?.order?.id ??
          paiement?.commandeId ??
          paiement?.commande_id;

        return idCommande != null &&
          String(idCommande) === String(this.commandeId);
      });

      this.paiementCommande =
        paiementTrouve ??
        (paiements.length === 1 ? paiements[0] : null) ??
        this.paiementCommande ??
        null;

      if (!this.paiementId) {
        this.erreurStatutPaiement =
          'Aucun identifiant de paiement disponible pour cette commande.';
      }

      this.chargementPaiement = false;
      this.cdr.detectChanges();
    },

    error: (error: any) => {
      console.error(
        'Erreur lors du chargement du paiement :',
        error
      );

      this.erreurStatutPaiement =
        error?.error?.error?.message ??
        error?.error?.message ??
        'Impossible de récupérer le paiement associé à cette commande.';

      this.chargementPaiement = false;
      this.cdr.detectChanges();
    }
  });

}

private extrairePaiements(reponse: any): any[] {
if (Array.isArray(reponse)) {
return reponse;
}

const candidats = [
  reponse?.data?.items,
  reponse?.data?.results,
  reponse?.data?.payments,
  reponse?.data?.rows,
  reponse?.items,
  reponse?.results,
  reponse?.payments,
  reponse?.rows,
  reponse?.data
];

const liste = candidats.find(
  (valeur: any) => Array.isArray(valeur)
);

if (liste) {
  return liste;
}

const paiementUnique =
  reponse?.data?.payment ??
  reponse?.payment;

if (
  paiementUnique &&
  typeof paiementUnique === 'object' &&
  !Array.isArray(paiementUnique)
) {
  return [paiementUnique];
}

return [];

}

// ==========================================
// CONFIRMER UN PAIEMENT REÇU À LA BOUTIQUE
// ==========================================

confirmerPaiementBoutique(): void {
this.erreurStatutPaiement = '';
this.succesStatutPaiement = '';

if (!this.paiementId) {
  this.erreurStatutPaiement = 'Identifiant du paiement introuvable.';
  this.cdr.detectChanges();
  return;
}

if (['SUCCESS', 'SUCCEEDED', 'PAID'].includes(this.statutPaiementActuel)) {
  this.succesStatutPaiement = 'Ce paiement est déjà confirmé.';
  this.cdr.detectChanges();
  return;
}

const reference = this.referencePaiement.trim();

if (!reference) {
  this.erreurStatutPaiement =
    'Veuillez renseigner la référence du reçu ou une référence interne.';
  this.cdr.detectChanges();
  return;
}

const montant = Number(
  this.paiementCommande?.amount ??
  this.paiementCommande?.paidAmount ??
  this.paiementCommande?.paid_amount ??
  this.paiementCommande?.total ??
  this.montantTotal
);

if (!Number.isFinite(montant) || montant <= 0) {
  this.erreurStatutPaiement = 'Le montant du paiement est invalide.';
  this.cdr.detectChanges();
  return;
}

this.chargementStatutPaiement = true;
this.cdr.detectChanges();

this.paiementsService.marquerReussi(
  this.paiementId,
  montant,
  reference
).subscribe({
  next: () => {
    this.paiementCommande = {
      ...this.paiementCommande,
      status: 'SUCCESS',
      paidAmount: montant,
      providerReference: reference
    };

    if (this.statutActuel === 'PENDING') {
      this.commande = {
        ...this.commande,
        status: 'CONFIRMED'
      };

      this.nouveauStatut = 'CONFIRMED';
    }

    this.succesStatutPaiement =
      'Le paiement a été confirmé avec succès.';

    this.erreurStatutPaiement = '';
    this.chargementStatutPaiement = false;
    this.cdr.detectChanges();

    // Actualiser sans effacer immédiatement le message de succès.
    this.chargerDetail();
  },

  error: (error: any) => {
    console.error(
      'Erreur lors de la confirmation du paiement :',
      error
    );

    this.erreurStatutPaiement =
      this.extraireMessageErreur(error) ||
      'Impossible de confirmer le paiement.';

    this.succesStatutPaiement = '';
    this.chargementStatutPaiement = false;
    this.cdr.detectChanges();
  }
});

}

// ==========================================
// COPIER LA RÉFÉRENCE DU PAIEMENT
// ==========================================

async copierPaiementId(): Promise<void> {
const id = this.paiementId;

if (!id) {
  this.erreurStatutPaiement =
    'Aucune référence de paiement à copier.';
  this.cdr.detectChanges();
  return;
}

try {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(id);
  } else {
    // Solution de secours pour certains navigateurs.
    const zoneTexte = document.createElement('textarea');
    zoneTexte.value = id;
    zoneTexte.setAttribute('readonly', '');
    zoneTexte.style.position = 'fixed';
    zoneTexte.style.left = '-9999px';
    zoneTexte.style.top = '0';

    document.body.appendChild(zoneTexte);
    zoneTexte.select();

    const copieEffectuee = document.execCommand('copy');
    document.body.removeChild(zoneTexte);

    if (!copieEffectuee) {
      throw new Error('La copie a échoué.');
    }
  }

  this.copieReussie = true;
  this.erreurStatutPaiement = '';
  this.succesStatutPaiement =
    'La référence du paiement a été copiée.';

  if (this.temporisateurCopie) {
    clearTimeout(this.temporisateurCopie);
  }

  this.cdr.detectChanges();

  this.temporisateurCopie = setTimeout(() => {
    this.copieReussie = false;
    this.temporisateurCopie = null;
    this.cdr.detectChanges();
  }, 2000);

} catch (error: any) {
  console.error(
    'Erreur lors de la copie de la référence :',
    error
  );

  this.copieReussie = false;
  this.erreurStatutPaiement =
    'Impossible de copier automatiquement. Sélectionnez et copiez la référence manuellement.';
  this.cdr.detectChanges();
}

}

// ==========================================
// IDENTIFIANT DU PAIEMENT
// ==========================================

get paiementId(): string {
return String(
this.paiementCommande?.id ??
this.paiementCommande?.paymentId ??
this.paiementCommande?.payment_id ??
this.commande?.paymentId ??
this.commande?.payment_id ??
this.commande?.payment?.id ??
this.commande?.paiement?.id ??
''
);
}

// ==========================================
// STATUT DE LA COMMANDE
// ==========================================

get statutActuel(): string {
return String(
this.commande?.status ??
this.commande?.statut ??
'PENDING'
).toUpperCase();
}

get statut(): string {
const libelles: Record<string, string> = {
PENDING: 'En attente',
CONFIRMED: 'Confirmée',
PROCESSING: 'En préparation',
READY_FOR_PICKUP: 'Prête à retirer',
OUT_FOR_DELIVERY: 'En cours de livraison',
DELIVERED: 'Livrée',
COMPLETED: 'Terminée',
CANCELLED: 'Annulée',
REFUNDED: 'Remboursée'
};

return libelles[this.statutActuel] ?? this.statutActuel;

}

get classeStatut(): string {
return 'status-' + this.statutActuel
.toLowerCase()
.replace(/_/g, '-');
}

// ==========================================
// STATUT DU PAIEMENT
// ==========================================

get statutPaiementActuel(): string {
return String(
this.paiementCommande?.status ??
this.paiementCommande?.paymentStatus ??
this.paiementCommande?.payment_status ??
this.paiementCommande?.statut ??
this.commande?.paymentStatus ??
this.commande?.payment_status ??
this.commande?.payment?.status ??
this.commande?.paiement?.statut ??
''
).toUpperCase();
}

get statutPaiement(): string {
const libelles: Record<string, string> = {
PENDING: 'En attente',
PROCESSING: 'En cours',
SUCCESS: 'Payé',
SUCCEEDED: 'Payé',
PAID: 'Payé',
FAILED: 'Échec du paiement',
CANCELLED: 'Paiement annulé',
PARTIALLY_REFUNDED: 'Partiellement remboursé',
REFUNDED: 'Remboursé'
};

return libelles[this.statutPaiementActuel] ??
  (this.statutPaiementActuel || 'Non renseigné');

}

// ==========================================
// MOYEN DE PAIEMENT
// ==========================================

get paiement(): string {
const methode = String(
this.paiementCommande?.method ??
this.paiementCommande?.paymentMethod ??
this.paiementCommande?.payment_method ??
this.commande?.paymentMethod ??
this.commande?.payment_method ??
this.commande?.methodePaiement ??
this.commande?.modePaiement ??
this.commande?.payment?.method ??
this.commande?.paiement?.methode ??
''
).toUpperCase();

const reception = String(
  this.commande?.fulfillmentType ??
  this.commande?.fulfillment_type ??
  this.commande?.typeReception ??
  ''
).toUpperCase();

if (methode === 'CASH_ON_DELIVERY') {
  if (['PICKUP', 'STORE_PICKUP', 'RETRAIT', 'RETRAIT_BOUTIQUE'].includes(reception)) {
    return 'Paiement à la boutique';
  }

  if (['DELIVERY', 'HOME_DELIVERY', 'LIVRAISON'].includes(reception)) {
    return 'Paiement à la livraison';
  }

  return 'Paiement à la livraison ou au retrait';
}

const libelles: Record<string, string> = {
  CASH: 'Paiement en espèces',
  ESPECES: 'Paiement en espèces',
  MOBILE_MONEY: 'Mobile Money',
  MOOV_MONEY: 'Moov Money',
  MIXX: 'Mixx by Yas',
  MIXX_BY_YAS: 'Mixx by Yas',
  TMONEY: 'T-Money',
  FLOOZ: 'Flooz',
  CARD: 'Carte bancaire',
  CREDIT_CARD: 'Carte bancaire',
  FEDAPAY: 'FedaPay',
  FEDA_PAY: 'FedaPay',
  BANK_TRANSFER: 'Virement bancaire'
};

if (!methode && reception === 'PICKUP') {
  return 'Paiement à la boutique';
}

return methode ? libelles[methode] ?? methode : 'Non renseigné';

}

// ==========================================
// INFORMATIONS DU CLIENT
// ==========================================

get donneesClient(): any {
return (
this.commande?.customer ??
this.commande?.client ??
this.commande?.user ??
this.commande?.customerDetails ??
this.commande?.customer_details ??
this.commande?.clientDetails ??
this.commande?.client_details ??
this.commande?.order?.customer ??
this.commande?.order?.client ??
{}
);
}

get prenomClient(): string {
const valeur =
this.commande?.customerFirstName ??
this.commande?.customer_first_name ??
this.commande?.firstName ??
this.commande?.first_name ??
this.commande?.prenom ??
this.donneesClient?.firstName ??
this.donneesClient?.first_name ??
this.donneesClient?.prenom ??
'';

return String(valeur).trim() || 'Non renseigné';

}

get nomFamilleClient(): string {
const valeur =
this.commande?.customerLastName ??
this.commande?.customer_last_name ??
this.commande?.lastName ??
this.commande?.last_name ??
this.commande?.nom ??
this.donneesClient?.lastName ??
this.donneesClient?.last_name ??
this.donneesClient?.nom ??
'';

return String(valeur).trim() || 'Non renseigné';

}

get nomClient(): string {
const prenom =
this.prenomClient === 'Non renseigné' ? '' : this.prenomClient;

const nom =
  this.nomFamilleClient === 'Non renseigné' ? '' : this.nomFamilleClient;

const nomComplet = `${prenom} ${nom}`.trim();

const valeur =
  this.commande?.customerName ??
  this.commande?.customer_name ??
  this.commande?.nomClient ??
  this.commande?.clientNom ??
  this.donneesClient?.fullName ??
  this.donneesClient?.full_name ??
  this.donneesClient?.name ??
  '';

return typeof valeur === 'string' && valeur.trim()
  ? valeur.trim()
  : nomComplet || 'Non renseigné';

}

get telephone(): string {
const valeur =
this.commande?.customerPhone ??
this.commande?.customer_phone ??
this.commande?.telephoneClient ??
this.commande?.telephone ??
this.donneesClient?.phone ??
this.donneesClient?.telephone ??
this.commande?.phone ??
this.commande?.phoneNumber ??
this.commande?.phone_number ??
'';

return String(valeur).trim() || 'Non renseigné';

}

get email(): string {
const valeur =
this.commande?.customerEmail ??
this.commande?.customer_email ??
this.commande?.emailClient ??
this.commande?.email ??
this.donneesClient?.email ??
this.commande?.user?.email ??
'';

return String(valeur).trim() || 'Non renseigné';

}

// ==========================================
// INFORMATIONS GÉNÉRALES
// ==========================================

get reference(): string {
return String(
this.commande?.reference ??
this.commande?.orderNumber ??
this.commande?.order_number ??
this.commande?.numeroCommande ??
this.commande?.numero ??
this.commande?.id ??
'Non renseignée'
);
}

get montantTotal(): number {
return Number(
this.commande?.totalAmount ??
this.commande?.total_amount ??
this.commande?.total ??
this.commande?.montantTotal ??
this.commande?.montant ??
this.commande?.amount ??
0
);
}

get dateCommande(): string | null {
return (
this.commande?.createdAt ??
this.commande?.created_at ??
this.commande?.orderDate ??
this.commande?.order_date ??
this.commande?.dateCommande ??
this.commande?.dateCreation ??
null
);
}

get articles(): any[] {
const liste =
this.commande?.items ??
this.commande?.orderItems ??
this.commande?.order_items ??
this.commande?.articles ??
this.commande?.lignesCommande ??
this.commande?.details ??
this.commande?.produits ??
this.commande?.products ??
[];

return Array.isArray(liste) ? liste : [];

}

get typeReception(): string {
const type = String(
this.commande?.fulfillmentType ??
this.commande?.fulfillment_type ??
this.commande?.typeReception ??
this.commande?.typeLivraison ??
this.commande?.modeReception ??
this.commande?.livraison?.type ??
''
).toUpperCase();

const libelles: Record<string, string> = {
  DELIVERY: 'Livraison à domicile',
  LIVRAISON: 'Livraison à domicile',
  HOME_DELIVERY: 'Livraison à domicile',
  PICKUP: 'Retrait en boutique',
  STORE_PICKUP: 'Retrait en boutique',
  RETRAIT: 'Retrait en boutique',
  RETRAIT_BOUTIQUE: 'Retrait en boutique'
};

return libelles[type] ?? (type || 'Non renseigné');

}

get adresseLivraison(): string {
const adresse =
this.commande?.address ??
this.commande?.deliveryAddress ??
this.commande?.delivery_address ??
this.commande?.shippingAddress ??
this.commande?.shipping_address ??
this.commande?.adresseLivraison ??
this.commande?.adresse ??
this.commande?.livraison?.adresse;

if (typeof adresse === 'string') {
  return adresse.trim() || 'Non renseignée';
}

if (adresse && typeof adresse === 'object') {
  return [
    adresse?.addressLine1 ?? adresse?.address_line1,
    adresse?.addressLine2 ?? adresse?.address_line2,
    adresse?.city ?? adresse?.ville,
    adresse?.region,
    adresse?.countryCode ?? adresse?.country
  ].filter(Boolean).join(', ') || 'Non renseignée';
}

return 'Non renseignée';

}

// ==========================================
// ARTICLES
// ==========================================

nomArticle(article: any): string {
return (
article?.product?.name ??
article?.productName ??
article?.product_name ??
article?.produit?.nom ??
article?.produit?.nomProduit ??
article?.nomProduit ??
article?.nomArticle ??
article?.nom ??
article?.name ??
article?.title ??
article?.libelle ??
'Produit sans nom'
);
}

quantite(article: any): number {
return Number(
article?.quantity ??
article?.quantite ??
article?.qte ??
article?.qty ??
0
);
}

prixUnitaire(article: any): number {
return Number(
article?.unitPrice ??
article?.unit_price ??
article?.price ??
article?.prixUnitaire ??
article?.prix ??
article?.produit?.prix ??
article?.product?.price ??
0
);
}

sousTotal(article: any): number {
const total =
article?.subtotal ??
article?.subTotal ??
article?.sousTotal ??
article?.sous_total ??
article?.totalLigne ??
article?.total;

if (total !== undefined && total !== null) {
  return Number(total);
}

return this.quantite(article) * this.prixUnitaire(article);

}

// ==========================================
// EXTRAIRE LE MESSAGE D'ERREUR
// ==========================================

private extraireMessageErreur(error: any): string {
const corps = error?.error?.error ?? error?.error ?? error;
const message = corps?.message;

if (Array.isArray(message)) {
  return message.join(' | ');
}

if (typeof message === 'string') {
  return message;
}

const details = corps?.details;

if (Array.isArray(details) && details.length > 0) {
  return details
    .map((detail: any) =>
      typeof detail === 'string'
        ? detail
        : detail?.message ?? JSON.stringify(detail)
    )
    .join(' | ');
}

return '';

}

// ==========================================
// RETOUR À LA LISTE DES COMMANDES
// ==========================================

retournerListe(): void {
// Navigation non implémentée ici.
}
}