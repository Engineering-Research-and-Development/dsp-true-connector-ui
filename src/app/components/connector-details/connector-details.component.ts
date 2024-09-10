import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-connector-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connector-details.component.html',
  styleUrl: './connector-details.component.css',
})
export class ConnectorDetailsComponent implements OnInit {
  ngOnInit(): void {}
}
