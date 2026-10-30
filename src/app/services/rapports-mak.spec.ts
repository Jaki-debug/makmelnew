import { TestBed } from '@angular/core/testing';
import { RapportsMak } from './rapports-mak';

describe('RapportsMak', () => {
  let service: RapportsMak;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapportsMak);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
