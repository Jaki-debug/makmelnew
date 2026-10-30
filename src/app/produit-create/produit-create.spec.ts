import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProduitCreate } from './produit-create';

describe('ProduitCreate', () => {
  let component: ProduitCreate;
  let fixture: ComponentFixture<ProduitCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProduitCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(ProduitCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
