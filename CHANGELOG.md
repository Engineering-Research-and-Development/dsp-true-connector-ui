# Changelog

All notable changes to this project will be documented in this file.

# [0.1.3] - 20-06-2025

### Added

- Connector configuration - related component and service to handle application properties management from UI

### Changed

- Routing now supports lazy loading
- Angular.json optimization tweaking

### Removed

- ConnectorDetails component - ConnectorConfiguration use instead

# [0.1.2] - 04-06-2025

### Added

- Data transfer state tracking to determine downloading spinner
- Notify user that download took longer time than expected, and it will continue in background

### Changed

- Datatransfer download uses presigned S3 URL
- GHA Action for building develop to trigger after merge with master branch
- Fix "/" error when browsing remote catalogs

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
