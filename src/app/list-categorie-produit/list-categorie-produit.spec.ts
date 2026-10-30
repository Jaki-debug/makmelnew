import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListCategorieProduit } from './list-categorie-produit';

describe('ListCategorieProduit', () => {
  let component: ListCategorieProduit;
  let fixture: ComponentFixture<ListCategorieProduit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListCategorieProduit],
    }).compileComponents();

    fixture = TestBed.createComponent(ListCategorieProduit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
