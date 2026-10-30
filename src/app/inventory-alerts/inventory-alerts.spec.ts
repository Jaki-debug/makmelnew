import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryAlerts } from './inventory-alerts';

describe('InventoryAlerts', () => {
  let component: InventoryAlerts;
  let fixture: ComponentFixture<InventoryAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryAlerts],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryAlerts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
