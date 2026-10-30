export interface Inventory {
variantId: string;
sku: string;
productId: string;
productName: string;
variantLabel: string;
quantity: number;
available: number;
reservedQuantity: number;
lowStockThreshold: number;
isLowStock: boolean;
}

export interface InventoryPagination {
page: number;
limit: number;
total: number;
totalPages: number;
hasPreviousPage: boolean;
hasNextPage: boolean;
}

export interface InventoryResponse {
success: boolean;
data: Inventory[];
meta: InventoryPagination;
}

export interface InventoryMovement {
id: string;
variantId: string;
type: InventoryMovementType;
quantity: number;
reason?: string;
createdAt?: string;
}

export type InventoryMovementType =
| 'PURCHASE'
| 'SALE'
| 'RETURN'
| 'ADJUSTMENT'
| 'DAMAGE'
| 'LOSS'
| 'TRANSFER_IN'
| 'TRANSFER_OUT'
| 'INVENTORY_CORRECTION';

export interface InventoryAlert {
variantId: string;
sku: string;
productId: string;
productName: string;
variantLabel: string;
quantity: number;
available: number;
reservedQuantity: number;
lowStockThreshold: number;
isLowStock: boolean;
}

export interface SlowMovingItem {
variantId: string;
sku: string;
productId: string;
productName: string;
variantLabel: string;
quantity: number;
lastSaleDate?: string;
}

export interface InventoryCountItem {
variantId: string;
actualQuantity: number;
}

export interface InventoryCountRequest {
reason: string;
items: InventoryCountItem[];
}

export interface StockInRequest {
variantId: string;
quantity: number;
reason: string;
}

export interface StockOutRequest {
variantId: string;
quantity: number;
reason: string;
}

export interface StockAdjustmentRequest {
variantId: string;
newQuantity: number;
reason: string;
}

export interface InventoryCount {
id: string;
reason?: string;
createdAt?: string;
items?: InventoryCountItem[];
}