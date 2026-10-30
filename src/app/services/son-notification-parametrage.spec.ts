import { TestBed } from '@angular/core/testing';
import { SonNotificationParametrage } from './son-notification-parametrage';

describe('SonNotificationParametrage', () => {
  let service: SonNotificationParametrage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SonNotificationParametrage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
