import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectorDetailsComponent } from './connector-details.component';

describe('ConnectorDetailsComponent', () => {
  let component: ConnectorDetailsComponent;
  let fixture: ComponentFixture<ConnectorDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectorDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
