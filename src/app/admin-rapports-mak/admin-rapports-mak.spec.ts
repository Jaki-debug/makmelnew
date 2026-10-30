import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRapportsMak } from './admin-rapports-mak';

describe('AdminRapportsMak', () => {
  let component: AdminRapportsMak;
  let fixture: ComponentFixture<AdminRapportsMak>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminRapportsMak],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRapportsMak);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
