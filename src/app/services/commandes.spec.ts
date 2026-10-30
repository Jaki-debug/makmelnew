import { TestBed } from '@angular/core/testing';
import { Commandes } from './commandes';

describe('Commandes', () => {
  let service: Commandes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Commandes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
