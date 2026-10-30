import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'app-client-panier-produit-mak-actions',
  standalone: false,
  templateUrl: './client-panier-produit-mak-actions.html',
  styleUrl: './client-panier-produit-mak-actions.css'
})
export class ClientPanierProduitMakActions {
  @Input() quantite = 1;
  @Input() disabled = false;
  @Input() quantiteMaximale: number | null = null;

  @Output() quantiteChange = new EventEmitter<number>();
  @Output() suppression = new EventEmitter<void>();

  diminuer(): void {
    if (!this.disabled && this.quantite > 1) {
      this.quantiteChange.emit(this.quantite - 1);
    }
  }

  augmenter(): void {
    if (!this.disabled && !this.maximumAtteint) {
      this.quantiteChange.emit(this.quantite + 1);
    }
  }

  supprimerArticle(): void {
    if (!this.disabled) {
      this.suppression.emit();
    }
  }

  get maximumAtteint(): boolean {
    return this.quantiteMaximale !== null &&
      this.quantite >= this.quantiteMaximale;
  }
}