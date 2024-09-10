import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractNegotiationComponent } from './contract-negotiation.component';

describe('ContractNegotiationComponent', () => {
  let component: ContractNegotiationComponent;
  let fixture: ComponentFixture<ContractNegotiationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractNegotiationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContractNegotiationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
