import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientPanierMak } from './client-panier-mak';

describe('ClientPanierMak', () => {
  let component: ClientPanierMak;
  let fixture: ComponentFixture<ClientPanierMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientPanierMak],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPanierMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
