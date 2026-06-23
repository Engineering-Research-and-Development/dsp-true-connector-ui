import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Constraint } from '../../models/permission';

@Component({
    selector: 'app-policy-details',
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatExpansionModule,
        MatIcon,
        MatTooltipModule,
    ],
    templateUrl: './policy-details.component.html',
    styleUrl: './policy-details.component.css'
})
export class PolicyDetailsComponent implements OnInit {
  policy!: any;
  loading = false;

  constructor(private router: Router, private location: Location) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.policy = navigation.extras.state['policy'];
    } else {
      this.goBack();
    }
  }

  ngOnInit(): void {}

  /**
   * Navigates back to the previous location.
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Checks if the policy has any constraints
   */
  hasConstraints(): boolean {
    return this.policy?.permission?.some((p: any) => p.constraint && p.constraint.length > 0);
  }

  /**
   * Gets the total number of constraints across all permissions
   */
  getTotalConstraints(): number {
    return this.policy?.permission?.reduce((total: number, p: any) => {
      return total + (p.constraint?.length || 0);
    }, 0) || 0;
  }

  /**
   * Formats operator text for better display
   */
  formatOperator(operator: string): string {
    if (!operator) return 'N/A';
    return operator.toUpperCase();
  }

  /**
   * Truncates text to a specified length with ellipsis
   */
  truncateText(text: string, length: number = 50): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  /**
   * Checks if a constraint is a date constraint
   */
  isDateConstraint(constraint: Constraint): boolean {
    return constraint.leftOperand === 'DATE_TIME';
    }
}
