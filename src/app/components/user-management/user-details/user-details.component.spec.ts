import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/enums/user-role.enum';
import { TenantService } from '../../../services/tenant/tenant.service';
import { UserService } from '../../../services/user/user.service';
import { EditStateService } from '../../../shared/edit-state.service';
import { UserDetailsComponent } from './user-details.component';

class RouterMock {
  getCurrentNavigation = jasmine.createSpy('getCurrentNavigation').and.returnValue({
    extras: { state: { user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: UserRole.ADMIN, tenantId: 't1', enabled: true, expired: false, locked: false } as User } },
  });
  navigate = jasmine.createSpy('navigate');
}

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let tenantServiceSpy: jasmine.SpyObj<TenantService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', [
      'createUser',
      'updateUser',
    ]);
    tenantServiceSpy = jasmine.createSpyObj('TenantService', [
      'getAllTenantsList',
    ]);
    tenantServiceSpy.getAllTenantsList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UserDetailsComponent, NoopAnimationsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: TenantService, useValue: tenantServiceSpy },
        { provide: Router, useClass: RouterMock },
        EditStateService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be in view mode by default', () => {
    expect(component.editMode).toBeFalse();
  });
});
