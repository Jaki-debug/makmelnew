import { Component, EventEmitter, Output } from '@angular/core';

@Component({
selector: 'app-client-produit-filtres',
standalone: false,
templateUrl: './client-produit-filtres.html',
styleUrl: './client-produit-filtres.css'
})
export class ClientProduitFiltres {

@Output() filtresChanges = new EventEmitter<any>();

categories = [
'Toutes',
'Mode',
'Chaussures',
'Beauté',
'Cosmétiques',
'Accessoires',
'Pagnes'
];

categorieSelectionnee = 'Toutes';
prixMin: number | null = null;
prixMax: number | null = null;
tri = 'pertinence';

appliquerFiltres(): void {
this.filtresChanges.emit({
categorie: this.categorieSelectionnee,
prixMin: this.prixMin,
prixMax: this.prixMax,
tri: this.tri
});
}

selectionnerCategorie(categorie: string): void {
this.categorieSelectionnee = categorie;
this.appliquerFiltres();
}

changerTri(): void {
this.appliquerFiltres();
}

reinitialiser(): void {
this.categorieSelectionnee = 'Toutes';
this.prixMin = null;
this.prixMax = null;
this.tri = 'pertinence';

this.appliquerFiltres();

}
}