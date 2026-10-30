import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Securite } from './securite';

describe('Securite', () => {
  let component: Securite;
  let fixture: ComponentFixture<Securite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Securite],
    }).compileComponents();

    fixture = TestBed.createComponent(Securite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
