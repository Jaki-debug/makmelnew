import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategorieDetail } from './categorie-detail';

describe('CategorieDetail', () => {
  let component: CategorieDetail;
  let fixture: ComponentFixture<CategorieDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategorieDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(CategorieDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
