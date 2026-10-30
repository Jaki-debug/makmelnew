import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientAdresses } from './client-adresses';

describe('ClientAdresses', () => {
  let component: ClientAdresses;
  let fixture: ComponentFixture<ClientAdresses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientAdresses],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAdresses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
