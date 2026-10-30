import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardMak } from './admin-dashboard-mak';

describe('AdminDashboardMak', () => {
  let component: AdminDashboardMak;
  let fixture: ComponentFixture<AdminDashboardMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminDashboardMak],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
