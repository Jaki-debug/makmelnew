import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandesRecuMak } from './commandes-recu-mak';

describe('CommandesRecuMak', () => {
  let component: CommandesRecuMak;
  let fixture: ComponentFixture<CommandesRecuMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandesRecuMak],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandesRecuMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
