import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandesRecuDetail } from './commandes-recu-detail';

describe('CommandesRecuDetail', () => {
  let component: CommandesRecuDetail;
  let fixture: ComponentFixture<CommandesRecuDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommandesRecuDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandesRecuDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
