import { Categorie } from './categorie';

export type ProduitStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED';

export interface VarianteProduit {
  id: string;
  sku: string;
  name: string | null;
  size: string | null;
  color: string | null;
  model: string | null;
  price: number;
  compareAtPrice: number | null;
  isActive: boolean;
  quantityAvailable: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Produit {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
  description: string | null;
  brand: string | null;
  status: ProduitStatus;
  seoTitle: string | null;
  seoDescription: string | null;

  primaryImageFileId: string | null;

  category?: Categorie | null;
  variants?: VarianteProduit[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProduitRequest {
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  status?: ProduitStatus;
  seoTitle?: string;
  seoDescription?: string;
}

export interface VarianteRequest {
  sku: string;
  name?: string;
  size?: string;
  color?: string;
  model?: string;
  price: number;
  compareAtPrice?: number;
  isActive?: boolean;
  initialQuantity?: number;
  lowStockThreshold?: number;
}

export interface ProduitsListResponse {
  success: boolean;
  data: Produit[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  message?: string;
}

export interface ProduitResponse {
  success: boolean;
  data: Produit;
  message?: string;
}