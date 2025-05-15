export enum DataTransferState {
  INITIALIZED = 'INITIALIZED',
  REQUESTED = 'REQUESTED',
  STARTED = 'STARTED',
  TERMINATED = 'TERMINATED',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
}

// Define the mapping of state transitions
const transferStateTransitions: Record<DataTransferState, DataTransferState[]> =
  {
    [DataTransferState.INITIALIZED]: [DataTransferState.REQUESTED],
    [DataTransferState.REQUESTED]: [
      DataTransferState.STARTED,
      DataTransferState.TERMINATED,
    ],
    [DataTransferState.STARTED]: [
      DataTransferState.SUSPENDED,
      DataTransferState.COMPLETED,
      DataTransferState.TERMINATED,
    ],
    [DataTransferState.TERMINATED]: [],
    [DataTransferState.COMPLETED]: [],
    [DataTransferState.SUSPENDED]: [
      DataTransferState.STARTED,
      DataTransferState.TERMINATED,
    ],
  };

// Get the next possible states for a given state
export function getNextStates(state: DataTransferState): DataTransferState[] {
  return transferStateTransitions[state] || [];
}

// Check if a transition between two states is valid
export function canTransitTo(
  currentState: DataTransferState,
  targetState: DataTransferState
): boolean {
  return getNextStates(currentState).includes(targetState);
}
