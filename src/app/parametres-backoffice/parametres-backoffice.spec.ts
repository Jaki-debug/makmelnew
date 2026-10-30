import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametresBackoffice } from './parametres-backoffice';

describe('ParametresBackoffice', () => {
  let component: ParametresBackoffice;
  let fixture: ComponentFixture<ParametresBackoffice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParametresBackoffice],
    }).compileComponents();

    fixture = TestBed.createComponent(ParametresBackoffice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
