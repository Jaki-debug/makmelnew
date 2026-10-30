
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface StockMovement {
  id: string;
  variantId: string;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
}

interface InventoryMovementsResponse {
  success: boolean;
  data: StockMovement[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

interface InventoryItem {
  id?: string;
  variantId?: string;
  sku?: string;
  productId?: string;
  productName?: string;
  name?: string;
  variantName?: string;
  variantLabel?: string;

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

interface VariantInfo {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  sku?: string;
}

@Component({
  selector: 'app-inventory-movements',
  standalone: false,
  templateUrl: './inventory-movements.html',
  styleUrl: './inventory-movements.css'
})
export class InventoryMovements implements OnInit {

  movements: StockMovement[] = [];
  variantMap = new Map<string, VariantInfo>();

  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  // Tailles disponibles pour la pagination
  pageSizeOptions = [10, 20, 50, 100];

  loading = false;
  loadingInventory = false;
  error = '';

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, this.page + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  get firstItem(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
  }

  get lastItem(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadMovements();
  }

  // ========================================
  // CHARGEMENT DE L'INVENTAIRE
  // ========================================

  loadInventory(): void {
    if (this.loadingInventory) {
      return;
    }

    this.loadingInventory = true;

    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '100');

    this.http.get<any>(
      'https://api.commecheznous.fr/api/v1/admin/inventory',
      { params }
    ).subscribe({
      next: (response) => {
        const items: InventoryItem[] = response?.data ?? [];

        this.buildVariantMap(items);

        this.loadingInventory = false;
        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error('Erreur chargement inventory :', err);

        this.loadingInventory = false;
        this.cdr.markForCheck();
      }
    });
  }

  buildVariantMap(items: InventoryItem[]): void {
    this.variantMap.clear();

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
        '';

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

      const sku = item.sku || item.variant?.sku;

      this.variantMap.set(variantId, {
        id: variantId,
        productId,
        productName,
        variantName,
        sku
      });
    }
  }

  // ========================================
  // CHARGEMENT DES MOUVEMENTS
  // ========================================

  loadMovements(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    const params = new HttpParams()
      .set('page', String(this.page))
      .set('limit', String(this.limit));

    this.http.get<InventoryMovementsResponse>(
      'https://api.commecheznous.fr/api/v1/admin/inventory/movements',
      { params }
    ).subscribe({
      next: (response) => {
        this.movements = response?.data ?? [];

        this.total = response?.meta?.total ?? 0;
        this.totalPages = response?.meta?.totalPages ?? 0;

        if (response?.meta?.page) {
          this.page = response.meta.page;
        }

        if (response?.meta?.limit) {
          this.limit = response.meta.limit;
        }

        this.loading = false;
        this.cdr.markForCheck();
      },

      error: (err) => {
        console.error('Erreur mouvements :', err);

        this.movements = [];
        this.total = 0;
        this.totalPages = 0;

        this.error =
          err?.error?.error?.message ||
          'Impossible de charger les mouvements de stock.';

        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ========================================
  // CHOIX DU NOMBRE DE RÉSULTATS
  // ========================================

  changePageSize(value: number | string): void {
    const newLimit = Number(value);

    if (
      !Number.isFinite(newLimit) ||
      !this.pageSizeOptions.includes(newLimit) ||
      newLimit === this.limit ||
      this.loading
    ) {
      return;
    }

    this.limit = newLimit;
    this.page = 1;

    this.loadMovements();
  }

  // ========================================
  // INFORMATIONS PRODUITS
  // ========================================

  getProductName(variantId: string): string {
    return this.variantMap.get(variantId)?.productName || 'Produit';
  }

  getVariantName(variantId: string): string {
    return this.variantMap.get(variantId)?.variantName || 'Variante';
  }

  getVariantSku(variantId: string): string {
    return this.variantMap.get(variantId)?.sku || '';
  }

  // ========================================
  // FORMATAGE DE DATE
  // ========================================

  formatDate(date: string): string {
    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ========================================
  // TYPE DE MOUVEMENT
  // ========================================

  getMovementLabel(type: string): string {
    switch (type) {
      case 'PURCHASE':
      case 'STOCK_IN':
        return 'Entrée';

      case 'SALE':
      case 'STOCK_OUT':
        return 'Sortie';

      case 'INVENTORY_CORRECTION':
        return 'Correction';

      default:
        return type || '—';
    }
  }

  getMovementClass(type: string): string {
    switch (type) {
      case 'PURCHASE':
      case 'STOCK_IN':
        return 'movement-in';

      case 'SALE':
      case 'STOCK_OUT':
        return 'movement-out';

      case 'INVENTORY_CORRECTION':
        return 'movement-correction';

      default:
        return 'movement-default';
    }
  }

  getQuantityPrefix(type: string): string {
    switch (type) {
      case 'PURCHASE':
      case 'STOCK_IN':
        return '+';

      default:
        return '';
    }
  }

  // ========================================
  // PAGINATION
  // ========================================

  previousPage(): void {
    if (this.loading || this.page <= 1) {
      return;
    }

    this.page--;
    this.loadMovements();
  }

  nextPage(): void {
    if (this.loading || this.page >= this.totalPages) {
      return;
    }

    this.page++;
    this.loadMovements();
  }

  goToPage(page: number): void {
    if (
      this.loading ||
      page < 1 ||
      page > this.totalPages ||
      page === this.page
    ) {
      return;
    }

    this.page = page;
    this.loadMovements();
  }

  trackByMovementId(
    index: number,
    movement: StockMovement
  ): string {
    return movement.id;
  }
}
