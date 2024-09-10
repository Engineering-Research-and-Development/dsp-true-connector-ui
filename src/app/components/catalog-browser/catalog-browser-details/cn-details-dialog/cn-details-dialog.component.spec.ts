import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CnDetailsDialogComponent } from './cn-details-dialog.component';

describe('CnDetailsDialogComponent', () => {
  let component: CnDetailsDialogComponent;
  let fixture: ComponentFixture<CnDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CnDetailsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CnDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
