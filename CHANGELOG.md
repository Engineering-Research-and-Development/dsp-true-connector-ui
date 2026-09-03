# Changelog

All notable changes to this project will be documented in this file.

# [Unreleased]

### Added
- New Statistics Dashboard (`/dashboard`), now the application's landing page, showing negotiation, transfer, event, and runtime statistics from the backend `/api/v1/dashboard` endpoints. Includes KPI cards, negotiation/transfer state charts with role/state breakdown tables, a transfer format breakdown with download-flag status cards, a historical events timeline, a runtime panel, and a time-range/bucket (`hour`/`day`) selector with manual refresh.
- New **User Management** screen (`/user-management`) with listing, filtering, sorting, pagination, and create/view/edit/delete operations, reusing the Contract Negotiation card layout and Dataset details form pattern.
- `UserService` for backend communication with the `/users` API, including a `getCurrentUser()` call to `/api/v1/users/me`.
- `TenantService.getAllTenantsList()` to populate the user creation tenant dropdown.
- `UserRole` enum and `UserCreateRequest` / `UserUpdateRequest` models aligned with the backend contracts.
- Added delete guards that are preventing removal of the current user and the only enabled SUPER_ADMIN.
- Tenant management: card-based overview with filters, sorting and actions; new tenant create/view/edit detail page using reactive forms, edit-state tracking and S3 bucket credentials.
- Proactive JWT expiration check before every outgoing HTTP request in `authInterceptor`; the access token is refreshed automatically via the refresh token before it expires.
- Reactive 401 handling in `authInterceptor`: a single refresh-and-retry attempt on `401` responses, falling back to clearing the session and redirecting to `/login` (with `returnUrl`) if the retry also fails.
- Refresh-request de-duplication in `AuthService` so concurrent requests that all need a new token trigger only one `/auth/refresh` call.
- Silent session restore on app bootstrap (`AuthService.initSession()`, wired via `provideAppInitializer`) so a valid refresh token restores the session on page reload without forcing a re-login.

### Changed

- Statistics Dashboard negotiation and transfer state charts changed from bar charts to pie charts, each slice colored by a fixed semantic state color (`COMPLETED`/`FINALIZED` = green, `TERMINATED` = red, `SUSPENDED` = yellow, other states use distinct colors chosen to match the existing UI palette).
- The root route (`/`) now redirects to `/dashboard` instead of `/catalog-browser`; "Dashboard" is the first item in the sidenav.
- Added `ng2-charts` and `chart.js` as dependencies for dashboard chart rendering.
- Access token is now kept in memory only (never written to `localStorage`); the refresh token remains in `localStorage` so sessions still survive a browser restart. Any legacy `access_token` key left by a previous version is cleaned up automatically.
- `AuthService.refresh()`/`logout()` now send the refresh token as `refresh_token` (snake_case) to match the backend's `@JsonProperty("refresh_token")` contract; previously requests sent camelCase `refreshToken` and would fail backend validation.

### Fixed

- `auth.interceptor.spec.ts` and `auth.service.spec.ts` rewritten to cover the new expiry/refresh/dedup logic (previously the interceptor spec still tested the old Basic-auth behavior and the service spec had only a placeholder test).
- `login.component.spec.ts` now provides `HttpClient`/`Router`/`ActivatedRoute` test doubles required by `AuthService`/`LoginComponent`, fixing a pre-existing failure (the component construction previously depended on providers the spec never configured).

# [0.6.3] - 03-07-2026

### Added

- AI Agentic approach skills and instruction files for functional slicing, including workflow split, choice-first rule, UI slicing rules, required slice content, coverage audit, and do not do this sections.

### Changed

- Upgraded GitHub action versions for build and release workflows to latest stable versions.

# [0.6.2] - 08-04-2026

### Added

- `downloadInProgress` flag to the `DataTransfer` model to reflect backend in-progress download state
- `ensureTrackedAsDownloading` method in `DataTransferService` to sync the backend flag into in-memory state on page load/refresh

### Changed

- Download spinner in the Data Transfers component now considers both the in-memory tracking state and the backend `downloading` flag, so a page refresh no longer loses a download in progress
- `cleanupCompleted` in `DataTransferService` now also clears stale spinner state when the backend reports `downloading: false`, and persists the updated state to sessionStorage
- `fetchDataTransfers` resumes polling for transfers the backend marks as still downloading, eliminating the dependency on sessionStorage being present after a refresh

### Removed
- Removed DAPS

# [0.6.1] - 24-12-2025

### Changed

- View downloaded artifacts now opens the S3 presigned URL directly to avoid browser CORS/XHR failures.

# [0.6.0] - 25-11-2025

### Changed

- Catalog Management aligned with the DSP 2025-1 protocol specification
- Version increased from 0.2.X to 0.6.X to align with releases on BE for easier tracking of compatibility
- Major UI restyle in all components

# [0.2.3] - 10-11-2025

### Added

- Added support for HttpData-PUSH distribution, where logic for both provider/consumer response changed according to new BE implementation

### Changed

- Choosing distribution removed from Catalog Browser
- Removed Serves Dataset value from service overview and replaced with endpointURL
- Removed assignee from Dataset
- Removed Assignee, Assigner from Offer details in Contract Negotiation
- Flow for requesting datatransfer - user must choose distribution format
- Inital_data.json aligned with new data
- Rearranged side menu order in Catalog Management

# [0.2.2] - 03-11-2025

### Changed

- Fix bug with vertical scrolling

# [0.2.1] - 27-10-2025

### Added

- Support for changing main logo of the application for tailored projects directly from resources

### Changed

- Fix bug not getting catalog ID when sending PUT request for update
- Added section about importing custom logo in USER_MANUAL.md file

# [0.2.0] - 08-08-2025

### Added

- Connector configuration - related component and service to handle application properties management from UI
- Advanced search and pagination of Data Transfers with multiple filter criteria - related component and service to handle BE changes
- Advanced search and pagination of Contract Negotiations with multiple filter criteria - related component and service to handle BE changes
- Audit trail component with advanced search and pagination of Audit Events with multiple filter criteria - related component and service for new implemented feature
- Test coverage for new components
- Track and mark changes when editing Catalog, Datasets, Services and Distributions
- Data transfer state tracking to determine downloading spinner
- Notify user that download took longer time than expected, and it will continue in background

### Changed

- Routing now supports lazy loading
- Angular.json optimization tweaking
- Data-transfer-service and data-transfers-component to support async download on BE (added pooling to check the download status)
- CSS styling across whole application
- Aligned tests with new logic in services regarding pagination
- Fix missing things in docker folder (ENG-employee.json, properties, etc)
- Fix handling missing attributes from BE response
- Datatransfer download uses presigned S3 URL
- GHA Action for building develop to trigger after merge with master branch
- Fix "/" error when browsing remote catalogs
- Updated screenshots
- Updated USER_MANUAL.md

### Removed

- ConnectorDetails component - ConnectorConfiguration use instead

# [0.1.1] - 15-05-2025

### Changed

- Develop branch aligned with master

# [0.1.0] - 15-05-2025

### Added

- GHA for PR build, develop and release
- Test coverage for all services
- Drag and drop for adding artifacts files
- Adding external artifact (URL and authorization)
- New constraint support and input (Purpose, Spatial)
- Tooltips
- View downloaded artifact
- Cosmetic UI changes

### Changed

- Upgrade to Angular 19 from 17
- Upgrade 3rd party libraries
- Fix actions if data transfer is in suspend state

# [0.0.1] - 24-04-2025

### Added

- Catalog browser - fetch catalog data from other connectors and start contract negotiation
- Catalog management - create, modify, delete existing catalog data
- Service management - create, modify, delete existing service data
- Dataset management - create, modify, delete existing dataset data
- Distribution management - create, modify, delete existing distribution data
- Contract negotiation - manage contract negotiation as provider and as consumer
- Data transfers - manage data transfers as provider and as consumer
