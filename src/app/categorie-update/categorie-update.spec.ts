import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategorieUpdate } from './categorie-update';

describe('CategorieUpdate', () => {
  let component: CategorieUpdate;
  let fixture: ComponentFixture<CategorieUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategorieUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(CategorieUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
