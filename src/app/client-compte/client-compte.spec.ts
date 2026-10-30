import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientCompte } from './client-compte';

describe('ClientCompte', () => {
  let component: ClientCompte;
  let fixture: ComponentFixture<ClientCompte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientCompte],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientCompte);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
