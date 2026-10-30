import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientAdresseCreate } from './client-adresse-create';

describe('ClientAdresseCreate', () => {
  let component: ClientAdresseCreate;
  let fixture: ComponentFixture<ClientAdresseCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientAdresseCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientAdresseCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
