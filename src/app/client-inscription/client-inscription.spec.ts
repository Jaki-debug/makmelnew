import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientInscription } from './client-inscription';

describe('ClientInscription', () => {
  let component: ClientInscription;
  let fixture: ComponentFixture<ClientInscription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientInscription],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientInscription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
