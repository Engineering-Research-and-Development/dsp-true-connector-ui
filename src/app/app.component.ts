import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  MatExpansionModule,
  MatExpansionPanel,
} from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth/auth.service';
import { User } from './models/user';
import { UserRole } from './models/enums/user-role.enum';
import { LogoTrimHelper } from './shared/utils/logo-trim.utils';

/** Height a toolbar logo without distinct lettering is shown at, matching the bundled company logo. */
const LOGO_HEIGHT = 35;
/** Height a logo's lettering is shown at: the capital height of the toolbar label's 21px Arial. */
const LOGO_TEXT_HEIGHT = 15;
/** No logo is shown taller than this, so it stays inside the toolbar. */
const MAX_LOGO_HEIGHT = 48;

type Logo = 'company' | 'project';

/** How a logo is cropped to its visible part, in CSS pixels. */
interface LogoTrim {
  frameWidth: number;
  /** From the top of the visible part down to the lettering's baseline. */
  frameHeight: number;
  /** Lets the artwork below the baseline (the frame's bottom) show while clipping padding. */
  frameClipPath: string;
  imageHeight: number;
  imageLeft: number;
  imageTop: number;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatExpansionModule,
    RouterOutlet,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'TRUE Connector UI';
  appVersion = environment.APP_VERSION;
  currentYear = new Date().getFullYear();
  showCompanyLogo = environment.COMPANY_LOGO_PRESENT === 'true';
  showProjectLogo = environment.PROJECT_LOGO_PRESENT === 'true';
  logoTrims: Partial<Record<Logo, LogoTrim>> = {};
  // Ignore the literal placeholder in case the startup script didn't replace it
  projectLabel = environment.PROJECT_LABEL.endsWith('_PLACEHOLDER')
    ? ''
    : environment.PROJECT_LABEL.trim();
  isExpanded = true;
  
  // Track login state dynamically
  isUserLoggedIn = false;

  currentUser: User | null = null;

  isSuperAdmin(): boolean {
    return this.currentUser?.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Greeting shown next to the user menu, e.g. "Hello, John Doe (ACME)".
   * The tenant part is dropped when there is none; empty when there are no names.
   */
  get greeting(): string {
    const fullName = [this.currentUser?.firstName, this.currentUser?.lastName]
      .filter((part) => !!part?.trim())
      .join(' ');
    if (!fullName) {
      return '';
    }
    const tenantName = this.currentUser?.tenantName?.trim();
    return tenantName
      ? `Hello, ${fullName} (${tenantName})`
      : `Hello, ${fullName}`;
  }

  selectedMultipartType = localStorage.getItem('multipartType') || 'form';

  // Track active routes for parent menu items
  catalogBrowserActive = false;
  catalogManagementActive = false;
  serviceManagementActive = false;
  distributionManagementActive = false;
  datasetManagementActive = false;
  userManagementActive = false;

  @ViewChild('providerPanel') providerPanel!: MatExpansionPanel;
  @ViewChild('consumerPanel') consumerPanel!: MatExpansionPanel;
  @ViewChild('catalogManagementPanel') catalogManagementPanel!: MatExpansionPanel;
  @ViewChild('contractNegotiationPanel') contractNegotiationPanel!: MatExpansionPanel;
  @ViewChild('dataTransfersPanel') dataTransfersPanel!: MatExpansionPanel;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private router: Router,
    public authService: AuthService,
    private matIconReg: MatIconRegistry
  ) {}

  ngOnInit() {
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');

    // Login state and user info are both derived from the access token
    this.authService.accessToken$
      .pipe(takeUntil(this.destroy$))
      .subscribe((token) => {
        this.isUserLoggedIn = !!token;
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });

    // Track route changes to update active parent menu items
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.updateActiveMenuItems(event.urlAfterRedirects);
      });

    this.updateActiveMenuItems(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update active menu items based on current route
   */
  updateActiveMenuItems(url: string) {
    // Reset all flags
    this.catalogBrowserActive = false;
    this.catalogManagementActive = false;
    this.serviceManagementActive = false;
    this.distributionManagementActive = false;
    this.datasetManagementActive = false;
    this.userManagementActive = false;

    // Check which specific route is active
    if (url.includes('/catalog-browser')) {
      this.catalogBrowserActive = true;
      this.closeAllPanels();
    } else if (url === '/catalog-management') {
      this.catalogManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (
      url === '/catalog-management/service-management' ||
      url.startsWith('/catalog-management/service-management/')
    ) {
      this.serviceManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (
      url === '/catalog-management/distribution-management' ||
      url.startsWith('/catalog-management/distribution-management/')
    ) {
      this.distributionManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (
      url === '/catalog-management/dataset-management' ||
      url.startsWith('/catalog-management/dataset-management/')
    ) {
      this.datasetManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (
      url === '/user-management' ||
      url.startsWith('/user-management/')
    ) {
      this.userManagementActive = true;
      this.closeAllPanels();
    } else if (url.includes('/contract-negotiation')) {
      this.closeAllPanels();
      this.contractNegotiationPanel?.open();
    } else if (url.includes('/data-transfer')) {
      this.closeAllPanels();
      this.dataTransfersPanel?.open();
    } else if (
      url.includes('/audit-trail') ||
      url.includes('/connector-configuration')
    ) {
      this.closeAllPanels();
    }
  }

  /**
   * Close all expansion panels
   */
  private closeAllPanels() {
    this.catalogManagementPanel?.close();
    this.contractNegotiationPanel?.close();
    this.dataTransfersPanel?.close();
  }

  /**
   * Toggles the state of the side navigation.
   */
  toggleSidenav() {
    this.isExpanded = !this.isExpanded;
  }

  /**
   * Crops a loaded logo's transparent padding on screen (the file is untouched) and sizes it by
   * its lettering, so every logo's text has the label's capital height and sits on the label's
   * baseline, whatever artwork sticks out around it. A logo without distinct lettering is shown
   * at the common logo height, resting on the baseline. The logo stays untrimmed when it cannot
   * be measured.
   */
  trimLogo(logo: Logo, image: HTMLImageElement) {
    const measurement = LogoTrimHelper.measureLogo(image);
    if (!measurement) {
      return;
    }
    const { visible, text } = measurement;
    const scale = Math.min(
      text ? LOGO_TEXT_HEIGHT / text.height : LOGO_HEIGHT / visible.height,
      MAX_LOGO_HEIGHT / visible.height
    );
    const visibleBottom = visible.top + visible.height;
    const baseline = text ? text.top + text.height : visibleBottom;
    this.logoTrims[logo] = {
      frameWidth: visible.width * scale,
      frameHeight: (baseline - visible.top) * scale,
      frameClipPath: `inset(0 0 -${(visibleBottom - baseline) * scale}px 0)`,
      imageHeight: image.naturalHeight * scale,
      imageLeft: -visible.left * scale,
      imageTop: -visible.top * scale,
    };
  }

  /**
   * Hides a logo that failed to load, so no broken-image icon is shown.
   */
  hideLogo(logo: Logo) {
    if (logo === 'company') {
      this.showCompanyLogo = false;
    } else {
      this.showProjectLogo = false;
    }
  }

  /**
   * Logs out the user by clearing authentication tokens and navigating to the login page.
   */
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed', error);
        this.router.navigate(['/login']);
      }
    });
  }

  goToProviderContractNegotiation() {
    this.forceReload('/contract-negotiation', { userType: 'provider' });
  }

  goToConsumerContractNegotiation() {
    this.forceReload('/contract-negotiation', { userType: 'consumer' });
  }

  goToProviderDataTransfers() {
    this.forceReload('/data-transfer', { userType: 'provider' });
  }

  goToConsumerDataTransfers() {
    this.forceReload('/data-transfer', { userType: 'consumer' });
  }

  goToDataConsumption() {
    this.router.navigate(['/data-consumption']);
  }

  private forceReload(targetUrl: string, state: any) {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([targetUrl], { state });
    });
  }
}
