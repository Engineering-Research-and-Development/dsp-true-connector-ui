import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-policy-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatExpansionModule,
    MatIcon,
  ],
  templateUrl: './policy-details.component.html',
  styleUrl: './policy-details.component.css',
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
   * */
  goBack(): void {
    this.location.back();
  }
}
