import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhysicalCountHistoryDetail } from './physical-count-history-detail';

describe('PhysicalCountHistoryDetail', () => {
  let component: PhysicalCountHistoryDetail;
  let fixture: ComponentFixture<PhysicalCountHistoryDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhysicalCountHistoryDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicalCountHistoryDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
