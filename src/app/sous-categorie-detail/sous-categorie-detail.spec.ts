import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SousCategorieDetail } from './sous-categorie-detail';

describe('SousCategorieDetail', () => {
  let component: SousCategorieDetail;
  let fixture: ComponentFixture<SousCategorieDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SousCategorieDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(SousCategorieDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
