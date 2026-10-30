import { TestBed } from '@angular/core/testing';
import { ClientCategories } from './client-categories';

describe('ClientCategories', () => {
  let service: ClientCategories;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientCategories);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
