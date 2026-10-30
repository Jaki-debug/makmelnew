import { TestBed } from '@angular/core/testing';
import { Files } from './files';

describe('Files', () => {
  let service: Files;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Files);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
