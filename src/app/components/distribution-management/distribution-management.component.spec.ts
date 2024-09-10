import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributionManagementComponent } from './distribution-management.component';

describe('DistributionManagementComponent', () => {
  let component: DistributionManagementComponent;
  let fixture: ComponentFixture<DistributionManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributionManagementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DistributionManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
