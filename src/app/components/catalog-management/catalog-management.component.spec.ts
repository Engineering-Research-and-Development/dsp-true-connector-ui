import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogManagementComponent } from './catalog-management.component';

describe('CatalogManagementComponent', () => {
  let component: CatalogManagementComponent;
  let fixture: ComponentFixture<CatalogManagementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CatalogManagementComponent]
    });
    fixture = TestBed.createComponent(CatalogManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
