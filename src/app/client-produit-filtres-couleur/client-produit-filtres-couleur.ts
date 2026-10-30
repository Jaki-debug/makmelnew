import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

export interface FiltresClientProduit {
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  brand?: string;
  inStock?: boolean;
}

@Component({
  selector: 'app-client-produit-filtres-couleur',
  standalone: false,
  templateUrl: './client-produit-filtres-couleur.html',
  styleUrl: './client-produit-filtres-couleur.css'
})
export class ClientProduitFiltresCouleurComponent {
  minPrice: number | null = null;
  maxPrice: number | null = null;
  size = '';
  color = '';
  brand = '';
  disponibilite: 'all' | 'available' | 'unavailable' = 'all';
  erreur = '';

  @Output()
  filtresChanges = new EventEmitter<FiltresClientProduit>();

  appliquerFiltres(): void {
    this.erreur = '';

    if (
      this.minPrice !== null &&
      this.maxPrice !== null &&
      this.minPrice > this.maxPrice
    ) {
      this.erreur = 'Le prix minimum doit être inférieur au prix maximum.';
      return;
    }

    if (
      (this.minPrice !== null && this.minPrice < 0) ||
      (this.maxPrice !== null && this.maxPrice < 0)
    ) {
      this.erreur = 'Les prix ne peuvent pas être négatifs.';
      return;
    }

    const filtres: FiltresClientProduit = {};

    if (this.minPrice !== null) filtres.minPrice = this.minPrice;
    if (this.maxPrice !== null) filtres.maxPrice = this.maxPrice;
    if (this.size.trim()) filtres.size = this.size.trim();
    if (this.color.trim()) filtres.color = this.color.trim();
    if (this.brand.trim()) filtres.brand = this.brand.trim();
    if (this.disponibilite !== 'all') {
      filtres.inStock = this.disponibilite === 'available';
    }

    this.filtresChanges.emit(filtres);
  }

  reinitialiserFiltres(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.size = '';
    this.color = '';
    this.brand = '';
    this.disponibilite = 'all';
    this.erreur = '';
    this.filtresChanges.emit({});
  }
}
