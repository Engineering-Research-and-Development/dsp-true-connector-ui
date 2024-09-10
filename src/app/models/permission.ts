export interface Permission {
  assigner: string;
  assignee: string;
  action: string;
  constraint: Constraint[];
  target?: string;
}

export interface Constraint {
  leftOperand: string;
  rightOperand: string;
  operator: string;
}
