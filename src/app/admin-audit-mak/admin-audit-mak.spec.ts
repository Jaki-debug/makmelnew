import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAuditMak } from './admin-audit-mak';

describe('AdminAuditMak', () => {
  let component: AdminAuditMak;
  let fixture: ComponentFixture<AdminAuditMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminAuditMak],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAuditMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
