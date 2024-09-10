import { TestBed } from '@angular/core/testing';

import { ContractNegotiationService } from './contract-negotiation.service';

describe('ContractNegotiationService', () => {
  let service: ContractNegotiationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContractNegotiationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
