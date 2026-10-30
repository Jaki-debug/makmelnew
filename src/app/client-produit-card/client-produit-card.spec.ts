import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProduitCard } from './client-produit-card';

describe('ClientProduitCard', () => {
  let component: ClientProduitCard;
  let fixture: ComponentFixture<ClientProduitCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProduitCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProduitCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
