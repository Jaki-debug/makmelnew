import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoleDetail } from './role-detail';

describe('RoleDetail', () => {
  let component: RoleDetail;
  let fixture: ComponentFixture<RoleDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RoleDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
