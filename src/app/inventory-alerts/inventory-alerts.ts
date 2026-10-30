import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface InventoryAlert {
id?: string;
variantId?: string;
sku?: string;

quantity?: number;
stock?: number;
currentQuantity?: number;
availableQuantity?: number;

alertThreshold?: number;
threshold?: number;
lowStockThreshold?: number;

productName?: string;
product?: {
id?: string;
name?: string;
title?: string;
};

variantName?: string;
variantLabel?: string;
variant?: {
id?: string;
name?: string;
label?: string;
sku?: string;
};
}

interface InventoryAlertsResponse {
success: boolean;
data: InventoryAlert[];
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
selector: 'app-inventory-alerts',
standalone: false,
templateUrl: './inventory-alerts.html',
styleUrl: './inventory-alerts.css'
})
export class InventoryAlerts implements OnInit {

alerts: InventoryAlert[] = [];

loading = false;
error = '';

total = 0;

constructor(
private http: HttpClient,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.loadAlerts();
}

loadAlerts(): void {
this.loading = true;
this.error = '';

this.http.get<InventoryAlertsResponse>(
  'https://api.commecheznous.fr/api/v1/admin/inventory/alerts'
).subscribe({
  next: (response) => {
    console.log('RÉPONSE ALERTES INVENTORY :', response);

    this.alerts = [...(response.data ?? [])];

    this.total =
      response.meta?.total ??
      this.alerts.length;

    this.loading = false;
    this.error = '';

    this.cdr.detectChanges();
  },

  error: (error) => {
    console.error(
      'ERREUR ALERTES INVENTORY :',
      error
    );

    this.alerts = [];
    this.total = 0;

    this.error =
      error?.error?.error?.message ||
      'Impossible de charger les alertes de stock.';

    this.loading = false;

    this.cdr.detectChanges();
  }
});

}

getProductName(
alert: InventoryAlert
): string {
return (
alert.productName ||
alert.product?.name ||
alert.product?.title ||
'Produit'
);
}

getVariantName(
alert: InventoryAlert
): string {
return (
alert.variantName ||
alert.variantLabel ||
alert.variant?.name ||
alert.variant?.label ||
'Variante'
);
}

getSku(
alert: InventoryAlert
): string {
return (
alert.sku ||
alert.variant?.sku ||
'—'
);
}

getCurrentQuantity(
alert: InventoryAlert
): number {
return (
alert.availableQuantity ??
alert.currentQuantity ??
alert.quantity ??
alert.stock ??
0
);
}

getThreshold(
alert: InventoryAlert
): number {
return (
alert.alertThreshold ??
alert.lowStockThreshold ??
alert.threshold ??
0
);
}

getAlertStatus(
alert: InventoryAlert
): string {
const quantity =
this.getCurrentQuantity(alert);

if (quantity <= 0) {
  return 'Rupture';
}

return 'Stock faible';

}

getAlertClass(
alert: InventoryAlert
): string {
const quantity =
this.getCurrentQuantity(alert);

if (quantity <= 0) {
  return 'alert-out';
}

return 'alert-low';

}
}