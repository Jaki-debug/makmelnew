import { TestBed } from '@angular/core/testing';
import { ClientPanier } from './client-panier';

describe('ClientPanier', () => {
  let service: ClientPanier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientPanier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
