import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { UserRole } from '../../models/enums/user-role.enum';
import { TenantService } from '../../services/tenant/tenant.service';
import { UserService } from '../../services/user/user.service';
import { UserManagementComponent } from './user-management.component';

class RouterMock {
  navigate = jasmine.createSpy('navigate');
}

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let tenantServiceSpy: jasmine.SpyObj<TenantService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'getCurrentUser',
      'deleteUser',
    ]);
    tenantServiceSpy = jasmine.createSpyObj('TenantService', [
      'getAllTenantsList',
    ]);

    userServiceSpy.getUsers.and.returnValue(
      of({
        response: {
          success: true,
          message: 'OK',
          data: {
            content: [
              {
                id: '1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                role: UserRole.ADMIN,
                tenantId: 'tenant-1',
                enabled: true,
                expired: false,
                locked: false,
              },
            ],
            page: {
              size: 20,
              totalElements: 1,
              totalPages: 1,
              number: 0,
            },
            links: [],
          },
          timestamp: new Date().toISOString(),
        },
      } as any)
    );
    userServiceSpy.getCurrentUser.and.returnValue(
      of({
        id: 'me',
        firstName: 'Me',
        lastName: 'User',
        email: 'me@example.com',
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
        enabled: true,
        expired: false,
        locked: false,
      })
    );
    tenantServiceSpy.getAllTenantsList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent, NoopAnimationsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: TenantService, useValue: tenantServiceSpy },
        { provide: Router, useClass: RouterMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(userServiceSpy.getUsers).toHaveBeenCalled();
    expect(component.users.length).toBe(1);
  });

  it('should navigate to details when adding a user', () => {
    const router = TestBed.inject(Router) as unknown as RouterMock;
    component.onAdd();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/user-management/details'],
      jasmine.any(Object)
    );
  });
});
