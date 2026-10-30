import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProduitFiltresCouleur } from './client-produit-filtres-couleur';

describe('ClientProduitFiltresCouleur', () => {
  let component: ClientProduitFiltresCouleur;
  let fixture: ComponentFixture<ClientProduitFiltresCouleur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProduitFiltresCouleur],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProduitFiltresCouleur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
