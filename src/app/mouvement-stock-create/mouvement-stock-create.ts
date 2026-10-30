import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface InventoryItem {
id?: string;
variantId?: string;
productId?: string;
sku?: string;
name?: string;
productName?: string;
variantName?: string;
variantLabel?: string;
quantity?: number;
stock?: number;
stockQuantity?: number;
available?: number;
availableQuantity?: number;
reserved?: number;
reservedQuantity?: number;

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

interface VariantOption {
id: string;
name: string;
sku?: string;
currentQuantity: number;
}

interface ProductOption {
id: string;
name: string;
variants: VariantOption[];
}

@Component({
selector: 'app-mouvement-stock-create',
standalone: false,
templateUrl: './mouvement-stock-create.html',
styleUrl: './mouvement-stock-create.css'
})
export class MouvementStockCreate implements OnInit {

products: ProductOption[] = [];

variants: VariantOption[] = [];

loadingProducts = false;

submitting = false;

error = '';

movementType:
'STOCK_IN' |
'STOCK_OUT' |
'STOCK_ADJUSTMENT' = 'STOCK_IN';

selectedProductId = '';

selectedVariantId = '';

quantity: number | null = null;

reason = '';

currentQuantity: number | null = null;

constructor(
private http: HttpClient,
private router: Router,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
this.loadProductsAndVariants();
}

loadProductsAndVariants(): void {

this.loadingProducts = true;

this.error = '';

const params = new HttpParams()
  .set('page', '1')
  .set('limit', '100');

this.http.get<any>(
  'https://api.commecheznous.fr/api/v1/admin/inventory',
  {
    params
  }
).subscribe({

  next: (response) => {

    console.log(
      'RÉPONSE INVENTORY POUR CRÉATION MOUVEMENT :',
      response
    );

    const items: InventoryItem[] =
      response?.data ?? [];

    console.log(
      'ITEMS INVENTORY :',
      items
    );

    this.buildProductOptions(items);

    this.loadingProducts = false;

    this.cdr.detectChanges();

  },

  error: (error) => {

    console.error(
      'ERREUR CHARGEMENT PRODUITS :',
      error
    );

    console.error(
      'ERREUR API INVENTORY :',
      error?.error
    );

    this.loadingProducts = false;

    this.error =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      'Impossible de charger les produits et les variantes.';

    this.cdr.detectChanges();

  }

});

}

buildProductOptions(
items: InventoryItem[]
): void {

const productMap =
  new Map<string, ProductOption>();

for (const item of items) {

  const variantId =
    item.variantId ||
    item.variant?.id ||
    item.id ||
    '';

  if (!variantId) {
    continue;
  }

  const productId =
    item.productId ||
    item.product?.id ||
    `product-${variantId}`;

  const productName =
    item.productName ||
    item.product?.name ||
    item.product?.title ||
    item.name ||
    'Produit';

  const variantName =
    item.variantName ||
    item.variantLabel ||
    item.variant?.name ||
    item.variant?.label ||
    item.sku ||
    item.variant?.sku ||
    'Variante';

  const currentQuantity =
    this.extractQuantity(item);

  if (!productMap.has(productId)) {

    productMap.set(
      productId,
      {
        id: productId,
        name: productName,
        variants: []
      }
    );

  }

  const product =
    productMap.get(productId)!;

  const exists =
    product.variants.some(
      variant =>
        variant.id === variantId
    );

  if (!exists) {

    product.variants.push({

      id: variantId,

      name: variantName,

      sku:
        item.sku ||
        item.variant?.sku,

      currentQuantity

    });

  }

}

this.products =
  Array.from(
    productMap.values()
  );

this.products.sort(
  (a, b) =>
    a.name.localeCompare(
      b.name,
      'fr'
    )
);

for (
  const product of this.products
) {

  product.variants.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        'fr'
      )
  );

}

console.log(
  'PRODUITS DISPONIBLES :',
  this.products
);

}

extractQuantity(
item: InventoryItem
): number {

const possibleQuantity =
  item.quantity ??
  item.stock ??
  item.stockQuantity ??
  item.available ??
  item.availableQuantity;

const quantity =
  Number(
    possibleQuantity
  );

if (
  Number.isFinite(
    quantity
  )
) {

  return quantity;

}

return 0;

}

onProductChange(): void {

this.selectedVariantId = '';

this.quantity = null;

this.currentQuantity = null;

const product =
  this.products.find(
    product =>
      product.id ===
      this.selectedProductId
  );

this.variants =
  product?.variants ?? [];

this.cdr.detectChanges();

}

onVariantChange(): void {

this.quantity = null;

this.error = '';

const variant =
  this.variants.find(
    variant =>
      variant.id ===
      this.selectedVariantId
  );

if (variant) {

  this.currentQuantity =
    variant.currentQuantity;

  console.log(
    'VARIANTE SÉLECTIONNÉE :',
    variant
  );

  console.log(
    'QUANTITÉ ACTUELLE :',
    this.currentQuantity
  );

} else {

  this.currentQuantity = null;

}

this.cdr.detectChanges();

}

getCurrentQuantity(): number {

if (
  this.currentQuantity !== null
) {

  return this.currentQuantity;

}

const variant =
  this.variants.find(
    variant =>
      variant.id ===
      this.selectedVariantId
  );

return (
  variant?.currentQuantity ??
  0
);

}

getFinalQuantity(): number {

const current =
  this.getCurrentQuantity();

if (
  this.quantity === null ||
  !Number.isFinite(
    this.quantity
  )
) {

  return current;

}

if (
  this.movementType ===
  'STOCK_IN'
) {

  return (
    current +
    Number(this.quantity)
  );

}

if (
  this.movementType ===
  'STOCK_OUT'
) {

  return (
    current -
    Number(this.quantity)
  );

}

return Number(this.quantity);

}

getAdjustmentDifference(): number {

if (
  this.quantity === null ||
  !Number.isFinite(
    this.quantity
  )
) {

  return 0;

}

return (
  Number(this.quantity) -
  this.getCurrentQuantity()
);

}

submitMovement(): void {

this.error = '';

if (!this.selectedProductId) {

  this.error =
    'Veuillez sélectionner un produit.';

  return;

}

if (!this.selectedVariantId) {

  this.error =
    'Veuillez sélectionner une variante.';

  return;

}

if (
  this.quantity === null ||
  !Number.isFinite(
    this.quantity
  ) ||
  this.quantity < 0
) {

  this.error =
    this.movementType ===
    'STOCK_ADJUSTMENT'

      ? 'La nouvelle quantité doit être supérieure ou égale à 0.'

      : 'La quantité doit être supérieure à 0.';

  return;

}

if (
  this.movementType !==
  'STOCK_ADJUSTMENT' &&
  this.quantity <= 0
) {

  this.error =
    'La quantité doit être supérieure à 0.';

  return;

}

if (
  this.movementType ===
  'STOCK_OUT' &&
  this.quantity >
  this.getCurrentQuantity()
) {

  this.error =
    'La quantité de sortie ne peut pas être supérieure à la quantité disponible.';

  return;

}

if (!this.reason.trim()) {

  this.error =
    'Veuillez renseigner le motif.';

  return;

}

this.submitting = true;

let body: any = {};

if (
  this.movementType ===
  'STOCK_ADJUSTMENT'
) {

  body = {

    variantId:
      this.selectedVariantId,

    newQuantity:
      Number(
        this.quantity
      ),

    reason:
      this.reason.trim()

  };

} else {

  body = {

    variantId:
      this.selectedVariantId,

    quantity:
      Number(
        this.quantity
      ),

    reason:
      this.reason.trim()

  };

}

let url = '';

if (
  this.movementType ===
  'STOCK_IN'
) {

  url =
    'https://api.commecheznous.fr/api/v1/admin/inventory/stock-in';

}

if (
  this.movementType ===
  'STOCK_OUT'
) {

  url =
    'https://api.commecheznous.fr/api/v1/admin/inventory/stock-out';

}

if (
  this.movementType ===
  'STOCK_ADJUSTMENT'
) {

  url =
    'https://api.commecheznous.fr/api/v1/admin/inventory/adjust';

}

console.log(
  'MOUVEMENT ENVOYÉ :',
  body
);

console.log(
  'TYPE DE MOUVEMENT :',
  this.movementType
);

console.log(
  'QUANTITÉ INITIALE :',
  this.getCurrentQuantity()
);

console.log(
  'QUANTITÉ DU MOUVEMENT :',
  this.quantity
);

console.log(
  'QUANTITÉ FINALE :',
  this.getFinalQuantity()
);

console.log(
  'URL :',
  url
);

this.http.post(
  url,
  body
).subscribe({

  next: (response) => {

    console.log(
      'MOUVEMENT CRÉÉ :',
      response
    );

    this.submitting = false;

    this.cdr.detectChanges();

    Swal.fire({

      icon: 'success',

      title: 'Opération réussie',

      text:
        this.movementType ===
        'STOCK_ADJUSTMENT'
          ? 'Stock ajusté avec succès.'
          : 'Mouvement enregistré avec succès.',

      confirmButtonText: 'OK',

      confirmButtonColor: '#111827',

      allowOutsideClick: false,

      allowEscapeKey: false

    }).then(() => {

      this.router.navigate([
        '/inventory/movements'
      ]);

    });

  },

  error: (error) => {

    console.error(
      'ERREUR CRÉATION MOUVEMENT :',
      error
    );

    console.error(
      'RÉPONSE ERREUR API :',
      error?.error
    );

    console.error(
      'ERREUR BACKEND :',
      error?.error?.error
    );

    console.error(
      'DÉTAILS VALIDATION :',
      error?.error?.error?.details
    );

    const validationDetails =
      error?.error?.error?.details;

    if (
      Array.isArray(
        validationDetails
      ) &&
      validationDetails.length > 0
    ) {

      console.error(
        'PREMIER DÉTAIL DE VALIDATION :',
        validationDetails[0]
      );

      const firstDetail =
        validationDetails[0];

      if (
        typeof firstDetail === 'string'
      ) {

        this.error =
          firstDetail;

      } else {

        this.error =
          firstDetail?.message ||
          firstDetail?.msg ||
          error?.error?.error?.message ||
          'Erreur de validation.';

      }

    } else {

      this.error =
        error?.error?.error?.message ||
        error?.error?.message ||
        error?.message ||
        'Impossible d’enregistrer le mouvement.';

    }

    this.submitting = false;

    this.cdr.detectChanges();

  }

});

}

cancel(): void {

if (this.submitting) {

  return;

}

this.router.navigate([
  '/inventory/movements'
]);

}

}