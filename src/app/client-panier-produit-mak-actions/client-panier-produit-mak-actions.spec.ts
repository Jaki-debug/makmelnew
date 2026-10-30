import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientPanierProduitMakActions } from './client-panier-produit-mak-actions';

describe('ClientPanierProduitMakActions', () => {
  let component: ClientPanierProduitMakActions;
  let fixture: ComponentFixture<ClientPanierProduitMakActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientPanierProduitMakActions],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPanierProduitMakActions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
