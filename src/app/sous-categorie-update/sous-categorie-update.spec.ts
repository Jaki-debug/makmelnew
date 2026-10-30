import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SousCategorieUpdate } from './sous-categorie-update';

describe('SousCategorieUpdate', () => {
  let component: SousCategorieUpdate;
  let fixture: ComponentFixture<SousCategorieUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SousCategorieUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(SousCategorieUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
