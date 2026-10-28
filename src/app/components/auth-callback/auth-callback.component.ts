import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import {
  KEYCLOAK_CALLBACK_PATH,
  KEYCLOAK_RETURN_URL_STORAGE_KEY,
  safeLocalReturnUrl,
} from '../../services/auth/auth-navigation';
import { KEYCLOAK_SELECTION_STORAGE_KEY } from '../../services/auth/keycloak-auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  isProcessing = true;
  errorMessage: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly location: Location
  ) {}

  ngOnInit(): void {
    void this.completeSignIn();
  }

  returnToLogin(): void {
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private async completeSignIn(): Promise<void> {
    const savedSelection = sessionStorage.getItem(
      KEYCLOAK_SELECTION_STORAGE_KEY
    );
    if (!savedSelection) {
      this.failSignIn();
      return;
    }

    let accessToken: string | null;
    try {
      accessToken = await firstValueFrom(this.authService.initSession());
    } catch {
      accessToken = null;
    }

    if (!accessToken || !this.authService.isAuthenticated) {
      this.failSignIn();
      return;
    }

    const returnUrl = safeLocalReturnUrl(
      sessionStorage.getItem(KEYCLOAK_RETURN_URL_STORAGE_KEY)
    );
    sessionStorage.removeItem(KEYCLOAK_RETURN_URL_STORAGE_KEY);
    this.isProcessing = false;
    await this.router.navigateByUrl(returnUrl, { replaceUrl: true });
  }

  private failSignIn(): void {
    sessionStorage.removeItem(KEYCLOAK_SELECTION_STORAGE_KEY);
    sessionStorage.removeItem(KEYCLOAK_RETURN_URL_STORAGE_KEY);
    this.location.replaceState(KEYCLOAK_CALLBACK_PATH);
    this.errorMessage =
      'Sign-in could not be completed. Please return to login and try again.';
    this.isProcessing = false;
  }
}
