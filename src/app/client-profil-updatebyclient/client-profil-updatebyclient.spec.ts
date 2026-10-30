import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientProfilUpdatebyclient } from './client-profil-updatebyclient';

describe('ClientProfilUpdatebyclient', () => {
  let component: ClientProfilUpdatebyclient;
  let fixture: ComponentFixture<ClientProfilUpdatebyclient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProfilUpdatebyclient],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientProfilUpdatebyclient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
