import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientFooter } from './client-footer';

describe('ClientFooter', () => {
  let component: ClientFooter;
  let fixture: ComponentFixture<ClientFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
