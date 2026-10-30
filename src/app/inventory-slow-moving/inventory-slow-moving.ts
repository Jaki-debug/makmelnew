import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface SlowMovingItem {
id?: string;
variantId?: string;
sku?: string;

productName?: string;
name?: string;

variantName?: string;
variantLabel?: string;

quantity?: number;
stock?: number;
currentQuantity?: number;
availableQuantity?: number;

lastSaleAt?: string | null;
lastSoldAt?: string | null;
lastSaleDate?: string | null;

daysSinceLastSale?: number;
daysWithoutSale?: number;

product?: {
id?: string;
name?: string;
title?: string;
};

variant?: {
id?: string;
name?: string;
label?: string;
sku?: string;
};
}

interface SlowMovingResponse {
success: boolean;
data: SlowMovingItem[];
meta?: {
page?: number;
limit?: number;
total?: number;
totalPages?: number;
hasPreviousPage?: boolean;
hasNextPage?: boolean;
};
}

@Component({
selector: 'app-inventory-slow-moving',
standalone: false,
templateUrl: './inventory-slow-moving.html',
styleUrl: './inventory-slow-moving.css'
})
export class InventorySlowMoving implements OnInit {

items: SlowMovingItem[] = [];

page = 1;
limit = 20;
days = 90;

total = 0;
totalPages = 0;

loading = false;
error = '';

constructor(
private http: HttpClient,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.loadSlowMoving();
}

loadSlowMoving(): void {

this.loading = true;
this.error = '';

const params = new HttpParams()
  .set('page', this.page.toString())
  .set('limit', this.limit.toString())
  .set('days', this.days.toString());

this.http.get<SlowMovingResponse>(
  'https://api.commecheznous.fr/api/v1/admin/inventory/slow-moving',
  { params }
).subscribe({

  next: (response) => {

    console.log(
      'RÉPONSE ROTATION LENTE :',
      response
    );

    this.items = [
      ...(response.data ?? [])
    ];

    this.total =
      response.meta?.total ??
      this.items.length;

    this.totalPages =
      response.meta?.totalPages ??
      (this.total > 0
        ? Math.ceil(this.total / this.limit)
        : 0);

    this.loading = false;
    this.error = '';

    this.cdr.detectChanges();
  },

  error: (error) => {

    console.error(
      'ERREUR ROTATION LENTE :',
      error
    );

    this.items = [];
    this.total = 0;
    this.totalPages = 0;

    this.error =
      error?.error?.error?.message ||
      error?.error?.message ||
      'Impossible de charger les produits à rotation lente.';

    this.loading = false;

    this.cdr.detectChanges();
  }

});

}

changerPeriode(nouveauNombreDeJours: number): void {

if (this.loading) {
  return;
}

this.days = Number(nouveauNombreDeJours);
this.page = 1;

this.loadSlowMoving();

}

actualiser(): void {

if (this.loading) {
  return;
}

this.loadSlowMoving();

}

pagePrecedente(): void {

if (
  this.loading ||
  this.page <= 1
) {
  return;
}

this.page--;

this.loadSlowMoving();

}

pageSuivante(): void {

if (
  this.loading ||
  this.page >= this.totalPages
) {
  return;
}

this.page++;

this.loadSlowMoving();

}

getProductName(item: SlowMovingItem): string {

return (
  item.productName ||
  item.product?.name ||
  item.product?.title ||
  item.name ||
  'Produit'
);

}

getVariantName(item: SlowMovingItem): string {

return (
  item.variantName ||
  item.variantLabel ||
  item.variant?.name ||
  item.variant?.label ||
  'Variante'
);

}

getSku(item: SlowMovingItem): string {

return (
  item.sku ||
  item.variant?.sku ||
  '—'
);

}

getQuantity(item: SlowMovingItem): number {

return (
  item.availableQuantity ??
  item.currentQuantity ??
  item.quantity ??
  item.stock ??
  0
);

}

getLastSale(item: SlowMovingItem): string {

const date =
  item.lastSaleAt ??
  item.lastSoldAt ??
  item.lastSaleDate;

if (!date) {
  return 'Jamais vendu';
}

const parsedDate = new Date(date);

if (isNaN(parsedDate.getTime())) {
  return 'Jamais vendu';
}

return parsedDate.toLocaleDateString(
  'fr-FR',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
);

}

getDaysWithoutSale(item: SlowMovingItem): string {

if (
  item.daysSinceLastSale !== undefined &&
  item.daysSinceLastSale !== null
) {
  return `${item.daysSinceLastSale} jour(s)`;
}

if (
  item.daysWithoutSale !== undefined &&
  item.daysWithoutSale !== null
) {
  return `${item.daysWithoutSale} jour(s)`;
}

return '—';

}

getRotationClass(item: SlowMovingItem): string {

const days =
  item.daysSinceLastSale ??
  item.daysWithoutSale;

if (
  days !== undefined &&
  days >= 180
) {
  return 'rotation-critical';
}

if (
  days !== undefined &&
  days >= 90
) {
  return 'rotation-warning';
}

return 'rotation-default';

}
}