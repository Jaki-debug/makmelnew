import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientConnexion } from './client-connexion';

describe('ClientConnexion', () => {
  let component: ClientConnexion;
  let fixture: ComponentFixture<ClientConnexion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientConnexion],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientConnexion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
