import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth/auth.service';

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
export class AppComponent implements OnInit {
  title = 'TRUE Connector UI';
  appVersion = environment.APP_VERSION;
  currentYear = new Date().getFullYear();
  hasCustomLogo = environment.CUSTOM_LOGO_PRESENT === 'true';
  isExpanded = true;
  
  // Track login state dynamically
  isUserLoggedIn = false;

  userName: string = '';

  currentUserType: 'provider' | 'consumer' | null = null;
  selectedMultipartType = localStorage.getItem('multipartType') || 'form';

  // Track active routes for parent menu items
  catalogBrowserActive = false;
  catalogManagementActive = false;
  serviceManagementActive = false;
  distributionManagementActive = false;
  datasetManagementActive = false;

  @ViewChild('providerPanel') providerPanel!: MatExpansionPanel;
  @ViewChild('consumerPanel') consumerPanel!: MatExpansionPanel;
  @ViewChild('catalogManagementPanel') catalogManagementPanel!: MatExpansionPanel;
  @ViewChild('contractNegotiationPanel') contractNegotiationPanel!: MatExpansionPanel;
  @ViewChild('dataTransfersPanel') dataTransfersPanel!: MatExpansionPanel;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    public authService: AuthService,
    private matIconReg: MatIconRegistry
  ) {}

  ngOnInit() {
    this.matIconReg.setDefaultFontSetClass('material-symbols-outlined');

    // Dynamically update isUserLoggedIn based on accessToken$ stream
    this.authService.accessToken$.subscribe((token) => {
      this.isUserLoggedIn = !!token;
    });

    // Track route changes to update active parent menu items
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveMenuItems(event.urlAfterRedirects);
      });

    this.updateActiveMenuItems(this.router.url);
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

    // Check which specific route is active
    if (url.includes('/catalog-browser')) {
      this.catalogBrowserActive = true;
      this.closeAllPanels();
    } else if (url === '/catalog-management') {
      this.catalogManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (url === '/catalog-management/service-management' ||
        url.startsWith('/catalog-management/service-management/')) {
      this.serviceManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (url === '/catalog-management/distribution-management' ||
               url.startsWith('/catalog-management/distribution-management/')) {
      this.distributionManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (url === '/catalog-management/dataset-management' ||
               url.startsWith('/catalog-management/dataset-management/')) {
      this.datasetManagementActive = true;
      this.closeAllPanels();
      this.catalogManagementPanel?.open();
    } else if (url.includes('/contract-negotiation')) {
      this.closeAllPanels();
      this.contractNegotiationPanel?.open();
    } else if (url.includes('/data-transfer')) {
      this.closeAllPanels();
      this.dataTransfersPanel?.open();
    } else if (url.includes('/audit-trail') || url.includes('/connector-configuration')) {
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