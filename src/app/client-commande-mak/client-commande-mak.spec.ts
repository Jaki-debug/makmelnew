import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientCommandeMak } from './client-commande-mak';

describe('ClientCommandeMak', () => {
  let component: ClientCommandeMak;
  let fixture: ComponentFixture<ClientCommandeMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientCommandeMak],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientCommandeMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
