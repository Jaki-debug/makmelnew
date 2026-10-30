import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

interface PhysicalCountDetailResponse {
success: boolean;
data?: any;
message?: string;
}

interface PhysicalCountDetailItem {
variantId: string;
sku: string;
productName: string;
variantLabel: string;
systemQuantity: number;
actualQuantity: number;
difference: number;
}

@Component({
selector: 'app-physical-count-history-detail',
standalone: false,
templateUrl: './physical-count-history-detail.html',
styleUrl: './physical-count-history-detail.css'
})
export class PhysicalCountHistoryDetail implements OnInit {

inventoryId = '';

chargement = false;

erreur = '';

inventory: any = null;

items: PhysicalCountDetailItem[] = [];

constructor(
private http: HttpClient,
private route: ActivatedRoute,
private router: Router,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {

this.inventoryId =
  this.route.snapshot.paramMap.get('id') || '';

if (!this.inventoryId) {

  this.erreur =
    'Identifiant de l’inventaire introuvable.';

  return;
}

this.chargerDetail();

}

chargerDetail(): void {

this.chargement = true;

this.erreur = '';

this.http
  .get<PhysicalCountDetailResponse>(
    `https://api.commecheznous.fr/api/v1/admin/inventory/counts/${this.inventoryId}`
  )
  .subscribe({

    next: (response) => {

      console.log(
        'DÉTAIL INVENTAIRE :',
        response
      );

      if (
        !response ||
        response.success !== true
      ) {

        const message =
          response?.message ||
          'Impossible de charger le détail de l’inventaire.';

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

      this.inventory =
        response.data || null;

      this.items =
        this.extraireItems(
          response.data
        );

      this.chargement = false;

      this.cdr.detectChanges();
    },

    error: (error) => {

      console.error(
        'ERREUR DÉTAIL INVENTAIRE :',
        error
      );

      const message =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible de charger le détail de l’inventaire.';

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

private extraireItems(
data: any
): PhysicalCountDetailItem[] {

const source =
  data?.items ||
  data?.inventoryItems ||
  data?.stockItems ||
  [];

return source.map(
  (item: any) => {

    const systemQuantity =
      Number(
        item.systemQuantity ??
        item.theoreticalQuantity ??
        item.quantity ??
        0
      );

    const actualQuantity =
      Number(
        item.actualQuantity ??
        item.physicalQuantity ??
        item.countedQuantity ??
        0
      );

    const difference =
      actualQuantity -
      systemQuantity;

    return {

      variantId:
        item.variantId ||
        item.variant?.id ||
        item.id ||
        '',

      sku:
        item.sku ||
        item.variant?.sku ||
        '—',

      productName:
        item.productName ||
        item.variant?.productName ||
        item.variant?.product?.name ||
        'Produit inconnu',

      variantLabel:
        item.variantLabel ||
        item.variant?.label ||
        '—',

      systemQuantity,

      actualQuantity,

      difference

    };

  }
);

}

getTotalTheorique(): number {

return this.items.reduce(
  (total, item) =>
    total +
    Number(item.systemQuantity || 0),
  0
);

}

getTotalPhysique(): number {

return this.items.reduce(
  (total, item) =>
    total +
    Number(item.actualQuantity || 0),
  0
);

}

getTotalEcart(): number {

return (
  this.getTotalPhysique() -
  this.getTotalTheorique()
);

}

getNombreEcarts(): number {

return this.items.filter(
  item =>
    Number(item.difference || 0) !== 0
).length;

}

getEcartClass(
difference: number
): string {

if (difference > 0) {
  return 'ecart-positif';
}

if (difference < 0) {
  return 'ecart-negatif';
}

return 'ecart-neutre';

}

getStatut(
difference: number
): string {

return difference === 0
  ? 'Conforme'
  : 'Écart';

}

formatDate(
date: string | null | undefined
): string {

if (!date) {
  return '—';
}

const valeur =
  new Date(date);

if (isNaN(valeur.getTime())) {
  return '—';
}

return valeur.toLocaleString(
  'fr-FR',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
);

}

retourHistorique(): void {

this.router.navigate([
  '/inventory/physical-counts-history'
]);

}

actualiser(): void {

if (this.chargement) {
  return;
}

this.chargerDetail();

}

}