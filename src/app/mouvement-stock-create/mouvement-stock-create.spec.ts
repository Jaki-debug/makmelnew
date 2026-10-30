import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MouvementStockCreate } from './mouvement-stock-create';

describe('MouvementStockCreate', () => {
  let component: MouvementStockCreate;
  let fixture: ComponentFixture<MouvementStockCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MouvementStockCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(MouvementStockCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
