import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ApplicationProperty } from '../../models/applicationProperty';
import { ApplicationPropertiesService } from '../../services/application-properties/application-properties.service';

@Component({
  selector: 'app-connector-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatTooltipModule,
    NgxSkeletonLoaderModule,
  ],
  templateUrl: './connector-configuration.component.html',
  styleUrl: './connector-configuration.component.css',
})
export class ConnectorConfigurationComponent implements OnInit {
  properties: ApplicationProperty[] = [];
  loading = false;
  hasChanges = false;

  // Track original values to detect changes
  private originalValues = new Map<string, string>();

  constructor(
    private applicationPropertiesService: ApplicationPropertiesService
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  /**
   * Load properties from the backend
   */
  loadProperties(): void {
    this.loading = true;
    this.applicationPropertiesService.getProperties().subscribe({
      next: (properties) => {
        this.properties = properties;
        this.storeOriginalValues();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.loading = false;
      },
    });
  }

  /**
   * Store original values to track changes
   */
  private storeOriginalValues(): void {
    this.originalValues.clear();
    this.properties.forEach((property) => {
      this.originalValues.set(property.key, property.value);
    });
    this.hasChanges = false;
  }

  /**
   * Check if property value is boolean
   */
  isBooleanProperty(property: ApplicationProperty): boolean {
    const value = property.value.toLowerCase();
    return value === 'true' || value === 'false';
  }

  /**
   * Get boolean value for toggle switches
   */
  getBooleanValue(property: ApplicationProperty): boolean {
    return property.value.toLowerCase() === 'true';
  }

  /**
   * Handle toggle change for boolean properties
   */
  onToggleChange(property: ApplicationProperty, value: boolean): void {
    property.value = value.toString();
    this.checkForChanges();
  }

  /**
   * Handle text input change
   */
  onPropertyChange(): void {
    this.checkForChanges();
  }

  /**
   * Check if there are any changes from original values
   */
  private checkForChanges(): void {
    this.hasChanges = this.properties.some(
      (property) => this.originalValues.get(property.key) !== property.value
    );
  }

  /**
   * Check if a specific property has been modified
   */
  isPropertyModified(property: ApplicationProperty): boolean {
    return this.originalValues.get(property.key) !== property.value;
  }

  /**
   * Save all changes
   */
  saveChanges(): void {
    if (!this.hasChanges) {
      return;
    }

    // Only send changed properties
    const changedProperties = this.properties.filter(
      (property) => this.originalValues.get(property.key) !== property.value
    );

    if (changedProperties.length === 0) {
      return;
    }

    this.loading = true;
    this.applicationPropertiesService
      .updateProperties(changedProperties)
      .subscribe({
        next: (updatedProperties) => {
          // Update the local properties with the response
          this.properties = updatedProperties;
          this.storeOriginalValues();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating properties:', error);
          this.loading = false;
        },
      });
  }

  /**
   * Cancel changes and revert to original values
   */
  cancelChanges(): void {
    this.properties.forEach((property) => {
      const originalValue = this.originalValues.get(property.key);
      if (originalValue !== undefined) {
        property.value = originalValue;
      }
    });
    this.hasChanges = false;
  }

  /**
   * Get property group with fallback logic
   */
  getPropertyGroup(property: ApplicationProperty): string {
    if (property.group) {
      return property.group;
    }
    // Fallback: determine group based on property key patterns
    const key = property.key.toLowerCase();
    if (key.includes('daps')) {
      return 'DAPS';
    }
    if (
      key.includes('authentication') ||
      key.includes('security') ||
      key.includes('protocol')
    ) {
      return 'Security';
    }
    // Default fallback
    return 'General';
  }

  /**
   * Get property label with fallback logic
   */
  getPropertyLabel(property: ApplicationProperty): string {
    if (property.label) {
      return property.label;
    }
    // Fallback: create readable name from key
    const parts = property.key.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  /**
   * Get property tooltip with fallback logic
   */
  getPropertyTooltip(property: ApplicationProperty): string {
    if (property.tooltip) {
      return property.tooltip;
    }
    // Fallback: show property key as tooltip
    return `Configuration property: ${property.key}`;
  }

  /**
   * Group properties by their group field
   */
  get groupedProperties(): { [group: string]: ApplicationProperty[] } {
    const groups: { [group: string]: ApplicationProperty[] } = {};

    this.properties.forEach((property) => {
      const group = this.getPropertyGroup(property);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(property);
    });

    return groups;
  }

  /**
   * Get the keys of grouped properties for iteration
   */
  get groupKeys(): string[] {
    return Object.keys(this.groupedProperties).sort();
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByKey(index: number, property: ApplicationProperty): string {
    return property.key;
  }
}
