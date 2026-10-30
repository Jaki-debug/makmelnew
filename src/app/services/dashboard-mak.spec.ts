import { TestBed } from '@angular/core/testing';
import { DashboardMak } from './dashboard-mak';

describe('DashboardMak', () => {
  let service: DashboardMak;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardMak);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
