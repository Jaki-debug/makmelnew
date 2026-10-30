import { TestBed } from '@angular/core/testing';
import { ClientPasserCommandes } from './client-passer-commandes';

describe('ClientPasserCommandes', () => {
  let service: ClientPasserCommandes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientPasserCommandes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
