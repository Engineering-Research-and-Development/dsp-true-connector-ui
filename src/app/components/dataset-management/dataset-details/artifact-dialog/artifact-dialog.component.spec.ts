import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  ArtifactDialogComponent,
  ArtifactDialogData,
} from './artifact-dialog.component';

import {
  MOCK_EXTERNAL_ARTIFACT_BASIC_AUTH,
  MOCK_EXTERNAL_ARTIFACT_BEARER_AUTH,
  MOCK_EXTERNAL_ARTIFACT_NO_AUTH,
  MOCK_EXTERNAL_ARTIFACT_OTHER_AUTH,
  MOCK_FILE_ARTIFACT,
} from '../../../../test-utils/test-utils';

function createMockDragEvent(files: File[] = []): DragEvent {
  const dataTransfer = new DataTransfer();
  if (files.length > 0) {
    files.forEach((file) => dataTransfer.items.add(file));
  }
  return {
    preventDefault: jasmine.createSpy('preventDefault'),
    stopPropagation: jasmine.createSpy('stopPropagation'),
    dataTransfer: dataTransfer,
  } as unknown as DragEvent;
}

describe('ArtifactDialogComponent', () => {
  let component: ArtifactDialogComponent;
  let fixture: ComponentFixture<ArtifactDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ArtifactDialogComponent>>;
  let mockDialogData: ArtifactDialogData;

  async function setupComponent(data: ArtifactDialogData) {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDialogData = data;

    await TestBed.configureTestingModule({
      imports: [ArtifactDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtifactDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Initialization', () => {
    it('should create with default values when no data is provided', async () => {
      await setupComponent({});
      expect(component).toBeTruthy();
      expect(component.artifactType).toBe('FILE');
      expect(component.selectedTabIndex).toBe(0);
      expect(component.selectedFile).toBeUndefined();
      expect(component.externalUrl).toBe('');
      expect(component.authorization).toBe('');
      expect(component.authType).toBe('none');
      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.bearerToken).toBe('');
    });

    it('should initialize for FILE artifact type', async () => {
      await setupComponent({ artifact: MOCK_FILE_ARTIFACT });
      expect(component.artifactType).toBe('FILE');
      expect(component.selectedTabIndex).toBe(0);
      expect(component.selectedFile).toBeUndefined();
      expect(component.externalUrl).toBe('');
    });

    it('should initialize for EXTERNAL artifact type (no auth)', async () => {
      await setupComponent({ artifact: MOCK_EXTERNAL_ARTIFACT_NO_AUTH });
      expect(component.artifactType).toBe('EXTERNAL');
      expect(component.selectedTabIndex).toBe(1);
      expect(component.externalUrl).toBe(MOCK_EXTERNAL_ARTIFACT_NO_AUTH.value);
      expect(component.authorization).toBe('');
      expect(component.authType).toBe('none');
    });

    it('should initialize for EXTERNAL artifact type (Basic Auth) and parse credentials', async () => {
      await setupComponent({ artifact: MOCK_EXTERNAL_ARTIFACT_BASIC_AUTH });
      expect(component.artifactType).toBe('EXTERNAL');
      expect(component.selectedTabIndex).toBe(1);
      expect(component.externalUrl).toBe(
        MOCK_EXTERNAL_ARTIFACT_BASIC_AUTH.value
      );
      expect(component.authorization).toBe(
        MOCK_EXTERNAL_ARTIFACT_BASIC_AUTH.authorization!
      );
      expect(component.authType).toBe('basic');
      expect(component.username).toBe('user');
      expect(component.password).toBe('pass');
      expect(component.bearerToken).toBe('');
    });

    it('should initialize for EXTERNAL artifact type (Bearer Auth) and parse token', async () => {
      await setupComponent({ artifact: MOCK_EXTERNAL_ARTIFACT_BEARER_AUTH });
      expect(component.artifactType).toBe('EXTERNAL');
      expect(component.selectedTabIndex).toBe(1);
      expect(component.externalUrl).toBe(
        MOCK_EXTERNAL_ARTIFACT_BEARER_AUTH.value
      );
      expect(component.authorization).toBe(
        MOCK_EXTERNAL_ARTIFACT_BEARER_AUTH.authorization!
      );
      expect(component.authType).toBe('bearer');
      expect(component.bearerToken).toBe('mytoken123');
      expect(component.username).toBe('');
      expect(component.password).toBe('');
    });

    it('should initialize for EXTERNAL artifact type (Other Auth) and treat as Bearer', async () => {
      await setupComponent({ artifact: MOCK_EXTERNAL_ARTIFACT_OTHER_AUTH });
      expect(component.artifactType).toBe('EXTERNAL');
      expect(component.selectedTabIndex).toBe(1);
      expect(component.externalUrl).toBe(
        MOCK_EXTERNAL_ARTIFACT_OTHER_AUTH.value
      );
      expect(component.authorization).toBe(
        MOCK_EXTERNAL_ARTIFACT_OTHER_AUTH.authorization!
      );
      expect(component.authType).toBe('bearer');
      expect(component.bearerToken).toBe(
        MOCK_EXTERNAL_ARTIFACT_OTHER_AUTH.authorization!
      );
      expect(component.username).toBe('');
      expect(component.password).toBe('');
    });
  });

  describe('Tab Switching (updateArtifactType)', () => {
    beforeEach(async () => {
      await setupComponent({});
    });

    it('should switch artifactType to EXTERNAL when tab index is 1', () => {
      component.updateArtifactType(1);
      expect(component.artifactType).toBe('EXTERNAL');
    });

    it('should switch artifactType to FILE when tab index is 0', () => {
      component.artifactType = 'EXTERNAL';
      component.updateArtifactType(0);
      expect(component.artifactType).toBe('FILE');
    });

    it('should reset external data when switching from External to File tab', () => {
      component.artifactType = 'EXTERNAL';
      component.externalUrl = 'http://test.com';
      component.authorization = 'Basic test';
      component.authType = 'basic';
      component.username = 'user';
      component.password = 'pass';
      component.bearerToken = 'token';
      component.bearerTokenHasDuplicate = true;

      component.updateArtifactType(0);

      expect(component.artifactType).toBe('FILE');
      expect(component.externalUrl).toBe('');
      expect(component.authorization).toBe('');
      expect(component.authType).toBe('none');
      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.bearerToken).toBe('');
      expect(component.bearerTokenHasDuplicate).toBeFalse();
    });

    it('should reset file data when switching from File to External tab', () => {
      component.artifactType = 'FILE';
      component.selectedFile = new File(['content'], 'file.txt');

      component.updateArtifactType(1);

      expect(component.artifactType).toBe('EXTERNAL');
      expect(component.selectedFile).toBeUndefined();
    });
  });

  describe('File Handling', () => {
    beforeEach(async () => {
      await setupComponent({});
    });

    it('onFileSelected should set selectedFile', () => {
      const mockFile = new File(['content'], 'test.txt');

      const inputElement = document.createElement('input');
      inputElement.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      inputElement.files = dataTransfer.files;

      const mockEvent = {
        target: inputElement,
      } as unknown as Event;

      component.onFileSelected(mockEvent);
      expect(component.selectedFile).toBe(mockFile);
    });

    it('onDragOver should prevent default and set isDragging to true', () => {
      const mockEvent = createMockDragEvent();
      component.onDragOver(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBeTrue();
    });

    it('onDragLeave should prevent default and set isDragging to false', () => {
      const mockEvent = createMockDragEvent();
      component.isDragging = true;
      component.onDragLeave(mockEvent);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBeFalse();
    });

    it('onDrop should prevent default, set isDragging to false, and set selectedFile', () => {
      const mockFile = new File(['dropped content'], 'dropped.png');
      const mockEvent = createMockDragEvent([mockFile]);
      component.isDragging = true;

      component.onDrop(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.isDragging).toBeFalse();
      expect(component.selectedFile).toBe(mockFile);
    });

    it('onDrop should handle no files dropped', () => {
      const mockEvent = createMockDragEvent();
      component.selectedFile = new File(['previous'], 'old.txt');
      component.isDragging = true;

      component.onDrop(mockEvent);

      expect(component.isDragging).toBeFalse();

      expect(component.selectedFile?.name).toBe('old.txt');
    });
  });

  describe('Authentication Handling', () => {
    beforeEach(async () => {
      await setupComponent({});
      component.artifactType = 'EXTERNAL';
      component.selectedTabIndex = 1;
    });

    it('onAuthTypeChange should reset auth fields', () => {
      component.authType = 'basic';
      component.username = 'user';
      component.password = 'pass';
      component.authorization = 'Basic dXNlcjpwYXNz';
      component.bearerToken = 'someToken';
      component.bearerTokenHasDuplicate = true;

      component.authType = 'bearer';
      component.onAuthTypeChange();

      expect(component.authorization).toBe('');
      expect(component.username).toBe('');
      expect(component.password).toBe('');
      expect(component.bearerToken).toBe('');
      expect(component.bearerTokenHasDuplicate).toBeFalse();

      component.authType = 'none';
      component.onAuthTypeChange();
      expect(component.authorization).toBe('');
    });

    it('updateBasicAuth should set authorization correctly', () => {
      component.authType = 'basic';
      component.username = 'testuser';
      component.password = 'testpass';
      component.updateBasicAuth();
      expect(component.authorization).toBe('Basic dGVzdHVzZXI6dGVzdHBhc3M=');
    });

    it('updateBasicAuth should clear authorization if username and password are empty', () => {
      component.authType = 'basic';
      component.authorization = 'Basic dXNlcjpwYXNz';
      component.username = '';
      component.password = '';
      component.updateBasicAuth();
      expect(component.authorization).toBe('');
    });

    it('updateBearerAuth should set authorization correctly (no prefix)', () => {
      component.authType = 'bearer';
      component.bearerToken = 'my-secret-token';
      component.updateBearerAuth();
      expect(component.authorization).toBe('Bearer my-secret-token');
      expect(component.bearerTokenHasDuplicate).toBeFalse();
    });

    it('updateBearerAuth should set authorization correctly (with prefix)', () => {
      component.authType = 'bearer';
      component.bearerToken = 'Bearer my-secret-token-already-prefixed   ';
      component.updateBearerAuth();
      expect(component.authorization).toBe(
        'Bearer my-secret-token-already-prefixed'
      );
      expect(component.bearerTokenHasDuplicate).toBeTrue();
    });

    it('updateBearerAuth should clear authorization if bearer token is empty', () => {
      component.authType = 'bearer';
      component.authorization = 'Bearer old-token';
      component.bearerTokenHasDuplicate = true;
      component.bearerToken = '';
      component.updateBearerAuth();
      expect(component.authorization).toBe('');
      expect(component.bearerTokenHasDuplicate).toBeFalse();
    });
  });

  describe('Dialog Actions (onSubmit, onCancel)', () => {
    beforeEach(async () => {
      await setupComponent({});
    });

    it('onCancel should close the dialog without data', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('onSubmit should close with FILE data if type is FILE and file is selected', () => {
      const mockFile = new File(['submit content'], 'submit.pdf');
      component.artifactType = 'FILE';
      component.selectedFile = mockFile;

      component.onSubmit();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        artifactType: 'FILE',
        file: mockFile,
      });
    });

    it('onSubmit should NOT close with FILE data if type is FILE and no file is selected', () => {
      component.artifactType = 'FILE';
      component.selectedFile = undefined;

      component.onSubmit();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('onSubmit should close with EXTERNAL data (no auth) if type is EXTERNAL and URL is provided', () => {
      component.artifactType = 'EXTERNAL';
      component.externalUrl = 'http://submit.com/data';
      component.authType = 'none';
      component.authorization = '';

      component.onSubmit();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        artifactType: 'EXTERNAL',
        filename: 'http://submit.com/data',
        authorization: undefined,
      });
    });

    it('onSubmit should close with EXTERNAL data (with auth) if type is EXTERNAL and URL/auth are provided', () => {
      component.artifactType = 'EXTERNAL';
      component.externalUrl = 'http://submit.com/secure';
      component.authType = 'bearer';
      component.bearerToken = 'submit-token';
      component.updateBearerAuth();

      component.onSubmit();

      expect(mockDialogRef.close).toHaveBeenCalledWith({
        artifactType: 'EXTERNAL',
        filename: 'http://submit.com/secure',
        authorization: 'Bearer submit-token',
      });
    });

    it('onSubmit should NOT close with EXTERNAL data if type is EXTERNAL and no URL is provided', () => {
      component.artifactType = 'EXTERNAL';
      component.externalUrl = '';

      component.onSubmit();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });
});
