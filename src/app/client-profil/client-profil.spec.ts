import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProfil } from './client-profil';

describe('ClientProfil', () => {
  let component: ClientProfil;
  let fixture: ComponentFixture<ClientProfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProfil],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
