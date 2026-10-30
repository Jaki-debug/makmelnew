import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientSecurite } from './client-securite';

describe('ClientSecurite', () => {
  let component: ClientSecurite;
  let fixture: ComponentFixture<ClientSecurite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientSecurite],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientSecurite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
