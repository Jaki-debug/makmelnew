
export interface ArticlePanierMak {
  id?: string;
  itemId?: string;
  cartItemId?: string;
  cart_item_id?: string;

  variantId?: string;
  quantity?: number;

  name?: string;
  productName?: string;
  title?: string;
  variantName?: string;

  imageUrl?: string;
  image?: string;

  price?: number | string;
  unitPrice?: number | string;
  totalPrice?: number | string;
  lineTotal?: number | string;

  product?: {
    id?: string;
    name?: string;
    nom?: string;
    title?: string;
    imageUrl?: string;
    image?: string;
    price?: number | string;
    unitPrice?: number | string;
    images?: Array<string | { url?: string; src?: string }>;
  };

  variant?: {
    id?: string;
    name?: string;
    label?: string;
    price?: number | string;
    product?: {
      id?: string;
      name?: string;
      nom?: string;
      title?: string;
      imageUrl?: string;
      image?: string;
    };
  };
}