import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProduitDetail } from './client-produit-detail';

describe('ClientProduitDetail', () => {
  let component: ClientProduitDetail;
  let fixture: ComponentFixture<ClientProduitDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProduitDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProduitDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
