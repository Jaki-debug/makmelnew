import { TestBed } from '@angular/core/testing';
import { ClientAuth } from './client-auth';

describe('ClientAuth', () => {
  let service: ClientAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientAuth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
