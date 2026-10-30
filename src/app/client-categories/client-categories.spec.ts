import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientCategories } from './client-categories';

describe('ClientCategories', () => {
  let component: ClientCategories;
  let fixture: ComponentFixture<ClientCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientCategories],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
