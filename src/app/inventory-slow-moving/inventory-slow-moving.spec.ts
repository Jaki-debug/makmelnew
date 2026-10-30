import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventorySlowMoving } from './inventory-slow-moving';

describe('InventorySlowMoving', () => {
  let component: InventorySlowMoving;
  let fixture: ComponentFixture<InventorySlowMoving>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventorySlowMoving],
    }).compileComponents();

    fixture = TestBed.createComponent(InventorySlowMoving);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
