import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryPhysicalCountCreate } from './inventory-physical-count-create';

describe('InventoryPhysicalCountCreate', () => {
  let component: InventoryPhysicalCountCreate;
  let fixture: ComponentFixture<InventoryPhysicalCountCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryPhysicalCountCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryPhysicalCountCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
