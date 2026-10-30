import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryPhysicalCounts } from './inventory-physical-counts';

describe('InventoryPhysicalCounts', () => {
  let component: InventoryPhysicalCounts;
  let fixture: ComponentFixture<InventoryPhysicalCounts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryPhysicalCounts],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryPhysicalCounts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
