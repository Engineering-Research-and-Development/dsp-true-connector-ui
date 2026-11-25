import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth/auth.service';
import { safeLocalReturnUrl } from './services/auth/auth-navigation';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // If already logged in, redirect to the requested safe local page.
    if (this.authService.isAuthenticated) {
      return this.router.parseUrl(
        safeLocalReturnUrl(route.queryParams['returnUrl'])
      );
    }
    
    // Allow access to login page for unauthenticated users
    return true;
  }
}