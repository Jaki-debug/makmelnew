import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateProduit } from './create-produit';

describe('CreateProduit', () => {
  let component: CreateProduit;
  let fixture: ComponentFixture<CreateProduit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateProduit],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProduit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
