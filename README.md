# DSP TRUE Connector UI Application

[![Release](https://img.shields.io/github/v/release/Engineering-Research-and-Development/dsp-true-connector-ui?color=brightgreen)](https://github.com/Engineering-Research-and-Development/dsp-true-connector-ui/releases)
<a href="https://eclipse-dataspace-protocol-base.github.io/DataspaceProtocol/2025-1/"><img alt="Dataspace protocol" src="https://img.shields.io/badge/Dataspace%20protocol-2025--1-blue" /></a>
[![License: AGPL](https://img.shields.io/github/license/Engineering-Research-and-Development/true-connector-execution_core_container.svg?color=red)](https://opensource.org/licenses/AGPL-3.0)
<br/>

![](https://github.com/Engineering-Research-and-Development/true-connector/raw/main/doc/TRUE_Connector_Logo.png?raw=true)

</br></br>

<h1>
DSP TRUE ('TRU'sted 'E'ngineering) Connector UI for the IDS (International Data Space) ecosystem based on the DSP protocol.
</h1>

The DSP TRUE Connector UI is a frontend application developed by Engineering, a leading digital transformation company based in Italy. This UI is part of the DSP TRUE Connector suite, designed to facilitate self-determined data sharing while ensuring compliance with regulations such as GDPR. The application provides user-friendly interfaces for managing catalog data, services, datasets, distributions, and contract negotiations within the IDS ecosystem based on the DSP protocol.

For information on how to start connector with all modules, go to [user manual](/USER_MANUAL.md).

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Catalog Browser](#catalog-browser)
  - [Catalog Management](#catalog-management)
  - [Service Management](#service-management)
  - [Dataset Management](#dataset-management)
  - [Distribution Management](#distribution-management)
  - [Contract Negotiation](#contract-negotiation)
  - [Data transfers](#data-transfers)
  - [Audit Trail](#audit-trail)
  - [Connector Configuration](#connector-configuration)
- [Building & Testing](#building--testing)
- [Docker & Deployment](#docker--deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [More Information](#more-information)

## Features

- **Catalog Browser**: View provider catalog data and initiate contract negotiations.
- **Catalog Management**: Create, update, view, and delete catalog data of the connector.
- **Service Management**: Create, update, view, and delete service data of the connector.
- **Dataset Management**: Create, update, view, and delete dataset data of the connector.
- **Distribution Management**: Create, update, view, and delete distribution data of the connector.
- **Contract Negotiation**: Complete the entire contract negotiation process: start, accept, validate, finalize, or terminate.
- **Data Transfer**: Complete the entire data transfer process: request, start, download, complete, suspend, or terminate.
- **Audit Trail**: Track and audit all system events with advanced search and filtering capabilities.
- **Connector Configuration**: Manage connector application properties and settings via the UI.

## Prerequisites

- `Node.js` and `npm`
- `Angular CLI`

## Installation

1. **Clone the repository:**

   ```
   git clone https://github.com/Engineering-Research-and-Development/dsp-true-connector-ui.git
   cd dsp-true-connector-ui
   ```

2. **Install dependencies:**

   ```
   npm install
   ```

3. **Run the application:**

   For a full demonstration in a local environment, 2 instances of TRUE Connector should be running. After starting 2 Backend instances, run the following command to start Connector A:

   ```
   ng s --configuration connectorA
   ```

   Use the same command for Connector B.

   ```
   ng s --configuration connectorB
   ```

   The application will be available at `http://localhost:4200` for Connector A, and at `http://localhost:4300` for Connector B.

## Usage

### Catalog Browser

The **Catalog Browser** section provides an overview of provider catalog. In order to get catalog data, correct endpoint address should be inserted in input field. By clicking on the arrow exchange icon, connector catalog data will be fetched. By clicking the eye icon, detailed information about the provider catalog, such as identifier, description, participant ID, etc. is displayed. In the Datasets tab, all available datasets offered by the provider are shown. Selecting an offer and format from a specific catalog and clicking the "Start Negotiation" button initiates the contract negotiation process, after which the user will be redirected to the Contract Negotiation page for further details.

### Catalog Management

To manage catalog data, select the **Catalog Management** section from the side menu, then choose **Manage catalog data**. This section provides a comprehensive overview of catalog data, including identifier, description, theme, keyword, services, datasets, distribution, etc. Catalog data can be edited by clicking the edit button or deleted by clicking the trash button. Catalog data can also be downloaded as a JSON file.

### Service Management

The **Manage Services** section shows an overview of all services. By clicking the eye icon, the user can view detailed information about a specific service, such as its description, endpoint URL, keywords, etc. All of this information can be edited by clicking the edit button or deleted by clicking the trash button.

### Dataset Management

In the **Manage Datasets** section, an overview of all datasets is displayed. Clicking the eye icon provides detailed information about a specific dataset, such as its description, keywords, connected distributions, and attached policies. All of this information can be edited by clicking the edit button or deleted by clicking the trash button. By clicking the "+" button, new datasets can be added to the catalog, with connected distributions and attached policies being mandatory attributes.

### Distribution Management

The **Manage Distributions** section displays an overview of all distributions. Clicking the eye icon shows detailed information about a specific distribution, including its description and keywords. This information can be edited by clicking the edit button or deleted by clicking the trash button. New distributions can be added to the catalog by clicking the "+" button.

### Contract Negotiation

The **Contract Negotiation** section in the side menu includes two subsections:

- **Contract Negotiations as Provider**: A list of contract negotiations for datasets you have offered to other consumers.
- **Contract Negotiations as Consumer**: A list of contract negotiations for datasets you have requested from other providers.

In both subsections, contract negotiations can be filtered by state by clicking the desired option. All information about a contract negotiation is displayed in a card, showing details such as the assigner, callback address, state, offer details, permissions, etc. Depending on the current state of the negotiation, the user can respond and change its status.

### Data transfers

The **Data transfers** section in the side menu includes two subsections:

- **Data transfers as Provider**: A list of Data transfers that you're offering after successful contract negotiation to other consumers.
- **Data transfers as Consumer**: A list of Data transfers that you're offering after successful contract negotiation from other providers.

In both subsections, data transfers can be filtered by state by clicking the desired option. All information about a data transfers is displayed in a card, showing details such as the agreement id, callback address, state, dataset id, format, etc. Depending on the current state of the data transfer, the user can respond and change its status and in the end download the artifact.

### Audit Trail

The **Audit Trail** section displays a comprehensive log of all system events. Advanced search and filtering capabilities allow you to find specific events by type, date range, or other criteria. Clicking on an event displays detailed information including event type, timestamp, affected resources, and additional metadata.

### Connector Configuration

The **Connector Configuration** section allows you to manage and update connector application properties through the user interface. This includes essential settings and configuration parameters that control connector behavior and integration with the DSP network.

## Building & Testing

### Run Tests

Execute the test suite using:

```bash
npm test
```

### Build for Production

Build the application for production deployment:

```bash
npm build
```

The optimized build output will be available in the `dist/` directory.

### Watch Mode

For development with automatic recompilation:

```bash
npm run watch
```

## Docker & Deployment

### Running with Docker

The application includes Docker support for containerized deployment. Use Docker Compose to run both Connector A and B instances:

```bash
cd docker
docker-compose up -d
```

Access the instances:
- **Connector A UI**: http://localhost:4200
- **Connector B UI**: http://localhost:4300

### Docker Configuration

- `Dockerfile`: Container image definition
- `docker-compose.yml`: Multi-container orchestration
- `docker/ui_a_resources/` and `docker/ui_b_resources/`: Configuration files for each instance
- `docker/connector_a_resources/` and `docker/connector_b_resources/`: Backend connector configurations

### Troubleshooting

#### 413 Request Entity Too Large on dataset/artifact upload (Docker only)

**Symptom**: Adding or updating a dataset with an artifact larger than ~1MB fails with an HTTP `413 Request Entity Too Large` error when the app is run via Docker (`docker-compose up`), but the same action succeeds when running the UI locally through the IDE/terminal (`ng serve`).

**Cause**: In the Dockerized setup, nginx (`docker/ui_a_resources/nginx.conf`, `docker/ui_b_resources/nginx.conf`, and the root `nginx.conf`) serves the built UI and reverse-proxies API calls to the connector backend (`proxy_pass` to `connector-a`/`connector-b`). nginx defaults `client_max_body_size` to **1MB**, so any request body over that limit is rejected by nginx itself before it ever reaches the backend connector. When running the UI locally via the IDE/`ng serve`, there is no nginx in front of the backend — requests go straight to the connector, which has no such 1MB cap, so large uploads work fine.

**Solution**: Add `client_max_body_size 0;` (unlimited) to the `http { }` block in each nginx config used by the Docker setup:
- `docker/ui_a_resources/nginx.conf`
- `docker/ui_b_resources/nginx.conf`
- `nginx.conf`

Rebuild/restart the Docker containers after this change for it to take effect. If large uploads still fail, also check the backend connector's own request/multipart size limits, since nginx is only the first layer in the Dockerized path.

#### Why the public/remote server doesn't need this fix

The publicly deployed instance is **not** affected by nginx's 1MB default, because nginx's proxy location is never in the request path for API/artifact traffic there:

- The UI container is configured with `TC_ROOT_API_URL=https://connector-a.duckdns.org/api/v1` , so the Angular app calls the connector's own public domain directly, **not** the `ui-a`/`ui-b` nginx proxy path (`/connector-a/api/v1/`). The `ui_a_resources/nginx.conf` / `ui_b_resources/nginx.conf` used there only serve the static Angular bundle — they're never used to proxy API calls.
- `connector-a.duckdns.org` / `connector-b.duckdns.org` are routed by **Caddy** straight to the connector container's port (e.g. `reverse_proxy http://publicIPaddress:8080`). Caddy has **no default request body size limit** (unlike nginx's 1MB default) — a limit would have to be explicitly configured via a `request_body { max_size ... }` directive, which this `Caddyfile` doesn't set.
- The connector's own Spring Boot config also removes any cap: `spring.servlet.multipart.max-file-size=-1` and `spring.servlet.multipart.max-request-size=-1`.

So on the public server, the actual request chain is: **browser → Caddy (no size cap) → connector (multipart limits disabled)** — nginx's restrictive default is simply bypassed. This is different from the local Docker Compose setup in `docker/`, where the UI's nginx proxy is actually in the request path and does enforce its 1MB default, which is why `client_max_body_size 0;` was needed there.

## Documentation

For detailed setup, configuration, and usage information, refer to:

- **[USER_MANUAL.md](/USER_MANUAL.md)**: Comprehensive guide for starting the connector with all modules and detailed feature walkthrough
- **[CHANGELOG.md](/CHANGELOG.md)**: Version history and changes
- **[release_notes.md](/release_notes.md)**: Release information and updates



We welcome contributions to the DSP TRUE Connector UI application. To contribute:

1. **Fork the repository:**

   ```sh
   git fork https://github.com/Engineering-Research-and-Development/dsp-true-connector-ui.git
   ```

2. **Create a feature branch:**

   ```sh
   git checkout -b feature/your-feature-name
   ```

3. **Commit your changes:**

   ```sh
   git commit -m "Add your feature description"
   ```

4. **Push to the branch:**

   ```sh
   git push origin feature/your-feature-name
   ```

5. **Open a pull request:**
   Go to the repository on GitHub and open a pull request to the `develop` branch.

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](LICENSE) file for details.

## More Information

For more information contact the support team at trueconnector-team@eng.it.
