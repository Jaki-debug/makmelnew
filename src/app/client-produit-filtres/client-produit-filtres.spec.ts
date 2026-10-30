import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProduitFiltres } from './client-produit-filtres';

describe('ClientProduitFiltres', () => {
  let component: ClientProduitFiltres;
  let fixture: ComponentFixture<ClientProduitFiltres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProduitFiltres],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProduitFiltres);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
