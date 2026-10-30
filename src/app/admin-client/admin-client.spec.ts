import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminClient } from './admin-client';

describe('AdminClient', () => {
  let component: AdminClient;
  let fixture: ComponentFixture<AdminClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminClient],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
