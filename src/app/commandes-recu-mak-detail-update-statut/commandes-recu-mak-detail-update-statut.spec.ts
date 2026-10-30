import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandesRecuMakDetailUpdateStatut } from './commandes-recu-mak-detail-update-statut';

describe('CommandesRecuMakDetailUpdateStatut', () => {
  let component: CommandesRecuMakDetailUpdateStatut;
  let fixture: ComponentFixture<CommandesRecuMakDetailUpdateStatut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandesRecuMakDetailUpdateStatut],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandesRecuMakDetailUpdateStatut);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
