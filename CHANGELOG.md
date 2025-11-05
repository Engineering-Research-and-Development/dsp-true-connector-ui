# Changelog

All notable changes to this project will be documented in this file.

# [0.2.3] - 06-11-2025

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
