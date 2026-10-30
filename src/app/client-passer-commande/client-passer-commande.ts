
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  ClientPasserCommandes,
  NouvelleCommande
} from '../services/client-passer-commandes';

import { ClientAuthService } from '../services/client-auth';

@Component({
  selector: 'app-client-passer-commande',
  standalone: false,
  templateUrl: './client-passer-commande.html',
  styleUrl: './client-passer-commande.css'
})
export class ClientPasserCommande implements OnInit, OnDestroy {

  chargement = false;
  chargementProfil = false;

  erreur = '';
  messageSucces = '';
  numeroCommande = '';

  modeLivraison: 'PICKUP' = 'PICKUP';

  private redirectionTimer: ReturnType<typeof setTimeout> | null = null;

  formulaire = {
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    complementAdresse: '',
    ville: 'Lomé',
    region: '',
    methodePaiement: 'CASH_ON_DELIVERY',
    notes: ''
  };

  constructor(
    private commandesService: ClientPasserCommandes,
    private authService: ClientAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerProfilClient();
  }

  // ==========================================
  // CHARGER LE PROFIL CLIENT
  // ==========================================

  chargerProfilClient(): void {
    this.chargementProfil = true;
    this.erreur = '';

    const clientLocal = this.extraireObjet(
      this.authService.getClientConnecte(),
      ['data', 'customer', 'client', 'user']
    );

    if (clientLocal) {
      this.preRemplirProfil(clientLocal);
    }

    this.cdr.detectChanges();

    this.authService.getProfil()
      .pipe(
        catchError((err: any) => {
          console.error(
            'Erreur de récupération du profil :',
            err?.status,
            err?.error
          );

          return of(null);
        })
      )
      .subscribe((reponse: any) => {
        const profil = this.extraireObjet(
          reponse,
          ['data', 'customer', 'client', 'user']
        );

        if (profil && typeof profil === 'object') {
          this.preRemplirProfil(profil);
          this.authService.setClientConnecte(profil);
        }

        this.cdr.detectChanges();
      });

    this.authService.getAdresses()
      .pipe(
        catchError((err: any) => {
          console.error(
            'Erreur de récupération des adresses :',
            err?.status,
            err?.error
          );

          return of(null);
        })
      )
      .subscribe(() => {
        this.chargementProfil = false;
        this.cdr.detectChanges();
      });
  }

  // ==========================================
  // PRÉREMPLIR LE PROFIL CLIENT
  // ==========================================

  private preRemplirProfil(profil: any): void {
    if (!profil) {
      return;
    }

    const prenom =
      profil.firstName ??
      profil.first_name ??
      profil.firstname ??
      profil.prenom ??
      profil.givenName ??
      profil.given_name ??
      '';

    const nom =
      profil.lastName ??
      profil.last_name ??
      profil.lastname ??
      profil.nom ??
      profil.familyName ??
      profil.family_name ??
      '';

    const telephone =
      profil.phone ??
      profil.phoneNumber ??
      profil.phone_number ??
      profil.telephone ??
      profil.mobile ??
      '';

    const email =
      profil.email ??
      profil.emailAddress ??
      profil.email_address ??
      '';

    this.formulaire = {
      ...this.formulaire,
      prenom: this.formulaire.prenom || String(prenom),
      nom: this.formulaire.nom || String(nom),
      telephone: this.formulaire.telephone || String(telephone),
      email: this.formulaire.email || String(email)
    };
  }

  // ==========================================
  // EXTRAIRE UN OBJET DU PROFIL
  // ==========================================

  private extraireObjet(
    reponse: any,
    cles: string[]
  ): any {
    let valeur = reponse;

    for (let i = 0; i < 5; i++) {
      if (!valeur || typeof valeur !== 'object') {
        return null;
      }

      if (
        valeur.firstName !== undefined ||
        valeur.first_name !== undefined ||
        valeur.firstname !== undefined ||
        valeur.prenom !== undefined ||
        valeur.lastName !== undefined ||
        valeur.last_name !== undefined ||
        valeur.nom !== undefined ||
        valeur.email !== undefined ||
        valeur.phone !== undefined ||
        valeur.telephone !== undefined
      ) {
        return valeur;
      }

      let trouve = false;

      for (const cle of cles) {
        if (
          valeur[cle] &&
          typeof valeur[cle] === 'object' &&
          !Array.isArray(valeur[cle])
        ) {
          valeur = valeur[cle];
          trouve = true;
          break;
        }
      }

      if (!trouve) {
        return valeur;
      }
    }

    return valeur;
  }

  // ==========================================
  // CHOISIR LE MODE DE RÉCEPTION
  // ==========================================

  choisirMode(): void {
    this.modeLivraison = 'PICKUP';
    this.erreur = '';
    this.messageSucces = '';

    this.cdr.detectChanges();
  }

  // ==========================================
  // EXTRAIRE LA COMMANDE DE LA RÉPONSE API
  // ==========================================

  private extraireCommandeReponse(reponse: any): any {
    const candidats = [
      reponse?.data?.order,
      reponse?.data?.commande,
      reponse?.order,
      reponse?.commande,
      reponse?.data
    ];

    return candidats.find(
      (valeur: any) =>
        valeur &&
        typeof valeur === 'object' &&
        !Array.isArray(valeur)
    ) ?? reponse;
  }

  // ==========================================
  // EXTRAIRE LE NUMÉRO PUBLIC DE COMMANDE
  // NE PAS UTILISER L'UUID COMME RÉFÉRENCE
  // ==========================================

  private extraireNumeroPublicCommande(
    reponse: any,
    commandeRecue: any
  ): string | null {
    const candidats = [
      commandeRecue?.orderNumber,
      commandeRecue?.order_number,
      commandeRecue?.numeroCommande,
      commandeRecue?.numero_commande,
      commandeRecue?.orderReference,
      commandeRecue?.order_reference,
      commandeRecue?.reference,
      commandeRecue?.orderCode,
      commandeRecue?.order_code,

      reponse?.data?.order?.orderNumber,
      reponse?.data?.order?.order_number,
      reponse?.data?.order?.numeroCommande,
      reponse?.data?.order?.numero_commande,
      reponse?.data?.order?.reference,

      reponse?.data?.commande?.orderNumber,
      reponse?.data?.commande?.order_number,
      reponse?.data?.commande?.numeroCommande,
      reponse?.data?.commande?.numero_commande,
      reponse?.data?.commande?.reference,

      reponse?.data?.orderNumber,
      reponse?.data?.order_number,
      reponse?.data?.numeroCommande,
      reponse?.data?.numero_commande,
      reponse?.data?.orderReference,
      reponse?.data?.order_reference,

      reponse?.order?.orderNumber,
      reponse?.order?.order_number,
      reponse?.order?.reference,

      reponse?.orderNumber,
      reponse?.order_number,
      reponse?.numeroCommande,
      reponse?.numero_commande,
      reponse?.orderReference,
      reponse?.order_reference
    ];

    const valeur = candidats.find(
      (candidat: any) =>
        (
          typeof candidat === 'string' ||
          typeof candidat === 'number'
        ) &&
        String(candidat).trim() !== ''
    );

    if (valeur === undefined || valeur === null) {
      return null;
    }

    // Retire un éventuel # déjà ajouté par le backend.
    const numero = String(valeur)
      .trim()
      .replace(/^#+/, '');

    // Refuse une valeur vide et ne construit jamais un numéro
    // public à partir de l'identifiant technique.
    return numero || null;
  }

  // ==========================================
  // EXTRAIRE LE PAIEMENT DE LA RÉPONSE API
  // ==========================================

  private extrairePaiementReponse(
    reponse: any,
    commandeRecue: any
  ): any | null {
    const candidats = [
      commandeRecue?.payment,
      commandeRecue?.paiement,
      commandeRecue?.payments?.[0],
      commandeRecue?.paiements?.[0],

      reponse?.data?.payment,
      reponse?.data?.paiement,
      reponse?.data?.payments?.[0],
      reponse?.data?.paiements?.[0],

      reponse?.payment,
      reponse?.paiement
    ];

    return candidats.find(
      (valeur: any) =>
        valeur &&
        typeof valeur === 'object' &&
        !Array.isArray(valeur)
    ) ?? null;
  }

  // ==========================================
  // EXTRAIRE L'IDENTIFIANT DU PAIEMENT
  // ==========================================

  private extraireIdentifiantPaiement(
    reponse: any,
    commandeRecue: any,
    paiementRecu: any
  ): string | null {
    const identifiant =
      paiementRecu?.id ??
      paiementRecu?.paymentId ??
      paiementRecu?.payment_id ??

      commandeRecue?.paymentId ??
      commandeRecue?.payment_id ??
      commandeRecue?.paiementId ??
      commandeRecue?.paiement_id ??

      reponse?.data?.paymentId ??
      reponse?.data?.payment_id ??
      reponse?.data?.payment?.id ??
      reponse?.data?.paiement?.id ??

      reponse?.paymentId ??
      reponse?.payment_id ??
      reponse?.payment?.id ??
      reponse?.paiement?.id ??
      null;

    return identifiant !== null && identifiant !== undefined
      ? String(identifiant)
      : null;
  }

  // ==========================================
  // CONSERVER LES INFORMATIONS DE PAIEMENT
  // ==========================================

  private enregistrerPaiementSession(
    idCommande: string,
    methodePaiement: string,
    paiementId: string | null,
    statutPaiement: string | null
  ): void {
    try {
      const cle = `makmel_paiement_commande_${idCommande}`;

      sessionStorage.setItem(
        cle,
        JSON.stringify({
          orderId: idCommande,
          paymentId: paiementId,
          paymentMethod: methodePaiement,
          paymentStatus: statutPaiement,
          savedAt: new Date().toISOString()
        })
      );

      console.log(
        'Informations de paiement conservées pour la commande :',
        idCommande,
        {
          paymentId: paiementId,
          paymentMethod: methodePaiement,
          paymentStatus: statutPaiement
        }
      );

      if (!paiementId) {
        console.warn(
          'Aucun identifiant de paiement reçu dans la réponse de création de commande.'
        );
      }
    } catch (error) {
      console.error(
        'Impossible de conserver les informations de paiement :',
        error
      );
    }
  }

  // ==========================================
  // FINALISER LA CONFIRMATION
  // ==========================================

  private finaliserConfirmationCommande(
    numeroPublic: string | null
  ): void {
    // Important : on n'utilise jamais l'UUID comme numéro public.
    this.numeroCommande = numeroPublic ?? '';

    if (!this.numeroCommande) {
      console.warn(
        'La commande a été créée, mais son numéro public n’a pas été trouvé dans les réponses de l’API.'
      );
    }

    this.chargement = false;

    this.messageSucces =
      'Votre commande a été créée avec succès. Vous pourrez régler à la boutique lors du retrait.';

    this.cdr.detectChanges();

    if (this.redirectionTimer !== null) {
      clearTimeout(this.redirectionTimer);
    }

    this.redirectionTimer = setTimeout(() => {
      this.redirectionTimer = null;
      this.allerAuxCommandes();
    }, 3000);
  }

  // ==========================================
  // CONFIRMER LA COMMANDE
  // ==========================================

  confirmerCommande(): void {
    if (
      this.chargement ||
      this.chargementProfil ||
      this.messageSucces
    ) {
      return;
    }

    this.erreur = '';
    this.messageSucces = '';
    this.numeroCommande = '';

    const nom = this.formulaire.nom.trim();
    const prenom = this.formulaire.prenom.trim();
    const telephone = this.formulaire.telephone.trim();
    const email = this.formulaire.email.trim();
    const notes = this.formulaire.notes.trim();

    // Le seul moyen de paiement actuellement prévu.
    const methodePaiement = 'CASH_ON_DELIVERY';
    this.formulaire.methodePaiement = methodePaiement;

    if (!nom || !prenom || !telephone) {
      this.erreur =
        'Veuillez renseigner votre nom, prénom et téléphone.';

      this.cdr.detectChanges();
      return;
    }

    const commande: NouvelleCommande = {
      fulfillmentType: 'PICKUP',
      paymentMethod: methodePaiement,
      customerFirstName: prenom,
      customerLastName: nom,
      customerPhone: telephone,
      customerEmail: email || undefined,
      notes: notes || undefined
    };

    this.chargement = true;
    this.cdr.detectChanges();

    this.commandesService.passerCommande(commande).subscribe({

      next: (reponse: any) => {
        console.log(
          'Réponse de création de commande :',
          reponse
        );

        if (reponse?.success === false) {
          this.chargement = false;

          this.erreur =
            this.extraireMessageErreur(reponse.error) ||
            'Le serveur a refusé la création de la commande.';

          this.cdr.detectChanges();
          return;
        }

        const commandeRecue =
          this.extraireCommandeReponse(reponse);

        // L'UUID reste utilisé uniquement pour les appels API
        // et pour associer les informations de paiement.
        const idCommande =
          commandeRecue?.id ??
          commandeRecue?.orderId ??
          commandeRecue?.order_id ??
          commandeRecue?.uuid ??
          null;

        if (
          idCommande === null ||
          idCommande === undefined ||
          String(idCommande).trim() === ''
        ) {
          this.chargement = false;

          this.erreur =
            'La commande a été envoyée, mais son identifiant est absent de la réponse du serveur. Vérifiez la réponse avant de réessayer.';

          this.cdr.detectChanges();
          return;
        }

        const idCommandeTexte = String(idCommande);

        const paiementRecu =
          this.extrairePaiementReponse(
            reponse,
            commandeRecue
          );

        const paiementId =
          this.extraireIdentifiantPaiement(
            reponse,
            commandeRecue,
            paiementRecu
          );

        const statutPaiement =
          paiementRecu?.status ??
          paiementRecu?.paymentStatus ??
          paiementRecu?.payment_status ??
          paiementRecu?.statut ??
          null;

        this.enregistrerPaiementSession(
          idCommandeTexte,
          methodePaiement,
          paiementId,
          statutPaiement
            ? String(statutPaiement).toUpperCase()
            : null
        );

        // Première tentative : référence publique dans la réponse
        // de création de commande.
        const numeroPublicInitial =
          this.extraireNumeroPublicCommande(
            reponse,
            commandeRecue
          );

        if (numeroPublicInitial) {
          console.log(
            'Numéro public de commande reçu :',
            numeroPublicInitial
          );

          this.finaliserConfirmationCommande(
            numeroPublicInitial
          );

          return;
        }

        // Deuxième tentative : consulter les détails de la commande
        // avec l'UUID, sans afficher cet UUID au client.
        console.warn(
          'La réponse de création ne contient pas de numéro public. Récupération du détail de la commande...'
        );

        this.commandesService
          .recupererCommande(idCommandeTexte)
          .pipe(
            catchError((erreurHttp: any) => {
              console.error(
                'Impossible de récupérer le numéro public dans le détail de la commande :',
                erreurHttp
              );

              return of(null);
            })
          )
          .subscribe((reponseDetail: any) => {
            const commandeDetail =
              reponseDetail
                ? this.extraireCommandeReponse(reponseDetail)
                : null;

            const numeroPublicDetail =
              this.extraireNumeroPublicCommande(
                reponseDetail,
                commandeDetail
              );

            if (numeroPublicDetail) {
              console.log(
                'Numéro public récupéré depuis le détail :',
                numeroPublicDetail
              );
            }

            this.finaliserConfirmationCommande(
              numeroPublicDetail
            );
          });
      },

      error: (err: any) => {
        this.chargement = false;

        console.error('Statut HTTP :', err?.status);
        console.error(
          'Erreur backend :',
          err?.error
        );

        this.erreur =
          this.extraireMessageErreur(err?.error) ||
          `Impossible de créer la commande (HTTP ${err?.status || 'inconnu'}). Consultez la console du navigateur.`;

        this.cdr.detectChanges();
      }
    });
  }

  // ==========================================
  // REDIRECTION VERS MES COMMANDES
  // ==========================================

  allerAuxCommandes(): void {
    if (this.redirectionTimer !== null) {
      clearTimeout(this.redirectionTimer);
      this.redirectionTimer = null;
    }

    this.router.navigate(['/client/mes-commandes'])
      .then((navigationReussie: boolean) => {
        if (!navigationReussie) {
          console.error(
            'La navigation vers Mes commandes a échoué.'
          );
        }
      })
      .catch((err: any) => {
        console.error(
          'Erreur de navigation vers Mes commandes :',
          err
        );
      });
  }

  // ==========================================
  // EXTRAIRE LE MESSAGE D'ERREUR
  // ==========================================

  private extraireMessageErreur(reponse: any): string {
    if (!reponse) {
      return '';
    }

    const erreur = reponse.error ?? reponse;

    if (Array.isArray(erreur?.details)) {
      return erreur.details
        .map((detail: any) => {
          const chemin = detail.path
            ? `${detail.path} : `
            : '';

          return `${chemin}${detail.message || ''}`;
        })
        .filter(
          (message: string) => message.trim().length > 0
        )
        .join(' | ');
    }

    const message =
      erreur?.message ??
      erreur?.details ??
      erreur?.detail ??
      erreur?.description ??
      reponse?.message;

    if (Array.isArray(message)) {
      return message.join(' | ');
    }

    if (typeof message === 'string') {
      return message;
    }

    if (typeof erreur === 'string') {
      return erreur;
    }

    return '';
  }

  // ==========================================
  // RETOUR AU PANIER
  // ==========================================

  retournerAuPanier(): void {
    this.router.navigate(['/client/panier-mak']);
  }

  // ==========================================
  // NETTOYAGE DU MINUTEUR
  // ==========================================

  ngOnDestroy(): void {
    if (this.redirectionTimer !== null) {
      clearTimeout(this.redirectionTimer);
      this.redirectionTimer = null;
    }
  }
}
