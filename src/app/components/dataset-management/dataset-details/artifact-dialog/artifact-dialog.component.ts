// artifact-dialog.component.ts
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { Artifact } from '../../../../models/artifact';

export interface ArtifactDialogData {
  artifact?: Artifact;
}

@Component({
  selector: 'app-artifact-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatRadioModule,
  ],
  templateUrl: './artifact-dialog.component.html',
  styleUrls: ['./artifact-dialog.component.css'],
})
export class ArtifactDialogComponent {
  selectedFile: File | undefined;
  artifactType: 'FILE' | 'EXTERNAL' = 'FILE';
  externalUrl: string = '';
  authorization: string = '';
  selectedTabIndex: number = 0;
  isDragging: boolean = false;

  // New auth properties
  authType: 'none' | 'basic' | 'bearer' = 'none';
  username: string = '';
  password: string = '';
  bearerToken: string = '';
  bearerTokenHasDuplicate: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ArtifactDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { artifact?: Artifact }
  ) {
    // Initialize with existing artifact data if available
    if (data.artifact) {
      this.artifactType = data.artifact.artifactType;

      if (this.artifactType === 'EXTERNAL') {
        this.externalUrl = data.artifact.value; // URL is stored in filename

        // Try to parse authorization if it exists
        if (data.artifact.authorization) {
          this.authorization = data.artifact.authorization;
          this.parseExistingAuthorization();
        }

        this.selectedTabIndex = 1; // Set to External URL tab
      } else {
        this.selectedTabIndex = 0; // Set to Upload File tab
      }
    }
  }

  /**
   * Parses the existing authorization string to extract username, password, and token.
   * Handles Basic and Bearer authentication types.
   * If the authorization string is not in a recognized format, it sets the authType to 'bearer' and uses the whole string as the token.
   * This method is called when the component is initialized and an artifact is provided.
   */
  parseExistingAuthorization(): void {
    if (this.authorization.startsWith('Basic ')) {
      this.authType = 'basic';
      // Decode the base64 token to extract username and password
      try {
        const base64Credentials = this.authorization.substring(6); // Remove 'Basic ' prefix
        const decodedCredentials = atob(base64Credentials);
        const [username, password] = decodedCredentials.split(':');
        this.username = username || '';
        this.password = password || '';
      } catch (error) {
        console.error('Failed to decode Basic auth credentials:', error);
        // If decoding fails, leave the fields empty
        this.username = '';
        this.password = '';
      }
    } else if (this.authorization.startsWith('Bearer ')) {
      this.authType = 'bearer';
      this.bearerToken = this.authorization.substring(7); // Remove 'Bearer ' prefix
    } else if (this.authorization) {
      // If there's an authorization that doesn't match patterns,
      // set bearer and use the whole string
      this.authType = 'bearer';
      this.bearerToken = this.authorization;
    }
  }

  /**
   * Handles tab change event and updates the artifact type accordingly.
   * Resets the data when switching between tabs.
   * @param tabIndex The index of the selected tab (0 for Upload File, 1 for External URL).
   */
  updateArtifactType(tabIndex: number) {
    // Reset data when switching tabs
    if (tabIndex === 0 && this.artifactType === 'EXTERNAL') {
      // Switching to file tab, reset external data
      this.externalUrl = '';
      this.authorization = '';
      this.authType = 'none';
      this.username = '';
      this.password = '';
      this.bearerToken = '';
      this.bearerTokenHasDuplicate = false;
    } else if (tabIndex === 1 && this.artifactType === 'FILE') {
      // Switching to external tab, reset file data
      this.selectedFile = undefined;
    }

    this.artifactType = tabIndex === 0 ? 'FILE' : 'EXTERNAL';
  }

  /**
   * Handles the change event of the authentication type radio buttons.
   * Resets the authorization and relevant fields when changing auth type.
   * @param event The change event from the radio button group.
   */
  onAuthTypeChange(): void {
    // Reset authorization when changing auth type
    this.authorization = '';
    this.username = '';
    this.password = '';
    this.bearerToken = '';
    this.bearerTokenHasDuplicate = false;
  }

  /**
   * Updates the basic authentication string based on the provided username and password.
   * Encodes the credentials in base64 format and sets the authorization string.
   */
  updateBasicAuth(): void {
    if (this.username || this.password) {
      const token = btoa(`${this.username}:${this.password}`);
      this.authorization = `Basic ${token}`;
    } else {
      this.authorization = '';
    }
  }

  /**
   * Updates the authorization string for Bearer authentication.
   * Checks if the user has included 'Bearer ' prefix and sets the flag accordingly.
   * If the bearer token is empty, it clears the authorization string.
   * */
  updateBearerAuth(): void {
    if (this.bearerToken) {
      // Check if user already included 'Bearer ' prefix
      if (this.bearerToken.trim().startsWith('Bearer ')) {
        this.bearerTokenHasDuplicate = true;
        this.authorization = this.bearerToken.trim();
      } else {
        this.bearerTokenHasDuplicate = false;
        this.authorization = `Bearer ${this.bearerToken.trim()}`;
      }
    } else {
      this.authorization = '';
      this.bearerTokenHasDuplicate = false;
    }
  }

  /**
   * Handles the file selection event when a file is selected from the file input.
   * Sets the selected file to the component state.
   * @param event The change event from the file input.
   */
  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile = inputElement.files[0];
    }
  }

  /**
   * Handles the drag over event when a file is dragged over the dialog.
   * Prevents default behavior and sets the dragging state to true.
   * @param event The drag event.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Handles the drag enter event when a file is dragged over the dialog.
   * Prevents default behavior and sets the dragging state to false.
   * @param event The drag event.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Handles the drop event when a file is dragged and dropped into the dialog.
   * Prevents default behavior and sets the selected file.
   * @param event The drag event containing the dropped file.
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  /**
   * Handles the submit button click event and closes the dialog with the selected artifact data.
   * If the artifact type is FILE, it includes the selected file.
   * If the artifact type is EXTERNAL, it includes the external URL and authorization if provided.
   * */
  onSubmit(): void {
    console.log('Submitting artifact:', this.authorization);
    console.log('Submitting artifact:', this.artifactType.toLowerCase);
    if (this.artifactType === 'FILE' && this.selectedFile) {
      this.dialogRef.close({
        artifactType: 'FILE',
        file: this.selectedFile,
      });
    } else if (this.artifactType === 'EXTERNAL' && this.externalUrl) {
      this.dialogRef.close({
        artifactType: 'EXTERNAL',
        filename: this.externalUrl,
        authorization: this.authorization || undefined,
      });
    }
  }

  /**
   * Handles the cancel button click event and closes the dialog without saving.
   * */
  onCancel(): void {
    this.dialogRef.close();
  }
}
