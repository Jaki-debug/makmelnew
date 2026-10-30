import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategorieCreate } from './categorie-create';

describe('CategorieCreate', () => {
  let component: CategorieCreate;
  let fixture: ComponentFixture<CategorieCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategorieCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(CategorieCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
