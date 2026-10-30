import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryMovements } from './inventory-movements';

describe('InventoryMovements', () => {
  let component: InventoryMovements;
  let fixture: ComponentFixture<InventoryMovements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryMovements],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryMovements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
