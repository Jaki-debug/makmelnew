import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonProfilBackoffice } from './mon-profil-backoffice';

describe('MonProfilBackoffice', () => {
  let component: MonProfilBackoffice;
  let fixture: ComponentFixture<MonProfilBackoffice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonProfilBackoffice],
    }).compileComponents();

    fixture = TestBed.createComponent(MonProfilBackoffice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
