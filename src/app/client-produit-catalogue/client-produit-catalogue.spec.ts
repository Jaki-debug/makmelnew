import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProduitCatalogue } from './client-produit-catalogue';

describe('ClientProduitCatalogue', () => {
  let component: ClientProduitCatalogue;
  let fixture: ComponentFixture<ClientProduitCatalogue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProduitCatalogue],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProduitCatalogue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
