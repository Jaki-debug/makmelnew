import { TestBed } from '@angular/core/testing';
import { DashboardGeneral } from './dashboard-general';

describe('DashboardGeneral', () => {
  let service: DashboardGeneral;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardGeneral);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
