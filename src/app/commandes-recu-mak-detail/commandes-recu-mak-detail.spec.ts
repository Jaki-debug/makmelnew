import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandesRecuMakDetail } from './commandes-recu-mak-detail';

describe('CommandesRecuMakDetail', () => {
  let component: CommandesRecuMakDetail;
  let fixture: ComponentFixture<CommandesRecuMakDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandesRecuMakDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandesRecuMakDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
