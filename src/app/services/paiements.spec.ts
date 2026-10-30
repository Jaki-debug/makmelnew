import { TestBed } from '@angular/core/testing';
import { Paiements } from './paiements';

describe('Paiements', () => {
  let service: Paiements;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Paiements);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
