export enum ContractNegotiationState {
  REQUESTED = 'REQUESTED',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  AGREED = 'AGREED',
  VERIFIED = 'VERIFIED',
  FINALIZED = 'FINALIZED',
  TERMINATED = 'TERMINATED',
}

export class ContractNegotiationStateHelper {
  private static readonly ENUM_MAP: Map<string, ContractNegotiationState> =
    new Map(
      Object.values(ContractNegotiationState).map((state) => [
        state.toLowerCase(),
        state,
      ])
    );

  static nextState(
    state: ContractNegotiationState
  ): ContractNegotiationState[] {
    switch (state) {
      case ContractNegotiationState.REQUESTED:
        return [
          ContractNegotiationState.OFFERED,
          ContractNegotiationState.AGREED,
          ContractNegotiationState.TERMINATED,
        ];
      case ContractNegotiationState.OFFERED:
        return [
          ContractNegotiationState.REQUESTED,
          ContractNegotiationState.ACCEPTED,
          ContractNegotiationState.TERMINATED,
        ];
      case ContractNegotiationState.ACCEPTED:
        return [
          ContractNegotiationState.AGREED,
          ContractNegotiationState.TERMINATED,
        ];
      case ContractNegotiationState.AGREED:
        return [
          ContractNegotiationState.VERIFIED,
          ContractNegotiationState.TERMINATED,
        ];
      case ContractNegotiationState.VERIFIED:
        return [
          ContractNegotiationState.FINALIZED,
          ContractNegotiationState.TERMINATED,
        ];
      case ContractNegotiationState.FINALIZED:
        return [];
      case ContractNegotiationState.TERMINATED:
        return [];
      default:
        return [];
    }
  }

  static fromContractNegotiationState(
    state: string
  ): ContractNegotiationState | undefined {
    return this.ENUM_MAP.get(state.toLowerCase());
  }

  static canTransitTo(
    currentState: ContractNegotiationState,
    nextState: ContractNegotiationState
  ): boolean {
    return this.nextState(currentState).includes(nextState);
  }
}
