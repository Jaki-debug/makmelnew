import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailProduit } from './detail-produit';

describe('DetailProduit', () => {
  let component: DetailProduit;
  let fixture: ComponentFixture<DetailProduit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailProduit],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailProduit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
