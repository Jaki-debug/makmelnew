import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhysicalCountsHistory } from './physical-counts-history';

describe('PhysicalCountsHistory', () => {
  let component: PhysicalCountsHistory;
  let fixture: ComponentFixture<PhysicalCountsHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhysicalCountsHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicalCountsHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
