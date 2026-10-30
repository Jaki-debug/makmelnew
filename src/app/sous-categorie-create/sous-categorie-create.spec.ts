import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SousCategorieCreate } from './sous-categorie-create';

describe('SousCategorieCreate', () => {
  let component: SousCategorieCreate;
  let fixture: ComponentFixture<SousCategorieCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SousCategorieCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(SousCategorieCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
