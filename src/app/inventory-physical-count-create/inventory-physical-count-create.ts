import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface InventoryResponse {
success: boolean;
data: any[];
message?: string;
meta?: {
page?: number;
limit?: number;
total?: number;
totalPages?: number;
};
}

interface PhysicalCountResponse {
success: boolean;
data?: any;
message?: string;
}

interface PhysicalCountItem {
variantId: string;
sku: string;
productName: string;
variantLabel: string;
systemQuantity: number;
actualQuantity: number;
}

@Component({
selector: 'app-inventory-physical-count-create',
standalone: false,
templateUrl: './inventory-physical-count-create.html',
styleUrl: './inventory-physical-count-create.css'
})
export class InventoryPhysicalCountCreate implements OnInit {

items: PhysicalCountItem[] = [];

motif = '';

chargement = false;

enregistrement = false;

erreur = '';

messageSucces = '';

constructor(
private http: HttpClient,
private router: Router,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.chargerInventaire();
}

chargerInventaire(): void {

this.chargement = true;

this.erreur = '';

this.messageSucces = '';

this.http
  .get<InventoryResponse>(
    'https://api.commecheznous.fr/api/v1/admin/inventory?page=1&limit=100'
  )
  .subscribe({

    next: (response) => {

      console.log(
        'RÉPONSE INVENTAIRE :',
        response
      );

      if (
        !response ||
        response.success !== true
      ) {

        this.items = [];

        const message =
          response?.message ||
          'Impossible de charger l’inventaire.';

        this.erreur = message;

        this.chargement = false;

        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: message,
          confirmButtonText: 'OK'
        });

        this.cdr.detectChanges();

        return;
      }

      this.items =
        (response.data || [])
          .map((item: any) => ({

            variantId:
              item.variantId ||
              item.id ||
              '',

            sku:
              item.sku ||
              '—',

            productName:
              item.productName ||
              'Produit inconnu',

            variantLabel:
              item.variantLabel ||
              '—',

            systemQuantity:
              Number(
                item.quantity || 0
              ),

            actualQuantity:
              Number(
                item.quantity || 0
              )

          }))
          .filter(
            (item: PhysicalCountItem) =>
              !!item.variantId
          );

      this.chargement = false;

      this.cdr.detectChanges();
    },

    error: (error) => {

      console.error(
        'ERREUR CHARGEMENT INVENTAIRE :',
        error
      );

      this.items = [];

      const message =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible de charger l’inventaire.';

      this.erreur = message;

      this.chargement = false;

      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: message,
        confirmButtonText: 'OK'
      });

      this.cdr.detectChanges();
    }

  });

}

getEcart(
item: PhysicalCountItem
): number {

return (
  Number(item.actualQuantity || 0) -
  Number(item.systemQuantity || 0)
);

}

getEcartClass(
item: PhysicalCountItem
): string {

const ecart =
  this.getEcart(item);

if (ecart > 0) {
  return 'ecart-positif';
}

if (ecart < 0) {
  return 'ecart-negatif';
}

return 'ecart-neutre';

}

modifierQuantite(
item: PhysicalCountItem,
valeur: number
): void {

const quantite =
  Number(valeur);

item.actualQuantity =
  Number.isFinite(quantite) &&
  quantite >= 0
    ? quantite
    : 0;

this.cdr.detectChanges();

}

getNombreEcarts(): number {

return this.items.filter(
  item =>
    this.getEcart(item) !== 0
).length;

}

getTotalQuantiteTheorique(): number {

return this.items.reduce(
  (
    total,
    item
  ) =>
    total +
    Number(
      item.systemQuantity || 0
    ),
  0
);

}

getTotalQuantitePhysique(): number {

return this.items.reduce(
  (
    total,
    item
  ) =>
    total +
    Number(
      item.actualQuantity || 0
    ),
  0
);

}

enregistrer(): void {

this.erreur = '';

this.messageSucces = '';

const reason =
  this.motif.trim();

if (!reason) {

  const message =
    'Veuillez renseigner le motif de l’inventaire physique.';

  this.erreur = message;

  Swal.fire({
    icon: 'warning',
    title: 'Motif requis',
    text: message,
    confirmButtonText: 'OK'
  });

  this.cdr.detectChanges();

  return;
}

if (
  this.items.length === 0
) {

  const message =
    'Aucune variante disponible pour effectuer l’inventaire physique.';

  this.erreur = message;

  Swal.fire({
    icon: 'warning',
    title: 'Aucune donnée',
    text: message,
    confirmButtonText: 'OK'
  });

  this.cdr.detectChanges();

  return;
}

const items =
  this.items.map(
    item => ({

      variantId:
        item.variantId,

      actualQuantity:
        Number(
          item.actualQuantity || 0
        )

    })
  );

const body = {
  reason,
  items
};

this.enregistrement = true;

console.log(
  'ENVOI INVENTAIRE PHYSIQUE :',
  body
);

this.http
  .post<PhysicalCountResponse>(
    'https://api.commecheznous.fr/api/v1/admin/inventory/counts',
    body
  )
  .subscribe({

    next: (response) => {

      console.log(
        'RÉPONSE INVENTAIRE PHYSIQUE :',
        response
      );

      if (
        !response ||
        response.success !== true
      ) {

        this.enregistrement = false;

        this.messageSucces = '';

        const message =
          response?.message ||
          'L’inventaire physique n’a pas pu être enregistré.';

        this.erreur = message;

        Swal.fire({
          icon: 'error',
          title: 'Échec',
          text: message,
          confirmButtonText: 'OK'
        });

        this.cdr.detectChanges();

        return;
      }

      const message =
        response.message ||
        'Inventaire enregistré avec succès.';

      const data =
        response.data || {};

      const inventoryCreated = {

        id:
          data?.id ||
          data?.inventoryId ||
          data?.countId ||
          '',

        reason:
          data?.reason ||
          reason,

        createdAt:
          data?.createdAt ||
          new Date().toISOString(),

        createdBy:
          data?.createdBy ||
          data?.createdByName ||
          'Utilisateur actuel',

        totalItems:
          data?.totalItems ??
          items.length,

        totalDifferences:
          data?.totalDifferences ??
          this.getNombreEcarts()
      };

      console.log(
        'INVENTAIRE CRÉÉ :',
        inventoryCreated
      );

      this.enregistrement = false;

      this.erreur = '';

      this.messageSucces = message;

      this.cdr.detectChanges();

      Swal.fire({
        icon: 'success',
        title: 'Opération réussie',
        text: message,
        confirmButtonText: 'OK'
      }).then(() => {

        this.router.navigate(
          ['/inventory/physical-counts-history'],
          {
            state: {
              inventorySuccess:
                message,
              inventoryCreated:
                inventoryCreated
            }
          }
        );

      });
    },

    error: (error) => {

      console.error(
        'ERREUR INVENTAIRE PHYSIQUE :',
        error
      );

      this.enregistrement = false;

      this.messageSucces = '';

      const message =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible d’enregistrer l’inventaire physique.';

      this.erreur = message;

      Swal.fire({
        icon: 'error',
        title: 'Échec',
        text: message,
        confirmButtonText: 'OK'
      });

      this.cdr.detectChanges();
    }

  });

}

retour(): void {

if (this.enregistrement) {
  return;
}

this.router.navigate([
  '/inventory/physical-counts-history'
]);

}

actualiser(): void {

if (
  this.chargement ||
  this.enregistrement
) {
  return;
}

this.chargerInventaire();

}

}