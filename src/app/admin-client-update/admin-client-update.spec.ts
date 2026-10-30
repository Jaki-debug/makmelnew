import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminClientUpdate } from './admin-client-update';

describe('AdminClientUpdate', () => {
  let component: AdminClientUpdate;
  let fixture: ComponentFixture<AdminClientUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminClientUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminClientUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
