import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProduitUpdate } from './produit-update';

describe('ProduitUpdate', () => {
  let component: ProduitUpdate;
  let fixture: ComponentFixture<ProduitUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProduitUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(ProduitUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
