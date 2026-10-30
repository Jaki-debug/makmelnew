import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RapportsMak } from './rapports-mak';

describe('RapportsMak', () => {
  let component: RapportsMak;
  let fixture: ComponentFixture<RapportsMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RapportsMak],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportsMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
