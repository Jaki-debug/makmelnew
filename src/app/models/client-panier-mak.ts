
import { ArticlePanierMak } from './article-panier-mak';

export interface ClientPanierMak {
  id?: string;
  status?: string;

  items?: ArticlePanierMak[];
  articles?: ArticlePanierMak[];
  cartItems?: ArticlePanierMak[];
  lines?: ArticlePanierMak[];

  itemCount?: number;
  totalQuantity?: number;

  subtotal?: number | string;
  total?: number | string;
  totalAmount?: number | string;
  grandTotal?: number | string;

  currency?: string;
}