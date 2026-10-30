import { TestBed } from '@angular/core/testing';
import { AuditMak } from './audit-mak';

describe('AuditMak', () => {
  let service: AuditMak;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditMak);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
