import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
selector: 'app-client-produit-card',
standalone: false,
templateUrl: './client-produit-card.html',
styleUrl: './client-produit-card.css'
})
export class ClientProduitCard {

@Input() produit: any;

@Output() produitClique = new EventEmitter<any>();
@Output() ajouterPanier = new EventEmitter<any>();

formatPrice(prix: number): string {
return new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA';
}

voirProduit(): void {
this.produitClique.emit(this.produit);
}

ajouterAuPanier(event: Event): void {
event.stopPropagation();
this.ajouterPanier.emit(this.produit);
}

}