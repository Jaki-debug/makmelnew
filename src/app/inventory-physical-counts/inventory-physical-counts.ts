import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface PhysicalInventory {
id: string;
reason?: string;
createdAt?: string;
createdBy?: string;
totalItems?: number;
totalDifferences?: number;
}

@Component({
selector: 'app-inventory-physical-counts',
standalone: false,
templateUrl: './inventory-physical-counts.html',
styleUrl: './inventory-physical-counts.css'
})
export class InventoryPhysicalCounts implements OnInit {

inventories: PhysicalInventory[] = [];

loading = false;

error = '';

successMessage = '';

constructor(
private router: Router,
private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {

const navigationState =
  window.history.state;

if (
  navigationState?.inventorySuccess
) {

  this.successMessage =
    navigationState.inventorySuccess;
}

if (
  navigationState?.inventoryCreated
) {

  this.inventories = [
    navigationState.inventoryCreated
  ];
}

window.history.replaceState(
  {},
  document.title
);

this.loadPhysicalInventories(false);

}

loadPhysicalInventories(
viderListe: boolean = true
): void {

this.loading = true;

this.error = '';

if (viderListe) {
  this.inventories = [];
}

this.loading = false;

this.cdr.detectChanges();

}

nouvelInventaire(): void {

this.router.navigate([
  '/inventory/physical-counts/ajouter'
]);

}

actualiser(): void {

this.loadPhysicalInventories(true);

}

formatDate(
date?: string
): string {

if (!date) {
  return '—';
}

const parsedDate =
  new Date(date);

if (
  isNaN(
    parsedDate.getTime()
  )
) {

  return '—';
}

return parsedDate.toLocaleString(
  'fr-FR',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
);

}

voirDetail(
id: string
): void {

if (!id) {
  return;
}

this.router.navigate([
  '/inventory/physical-counts',
  id
]);

}
}