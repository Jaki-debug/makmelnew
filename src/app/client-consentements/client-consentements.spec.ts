import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientConsentements } from './client-consentements';

describe('ClientConsentements', () => {
  let component: ClientConsentements;
  let fixture: ComponentFixture<ClientConsentements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientConsentements],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientConsentements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
