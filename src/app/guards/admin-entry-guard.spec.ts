import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { adminEntryGuard } from './admin-entry-guard';

describe('adminEntryGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminEntryGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
