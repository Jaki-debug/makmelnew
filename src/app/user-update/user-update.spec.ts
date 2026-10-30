import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserUpdate } from './user-update';

describe('UserUpdate', () => {
  let component: UserUpdate;
  let fixture: ComponentFixture<UserUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(UserUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
