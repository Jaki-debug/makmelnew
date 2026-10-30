import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientPasserCommandesDetail } from './client-passer-commandes-detail';

describe('ClientPasserCommandesDetail', () => {
  let component: ClientPasserCommandesDetail;
  let fixture: ComponentFixture<ClientPasserCommandesDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientPasserCommandesDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPasserCommandesDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
