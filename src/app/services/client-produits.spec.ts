import { TestBed } from '@angular/core/testing';
import { ClientProduits } from './client-produits';

describe('ClientProduits', () => {
  let service: ClientProduits;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientProduits);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
