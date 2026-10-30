import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardGeneral } from './admin-dashboard-general';

describe('AdminDashboardGeneral', () => {
  let component: AdminDashboardGeneral;
  let fixture: ComponentFixture<AdminDashboardGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminDashboardGeneral],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
