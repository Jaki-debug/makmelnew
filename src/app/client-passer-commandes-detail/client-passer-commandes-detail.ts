import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ClientPasserCommandes } from '../services/client-passer-commandes';

@Component({
  selector: 'app-client-passer-commandes-detail',
  standalone: false,
  templateUrl: './client-passer-commandes-detail.html',
  styleUrl: './client-passer-commandes-detail.css'
})
export class ClientPasserCommandesDetail implements OnInit {

  commande: any = null;
  paiementDetail: any = null;

  chargement = true;
  chargementPaiement = false;

  erreur = '';
  erreurPaiement = '';

  private readonly apiUrl = 'https://api.commecheznous.fr/api/v1';

  constructor(
    private route: ActivatedRoute,
    private commandesService: ClientPasserCommandes,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.erreur = 'Identifiant de commande introuvable.';
      this.chargement = false;
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.chargerCommande(id);
  }

  // ==========================================
  // RÉCUPÉRER LES INFORMATIONS DE PAIEMENT
  // CONSERVÉES EN SESSION
  // ==========================================

  private recupererPaiementSession(
    idCommande: string
  ): any | null {
    try {
      const cle = `makmel_paiement_commande_${idCommande}`;
      const donnees = sessionStorage.getItem(cle);

      if (!donnees) {
        return null;
      }

      const paiement = JSON.parse(donnees);

      if (String(paiement?.orderId) !== String(idCommande)) {
        return null;
      }

      return paiement;

    } catch (error) {
      console.error(
        'Erreur lors de la récupération du paiement en session :',
        error
      );

      return null;
    }
  }

  // ==========================================
  // EXTRAIRE LE PAIEMENT DE LA RÉPONSE API
  // ==========================================

  private extrairePaiement(
    commande: any,
    reponse?: any
  ): any | null {
    const candidats = [
      commande?.payment,
      commande?.paiement,
      commande?.payments?.[0],
      commande?.paiements?.[0],

      reponse?.data?.order?.payment,
      reponse?.data?.order?.paiement,
      reponse?.data?.order?.payments?.[0],
      reponse?.data?.order?.paiements?.[0],

      reponse?.data?.commande?.payment,
      reponse?.data?.commande?.paiement,
      reponse?.data?.commande?.payments?.[0],
      reponse?.data?.commande?.paiements?.[0],

      reponse?.data?.payment,
      reponse?.data?.paiement,
      reponse?.data?.payments?.[0],
      reponse?.data?.paiements?.[0],

      reponse?.payment,
      reponse?.paiement,
      reponse?.payments?.[0],
      reponse?.paiements?.[0]
    ];

    return candidats.find(
      (valeur: any) =>
        valeur !== null &&
        valeur !== undefined &&
        typeof valeur === 'object' &&
        !Array.isArray(valeur)
    ) ?? null;
  }

  // ==========================================
  // RETROUVER L'IDENTIFIANT DU PAIEMENT
  // ==========================================

  private recupererIdentifiantPaiement(
    commande: any,
    paiementSession: any,
    reponse?: any
  ): string | null {
    const paiementCommande = this.extrairePaiement(
      commande,
      reponse
    );

    const candidats = [
      paiementCommande?.id,
      paiementCommande?.paymentId,
      paiementCommande?.payment_id,
      paiementCommande?.paiementId,
      paiementCommande?.paiement_id,

      commande?.paymentId,
      commande?.payment_id,
      commande?.paiementId,
      commande?.paiement_id,

      commande?.payments?.[0]?.id,
      commande?.payments?.[0]?.paymentId,
      commande?.payments?.[0]?.payment_id,

      commande?.paiements?.[0]?.id,
      commande?.paiements?.[0]?.paymentId,
      commande?.paiements?.[0]?.payment_id,

      reponse?.data?.order?.payment?.id,
      reponse?.data?.order?.paymentId,
      reponse?.data?.order?.payment_id,
      reponse?.data?.order?.paiement?.id,

      reponse?.data?.commande?.payment?.id,
      reponse?.data?.commande?.paymentId,
      reponse?.data?.commande?.payment_id,
      reponse?.data?.commande?.paiement?.id,

      reponse?.data?.payment?.id,
      reponse?.data?.paymentId,
      reponse?.data?.payment_id,
      reponse?.data?.paiement?.id,
      reponse?.data?.paiementId,
      reponse?.data?.paiement_id,

      reponse?.payment?.id,
      reponse?.paymentId,
      reponse?.payment_id,
      reponse?.paiement?.id,
      reponse?.paiementId,
      reponse?.paiement_id,

      paiementSession?.paymentId,
      paiementSession?.payment_id,
      paiementSession?.paiementId,
      paiementSession?.paiement_id,
      paiementSession?.payment?.id,
      paiementSession?.paiement?.id
    ];

    const identifiant = candidats.find(
      (valeur: any) =>
        valeur !== null &&
        valeur !== undefined &&
        String(valeur).trim() !== ''
    );

    return identifiant !== undefined
      ? String(identifiant)
      : null;
  }

  // ==========================================
  // CHARGER LES DÉTAILS DE LA COMMANDE
  // ==========================================

  chargerCommande(id: string): void {
    this.chargement = true;
    this.erreur = '';
    this.erreurPaiement = '';
    this.commande = null;
    this.paiementDetail = null;
    this.chargementPaiement = false;

    this.changeDetectorRef.detectChanges();

    this.commandesService.recupererCommande(id).subscribe({

      next: (response: any) => {
        console.log(
          'RÉPONSE COMPLÈTE DU DÉTAIL DE COMMANDE :',
          response
        );

        const commandeRecue =
          response?.data?.order ??
          response?.data?.commande ??
          response?.order ??
          response?.commande ??
          response?.data ??
          response;

        console.log(
          'COMMANDE EXTRAITE :',
          commandeRecue
        );

        if (
          !commandeRecue ||
          typeof commandeRecue !== 'object' ||
          Array.isArray(commandeRecue)
        ) {
          this.erreur =
            'Les détails de cette commande sont introuvables.';

          this.chargement = false;
          this.changeDetectorRef.detectChanges();
          return;
        }

        const paiementSession =
          this.recupererPaiementSession(id);

        const paiementCommande =
          this.extrairePaiement(commandeRecue, response);

        console.log(
          'PAIEMENT INTÉGRÉ À LA COMMANDE :',
          paiementCommande
        );

        console.log(
          'PAIEMENT CONSERVÉ EN SESSION :',
          paiementSession
        );

        const methodePaiement =
          commandeRecue?.paymentMethod ??
          commandeRecue?.payment_method ??
          commandeRecue?.methodePaiement ??
          commandeRecue?.modePaiement ??
          paiementCommande?.method ??
          paiementCommande?.paymentMethod ??
          paiementCommande?.payment_method ??
          paiementSession?.paymentMethod ??
          null;

        const statutPaiementAPI =
          paiementCommande?.status ??
          paiementCommande?.paymentStatus ??
          paiementCommande?.payment_status ??
          paiementCommande?.statut ??
          commandeRecue?.paymentStatus ??
          commandeRecue?.payment_status ??
          commandeRecue?.statutPaiement ??
          commandeRecue?.statut_paiement ??
          null;

        this.commande = {
          ...commandeRecue,
          paymentMethod: methodePaiement,
          ...(statutPaiementAPI !== null &&
          statutPaiementAPI !== undefined
            ? { paymentStatus: statutPaiementAPI }
            : {})
        };

        this.paiementDetail = paiementCommande;

        const idPaiement =
          this.recupererIdentifiantPaiement(
            commandeRecue,
            paiementSession,
            response
          );

        console.log(
          'IDENTIFIANT DE COMMANDE :',
          id
        );

        console.log(
          'IDENTIFIANT DE PAIEMENT TROUVÉ :',
          idPaiement
        );

        console.log(
          'STATUT DE LA COMMANDE :',
          this.statutCommandeActuel
        );

        console.log(
          'STATUT DE PAIEMENT DISPONIBLE :',
          statutPaiementAPI
        );

        console.log(
          'STATUT AFFICHÉ SUR LE CLIENT :',
          this.statutPaiementActuel
        );

        this.chargement = false;
        this.changeDetectorRef.detectChanges();

        if (idPaiement) {
          this.chargerStatutPaiement(idPaiement);
        } else if (!this.statutPaiementActuel) {
          this.erreurPaiement =
            'Le statut du paiement est indisponible.';

          console.warn(
            'Aucun identifiant ni statut de paiement reçu. Utilisation du statut de la commande comme solution de secours lorsque possible.'
          );

          this.changeDetectorRef.detectChanges();
        }
      },

      error: (error: any) => {
        console.error(
          'Erreur HTTP lors du chargement de la commande :',
          error
        );

        this.commande = null;
        this.paiementDetail = null;

        this.erreur =
          error?.error?.error?.message ??
          error?.error?.message ??
          'Impossible de charger les détails de cette commande.';

        this.chargement = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // ==========================================
  // RÉCUPÉRER LE STATUT DU PAIEMENT DEPUIS L'API
  // ==========================================

  private chargerStatutPaiement(
    idPaiement: string
  ): void {
    this.chargementPaiement = true;
    this.erreurPaiement = '';

    this.changeDetectorRef.detectChanges();

    console.log(
      'RÉCUPÉRATION DU PAIEMENT DEPUIS L’API :',
      idPaiement
    );

    this.http
      .get<any>(
        `${this.apiUrl}/payments/${encodeURIComponent(idPaiement)}`
      )
      .subscribe({

        next: (response: any) => {
          console.log(
            'RÉPONSE DE DÉTAIL DU PAIEMENT :',
            response
          );

          const paiementRecu =
            response?.data?.payment ??
            response?.data?.paiement ??
            response?.data ??
            response?.payment ??
            response?.paiement ??
            response;

          if (
            !paiementRecu ||
            typeof paiementRecu !== 'object' ||
            Array.isArray(paiementRecu)
          ) {
            this.erreurPaiement =
              'L’API n’a pas renvoyé les informations du paiement.';
          } else {
            this.paiementDetail = paiementRecu;

            const methode =
              paiementRecu?.method ??
              paiementRecu?.paymentMethod ??
              paiementRecu?.payment_method;

            if (methode) {
              this.commande = {
                ...this.commande,
                paymentMethod: methode
              };
            }

            console.log(
              'STATUT DU PAIEMENT REÇU :',
              this.statutPaiementActuel
            );
          }

          this.chargementPaiement = false;
          this.changeDetectorRef.detectChanges();
        },

        error: (error: any) => {
          console.error(
            'Erreur lors de la récupération du paiement :',
            error
          );

          this.erreurPaiement =
            error?.error?.error?.message ??
            error?.error?.message ??
            'Impossible de vérifier le statut du paiement.';

          this.chargementPaiement = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  // ==========================================
  // STATUT DE LA COMMANDE
  // ==========================================

  get statutCommandeActuel(): string {
    return String(
      this.commande?.status ??
      this.commande?.statut ??
      ''
    ).trim().toUpperCase();
  }

  // ==========================================
  // STATUT DU PAIEMENT
  // ANCIENNE LOGIQUE DE SECOURS RESTAURÉE
  // ==========================================

  get statutPaiementActuel(): string {
    // Priorité au véritable statut du paiement.
    const statutPaiement = String(
      this.paiementDetail?.status ??
      this.paiementDetail?.paymentStatus ??
      this.paiementDetail?.payment_status ??
      this.paiementDetail?.statut ??
      this.commande?.paymentStatus ??
      this.commande?.payment_status ??
      this.commande?.statutPaiement ??
      this.commande?.statut_paiement ??
      ''
    ).trim().toUpperCase();

    if (statutPaiement) {
      return statutPaiement;
    }

    // Solution de secours : utiliser le statut de la commande
    // lorsque l'API ne fournit pas le statut du paiement.
    const statutCommande = this.statutCommandeActuel;

    if (statutCommande === 'PENDING') {
      return 'PENDING';
    }

    if (
      [
        'CONFIRMED',
        'PROCESSING',
        'READY_FOR_PICKUP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'COMPLETED'
      ].includes(statutCommande)
    ) {
      return 'SUCCESS';
    }

    if (statutCommande === 'REFUNDED') {
      return 'REFUNDED';
    }

    if (statutCommande === 'CANCELLED') {
      return 'CANCELLED';
    }

    return '';
  }

  // ==========================================
  // LIBELLÉ DU STATUT DU PAIEMENT
  // ==========================================

  get statutPaiement(): string {
    const statut = this.statutPaiementActuel;

    const libelles: Record<string, string> = {
      PENDING: 'En attente',
      PROCESSING: 'En cours de traitement',
      SUCCESS: 'Payé',
      SUCCEEDED: 'Payé',
      PAID: 'Payé',
      FAILED: 'Échec du paiement',
      CANCELLED: 'Paiement annulé',
      PARTIALLY_REFUNDED: 'Partiellement remboursé',
      REFUNDED: 'Remboursé'
    };

    if (this.chargementPaiement) {
      return 'Vérification en cours...';
    }

    return statut
      ? libelles[statut] ?? statut
      : 'Statut du paiement indisponible';
  }

  // ==========================================
  // CLASSE CSS DU STATUT DU PAIEMENT
  // ==========================================

  get classeStatutPaiement(): string {
    const statut = this.statutPaiementActuel;

    if (['SUCCESS', 'SUCCEEDED', 'PAID'].includes(statut)) {
      return 'status-success';
    }

    if (['PENDING', 'PROCESSING'].includes(statut)) {
      return 'status-pending';
    }

    if (['FAILED', 'CANCELLED'].includes(statut)) {
      return 'status-failed';
    }

    if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(statut)) {
      return 'status-refunded';
    }

    return 'status-unknown';
  }

  // ==========================================
  // MOYEN DE PAIEMENT
  // ==========================================

  get moyenPaiement(): string {
    const methode = String(
      this.paiementDetail?.method ??
      this.paiementDetail?.paymentMethod ??
      this.paiementDetail?.payment_method ??
      this.commande?.paymentMethod ??
      this.commande?.payment_method ??
      this.commande?.methodePaiement ??
      this.commande?.modePaiement ??
      ''
    ).trim().toUpperCase();

    const typeReception = String(
      this.commande?.fulfillmentType ??
      this.commande?.fulfillment_type ??
      ''
    ).trim().toUpperCase();

    if (methode === 'CASH_ON_DELIVERY') {
      if (
        [
          'PICKUP',
          'STORE_PICKUP',
          'RETRAIT',
          'RETRAIT_BOUTIQUE'
        ].includes(typeReception)
      ) {
        return 'Paiement à la boutique';
      }

      if (
        [
          'DELIVERY',
          'HOME_DELIVERY',
          'LIVRAISON'
        ].includes(typeReception)
      ) {
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

    return methode
      ? libelles[methode] ?? methode
      : 'Non renseigné';
  }

  // Alias pour les templates qui utilisent {{ paiement }}.
  get paiement(): string {
    return this.moyenPaiement;
  }
}