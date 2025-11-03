export interface Permission {
  readonly type?: string;
  assigner?: string;
  assignee?: string;
  action: string;
  constraint?: Constraint[];
  target?: string;
}

export interface Constraint {
  leftOperand: string;
  rightOperand: string;
  operator: string;
}
