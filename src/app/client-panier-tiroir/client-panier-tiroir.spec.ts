import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientPanierTiroir } from './client-panier-tiroir';

describe('ClientPanierTiroir', () => {
  let component: ClientPanierTiroir;
  let fixture: ComponentFixture<ClientPanierTiroir>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientPanierTiroir],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPanierTiroir);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
