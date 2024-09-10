import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogBrowserDetailsComponent } from './catalog-browser-details.component';

describe('CatalogBrowserDetailsComponent', () => {
  let component: CatalogBrowserDetailsComponent;
  let fixture: ComponentFixture<CatalogBrowserDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogBrowserDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CatalogBrowserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
