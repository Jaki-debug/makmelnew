import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientPanierArticleActions } from './client-panier-article-actions';

describe('ClientPanierArticleActions', () => {
  let component: ClientPanierArticleActions;
  let fixture: ComponentFixture<ClientPanierArticleActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientPanierArticleActions],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientPanierArticleActions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
