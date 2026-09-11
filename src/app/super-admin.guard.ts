import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { UserRole } from './models/enums/user-role.enum';
import { UserService } from './services/user/user.service';

@Injectable({
  providedIn: 'root',
})
export class SuperAdminGuard implements CanActivate, CanActivateChild {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkSuperAdmin();
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    return this.checkSuperAdmin();
  }

  private checkSuperAdmin(): Observable<boolean | UrlTree> {
    return this.userService.getCurrentUser().pipe(
      take(1),
      map((user) =>
        user.role === UserRole.SUPER_ADMIN
          ? true
          : this.router.createUrlTree(['/catalog-browser'])
      ),
      catchError(() => of(this.router.createUrlTree(['/catalog-browser'])))
    );
  }
}
