# User Manual

The DSP TRUE ('TRU'sted 'E'ngineering) Connector UI is a frontend application designed for the IDS (International Data Space) ecosystem based on the DSP protocol. This user manual will guide you through all features and functionalities of the application.

# Table of Contents

- [Setup and Installation](#setup-and-installation)
  - [System Requirements](#system-requirements)
  - [Architecture](#architecture)
    - [Network Configuration](#network-configuration)
  - [Components](#components)
    - [Instance A](#instance-a)
    - [Instance B](#instance-b)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [Volume Mounts](#volume-mounts)
  - [Getting Started](#getting-started)
  - [Monitoring](#monitoring)
- [Main Features](#main-features)
- [Catalog Management](#catalog-management)
  - [Available Actions](#available-actions)
- [Service Management](#service-management)
  - [Available Actions](#available-actions-1)
- [Dataset Management](#dataset-management)
  - [Available Actions](#available-actions-2)
- [Distribution Management](#distribution-management)
  - [Available Actions](#available-actions-3)
- [Catalog Browser](#catalog-browser)
  - [Steps to Browse Catalogs](#steps-to-browse-catalogs)
  - [Starting a Negotiation](#starting-a-negotiation)
- [Contract Negotiation](#contract-negotiation)
  - [Provider View](#provider-view)
  - [Consumer View](#consumer-view)
  - [Available Actions](#available-actions-4)
- [Data Transfers](#data-transfers)
  - [Provider Transfers](#provider-transfers)
  - [Consumer Transfers](#consumer-transfers)
  - [Available Actions](#available-actions-5)

## DSP True Connector Setup

In order to run DSP TRUE Connector you need to run [Docker Compose configuration](docker/docker-compose.yml) for setting up two instances (A and B) of the DSP True Connector with already predefined configurations, initial data, certificates, etc. to run "out of the box". Each instance consists of a connector service, a UI component, and a MongoDB database.

### System Requirements

- Docker and Docker Compose
- 16GB RAM
- 8 thread Processor
- 5GB of disk space

### Architecture

The system consists of two separate instances, each containing:

- DSP True Connector service
- Web UI interface
- MongoDB database

#### Network Configuration

- Two isolated networks: `network-a` and `network-b`
- Cross-network communication enabled for connectors

### Components

#### Instance A

##### Connector A

- Image: `ghcr.io/engineering-research-and-development/dsp-true-connector:test`
- Ports:
  - FTP: 8888:2222
  - HTTP: 8080:8080
- Resource limits:
  - CPU: 1 core
  - Memory: 1024MB
- Logging max size: 200MB

##### UI A

- Image: `ghcr.io/engineering-research-and-development/dsp-true-connector-ui:0.0.1`
- Port: 4200:80
- Custom nginx configuration

##### MongoDB A

- Image: `mongo:7.0.12`
- Port: 27017:27017
- Persistent storage for data and config

#### Instance B

##### Connector B

- Image: `ghcr.io/engineering-research-and-development/dsp-true-connector:test`
- Ports:
  - FTP: 8889:2222
  - HTTP: 8090:8080
- Resource limits:
  - CPU: 1 core
  - Memory: 1024MB
- Logging max size: 200MB

##### UI B

- Image: `ghcr.io/engineering-research-and-development/dsp-true-connector-ui:0.0.1`
- Port: 4300:80
- Custom nginx configuration

##### MongoDB B

- Image: `mongo:7.0.12`
- Port: 27018:27017
- Persistent storage for data and config

### Configuration

#### Environment Variables

The following environment variables need to be set:

```env
#TLS settings
KEYSTORE_NAME= --> name of keystore that connector is using
KEY_PASSWORD= --> key password that connector is using
KEYSTORE_PASSWORD= --> keystore password that connector is using
KEYSTORE_ALIAS=true= --> keystore alias that connector is using

#TRUSTSTORE (used also by IDSCP2)
TRUSTSTORE_NAME= --> trust store name that connector is using
TRUSTSTORE_PASSWORD= --> trust store password that connector is using

#DAPS
DAPS_KEYSTORE_NAME= --> DAPS keystore name that connector is using
DAPS_KEYSTORE_PASSWORD= --> DAPS password that connector is using
DAPS_KEYSTORE_ALIAS= --> DAPS alias that connector is using

#CALLBACK ADDRESSES
CONNECTOR_A_CALLBACK_ADDRESS= --> URL that Connector A is using as callback address
CONNECTOR_B_CALLBACK_ADDRESS= --> URL that Connector B is using as callback address

#UI
CONNECTOR_A_TC_ROOT_API_URL= --> URL of exposed endpoint of Connector A for communication with UI
CONNECTOR_B_TC_ROOT_API_URL= --> URL of exposed endpoint of Connector B for communication with UI
```

#### Volume Mounts

##### Instance A

- Connector configuration: `./connector_a_resources:/config`
- Certificates: `./tc_cert:/cert`
- FTP directory: `./:/home/nobody/ftp`
- Logs: `tc_a_log:/var/log/tc`
- UI configuration: `./ui_a_resources/nginx.conf:/etc/nginx/nginx.conf`
- UI SSL certificates: `./ui_a_resources/ssl:/etc/nginx/ssl:ro`
- MongoDB data: `mongodb-data_a:/data/db`
- MongoDB config: `mongodb-configdb_a:/data/configdb`

##### Instance B

- Connector configuration: `./connector_b_resources:/config`
- Certificates: `./tc_cert:/cert`
- FTP directory: `./:/home/nobody/ftp`
- Logs: `tc_b_log:/var/log/tc`
- UI configuration: `./ui_b_resources/nginx.conf:/etc/nginx/nginx.conf`
- UI SSL certificates: `./ui_b_resources/ssl:/etc/nginx/ssl:ro`
- MongoDB data: `mongodb-data_b:/data/db`
- MongoDB config: `mongodb-configdb_b:/data/configdb`

### Getting Started

1. Start the services:

   ```bash
   docker-compose up -d
   ```

2. Access the UIs:

   - Instance A: http://localhost:4200
   - Instance B: http://localhost:4300

3. Start the services:
   ```bash
   docker-compose down
   ```

### Monitoring

- Logs for each connector instance are stored in their respective volume mounts
- MongoDB data is persisted in named volumes
- Container logs can be viewed using `docker-compose logs [service-name]`

## Main Features

- Catalog Management
- Service Management
- Dataset Management
- Distribution Management
- Catalog Browser
- Contract Negotiation
- Data Transfer
- Connector Configuration

### Catalog Management

Access catalog management through the side menu under "Manage catalog data."
For more information about catalog data, check [here](https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/catalog/catalog.protocol).

![Catalog management](/screenshots/catalog_overview.png)

<p align="center">Catalog Management</p>

#### Available Actions:

- View catalog details
- Edit catalog information (edit button)
- Delete catalog entries (trash button)
- Download catalog as JSON

![Catalog management edit](/screenshots/catalog_edit.png)

<p align="center">Editing catalog data</p>

After changing related data, click on a save button to update it in DB, or on cancel or back button to cancel editing.

### Service Management

The Service Management section provides control over all service-related operations.

![Service overview](/screenshots/services_overview.png)

<p align="center">Service management dashboard</p>

#### Available Actions:

- View service details
- Edit service information
- Delete services
- Add new services

![Service details](/screenshots/service_details.png)

<p align="center">Service details</p>

![Service add](/screenshots/service_add.png)

<p align="center">Add new service</p>

After inserting all necessary related data, click on a save button to store it in DB, or on cancel or back button to cancel inserting.

![Service edit](/screenshots/service_edit.png)

<p align="center">Edit service</p>

After changing related data, click on a save button to update it in DB, or on cancel or back button to cancel editing.

### Dataset Management

The Dataset Management section provides control over all available datasets in Catalog.

![Dataset overview](/screenshots/dataset_overview.png)

<p align="center">Dataset management dashboard</p>

#### Available Actions:

- View dataset details
- Edit dataset information
- Delete datasets
- Add new datasets with distributions and policies

![Dataset details](/screenshots/dataset_details.png)

<p align="center">Dataset details</p>

![Dataset add](/screenshots/dataset_add.png)

<p align="center">Add new dataset</p>

After inserting all necessary related data, click on a save button to store it in DB, or on cancel or back button to cancel inserting.

Artifact related to data set can be either file which will be uploaded, or external URL from where artifact will be fetched. If artifact is from external URL, authorization can be set, and it can be none, Basic (username/password) or Bearer Token.

![Artifact add](/screenshots/artifact_add_file.png)

<p align="center">Add file artifact</p>

![Artifact add](/screenshots/artifact_add_external.png)

<p align="center">Add external artifact</p>

![Dataset add](/screenshots/dataset_edit.png)

<p align="center">Edit dataset</p>

After changing related data, click on a save button to update it in DB, or on cancel or back button to cancel editing.

### Distribution Management

### Catalog Browser

The Catalog Browser allows you to view provider catalog data and initiate contract negotiations.

![Catalog browser](/screenshots/catalog_browser.png)

<p align="center">Catalog Browser section</p>

#### Steps to Browse Catalogs:

1. Enter the provider endpoint address in the input field (in case of predefined configuration, from ConnectorA UI (http://localhost:4200) request address of ConnectorB is http://connector-b:8080, and from from ConnectorB UI (http://localhost:4300) request address of ConnectorA is http://connector-a:8080)
2. Click the arrow exchange icon to fetch catalog data
3. Click the eye icon to view detailed catalog information

![Catalog browser fetched data](/screenshots/catalog_browser_fetched.png)

<p align="center">Catalog Browser section after fetching data</p>

![Catalog browser details](/screenshots/catalog_browser_details.png)

<p align="center">Catalog details</p>

#### Starting a Negotiation:

1. Navigate to the Datasets tab
2. Select an offer and format
3. Click "Start Negotiation"

![Contract negotiation start](/screenshots/negotiation_start.png)

<p align="center">Start contract negotiation</p>

The Dataset Management section provides control for distribution of all datasets in Catalog,

![Distribution overview](/screenshots/distribution_overview.png)

<p align="center">Distribution dashboard</p>

#### Available Actions:

- View distribution details
- Edit distribution information
- Delete distributions
- Add new distributions

![Distribution details](/screenshots/distribution_details.png)

<p align="center">Distribution details</p>

![Distribution add](/screenshots/distribution_add.png)

<p align="center">Add new Distribution</p>

After inserting all necessary related data, click on a save button to store it in DB, or on cancel or back button to cancel inserting.

![Distribution add](/screenshots/distribution_edit.png)

<p align="center">Edit Distribution</p>
After changing related data, click on a save button to update it in DB, or on cancel or back button to cancel editing.

### Contract Negotiation

For more information, flow, states, etc. about Contract Negotitaion, please check [here](https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/contract-negotiation/contract.negotiation.protocol).

The Contract Negotiation section is divided into two parts:

#### Provider View

![CN Provider](/screenshots/cn_provider.png)

<p align="center">Provider contract negotiation dashboard</p>

#### Consumer View

![CN Consumer](/screenshots/cn_consumer.png)

<p align="center">Consumer contract negotiation dashboard</p>

#### Available Actions:

- Filter negotiations by state
- View detailed negotiation information
- Respond to negotiations based on current state

### Data Transfers

Manage data transfers section is divided into two parts:

For more information, flow, states, etc. about Data Transfers, please check [here](https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.protocol).

#### Provider Transfers

![TP Provider](/screenshots/tp_provider.png)

#### Consumer Transfers

![TP Consumer](/screenshots/tp_consumer.png)

#### Available Actions:

- Filter transfers by state
- View transfer details
- Manage transfer status
- Download artifacts
- View artifacts

### Connector Configuration

The Connector Configuration section allows for viewing and modifying various connector settings. These application properties control the connector's behavior and are grouped by functionality.

![Connector Configuration](/screenshots/connector_configuration_overview.png)

<p align="center">Connector Configuration</p>

#### Overview

This page displays connector properties loaded from the backend, organized into expandable groups (e.g., DAPS, Security). Each property shows its label, configuration key, and an input control (toggle for boolean, text field for other types). Mandatory properties are marked with a star icon (`star`).

#### Available Actions

- **View Properties**: Browse properties by group. Hover over help icons for details and identify mandatory fields.
- **Modify Properties**:
  - Toggle switches for boolean (true/false) settings.
  - Enter values in text fields for other property types.
- **Manage Changes**:
  - **Save**: Persist modifications.
  - **Cancel**: Revert unsaved changes.
  - **Refresh**: Reload properties from the server.
