import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientPasserCommande } from './client-passer-commande';

describe('ClientPasserCommande', () => {
  let component: ClientPasserCommande;
  let fixture: ComponentFixture<ClientPasserCommande>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientPasserCommande],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPasserCommande);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
