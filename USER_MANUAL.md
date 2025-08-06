# DSP TRUE Connector User Manual

The DSP TRUE ('TRU'sted 'E'ngineering) Connector UI is a comprehensive frontend application designed for the International Data Space (IDS) ecosystem, built on the robust DSP (Dataspace Protocol) framework. This user manual provides detailed guidance on all features, functionalities, and best practices for effective system utilization.

## Table of Contents

- [Setup and Installation](#setup-and-installation)
  - [System Requirements](#system-requirements)
  - [Architecture Overview](#architecture-overview)
    - [Network Configuration](#network-configuration)
  - [System Components](#system-components)
    - [Instance A](#instance-a)
    - [Instance B](#instance-b)
  - [Configuration](#configuration)
    - [Environment Variables](#environment-variables)
    - [S3 Configuration](#s3-configuration)
    - [Volume Mounts](#volume-mounts)
  - [Getting Started](#getting-started)
  - [System Monitoring](#system-monitoring)
- [Application Features](#application-features)
- [Catalog Management](#catalog-management)
  - [Overview](#overview)
  - [Available Operations](#available-operations)
- [Service Management](#service-management)
  - [Overview](#overview-1)
  - [Available Operations](#available-operations-1)
- [Dataset Management](#dataset-management)
  - [Overview](#overview-2)
  - [Available Operations](#available-operations-2)
  - [Artifact Management](#artifact-management)
- [Distribution Management](#distribution-management)
  - [Overview](#overview-3)
  - [Available Operations](#available-operations-3)
- [Catalog Browser](#catalog-browser)
  - [Navigation Guide](#navigation-guide)
  - [Contract Negotiation Initiation](#contract-negotiation-initiation)
- [Contract Negotiation](#contract-negotiation)
  - [Protocol Overview](#protocol-overview)
  - [Provider Perspective](#provider-perspective)
  - [Consumer Perspective](#consumer-perspective)
  - [Management Operations](#management-operations)
- [Data Transfer Management](#data-transfer-management)
  - [Protocol Overview](#protocol-overview-1)
  - [Provider Transfer Operations](#provider-transfer-operations)
  - [Consumer Transfer Operations](#consumer-transfer-operations)
  - [Transfer Management](#transfer-management)
- [Audit Trail](#audit-trail)
  - [Overview](#overview-4)
  - [Event Monitoring](#event-monitoring)
  - [Advanced Filtering](#advanced-filtering)
  - [Usage Guidelines](#usage-guidelines)
- [Connector Configuration](#connector-configuration)
  - [Overview](#overview-5)
  - [Configuration Management](#configuration-management)

---

## Setup and Installation

### System Requirements

To ensure optimal performance and stability, your system must meet the following minimum requirements:

- **Container Platform**: Docker Engine 20.10+ and Docker Compose 2.0+
- **Memory**: 16GB RAM (minimum)
- **Processing Power**: 8-thread processor (recommended: Intel i7 or AMD Ryzen 7)
- **Storage**: 5GB available disk space
- **Network**: Stable internet connection for external communications

### Architecture Overview

The DSP TRUE Connector employs a distributed architecture consisting of two independent instances, each providing complete connector functionality. This design enables comprehensive testing, development, and demonstration of dataspace interactions.

Each instance operates as a self-contained unit comprising:

- **DSP True Connector Service**: Core protocol implementation
- **Web UI Interface**: User-friendly management dashboard
- **MongoDB Database**: Persistent data storage
- **Minio S3 storage**: Persistent S3 storage for objects (artifacts)
- **Network Isolation**: Secure communication channels

#### Network Configuration

The system utilizes isolated network segments for enhanced security:

- **Network A** (`network-a`): Dedicated to Instance A components
- **Network B** (`network-b`): Dedicated to Instance B components
- **Inter-connector Communication**: Controlled cross-network access for DSP protocol operations

### System Components

#### Instance A

**Connector A Service**

- **Image**: `ghcr.io/engineering-research-and-development/dsp-true-connector:latests`
- **Port Mapping**:
  - FTP Service: `8888:2222`
  - HTTP API: `8080:8080`
- **Resource Allocation**:
  - CPU Limit: 1 core
  - Memory Limit: 1024MB
- **Logging**: Maximum 200MB log files with rotation

**UI A Interface**

- **Image**: `ghcr.io/engineering-research-and-development/dsp-true-connector-ui:latest`
- **Port Mapping**: `4200:80`
- **Features**: Custom nginx configuration with SSL support

**MongoDB A Database**

- **Image**: `mongo:7.0.12`
- **Port Mapping**: `27017:27017`
- **Storage**: Persistent volumes for metadata and configuration

**Minio S3 storage**

- **Image**: `minio/minio:RELEASE.2025-04-22T22-12-26Z`
- **Port Mapping**: `9000:9000`
- **Storage**: Persistent S3 storage for artifacts

#### Instance B

**Connector B Service**

- **Image**: `ghcr.io/engineering-research-and-development/dsp-true-connector:test`
- **Port Mapping**:
  - FTP Service: `8889:2222`
  - HTTP API: `8090:8080`
- **Resource Allocation**:
  - CPU Limit: 1 core
  - Memory Limit: 1024MB
- **Logging**: Maximum 200MB log files with rotation

**UI B Interface**

- **Image**: `ghcr.io/engineering-research-and-development/dsp-true-connector-ui:0.0.1`
- **Port Mapping**: `4300:80`
- **Features**: Custom nginx configuration with SSL support

**MongoDB B Database**

- **Image**: `mongo:7.0.12`
- **Port Mapping**: `27018:27017`
- **Storage**: Persistent volumes for data and configuration

**Minio S3 storage**

- **Image**: `minio/minio:RELEASE.2025-04-22T22-12-26Z`
- **Port Mapping**: `9000:9000`
- **Storage**: Persistent S3 storage for artifacts

### Configuration

#### Environment Variables

Configure the following environment variables for proper system operation:

```env
# TLS Security Configuration
KEYSTORE_NAME=                    # Primary keystore filename
KEY_PASSWORD=                     # Private key password
KEYSTORE_PASSWORD=                # Keystore access password
KEYSTORE_ALIAS=                   # Certificate alias identifier

# Trust Store Configuration (IDSCP2 Protocol)
TRUSTSTORE_NAME=                  # Trust store filename
TRUSTSTORE_PASSWORD=              # Trust store access password

# DAPS (Dynamic Attribute Provisioning Service)
DAPS_KEYSTORE_NAME=               # DAPS authentication keystore
DAPS_KEYSTORE_PASSWORD=           # DAPS keystore password
DAPS_KEYSTORE_ALIAS=              # DAPS certificate alias

# Connector Callback Addresses
CONNECTOR_A_CALLBACK_ADDRESS=     # Instance A callback URL
CONNECTOR_B_CALLBACK_ADDRESS=     # Instance B callback URL

# UI Communication Endpoints
CONNECTOR_A_TC_ROOT_API_URL=      # Instance A API endpoint for UI
CONNECTOR_B_TC_ROOT_API_URL=      # Instance B API endpoint for UI
```

#### S3 Configuration

Configure S3-compatible storage for artifact management:

**Core Properties:**

- `s3.endpoint`: S3 service endpoint URL (MinIO/AWS S3/compatible services)
- `s3.accessKey`: Authentication access key identifier
- `s3.secretKey`: Authentication secret access key
- `s3.region`: Storage region identifier (e.g., us-east-1, eu-west-1)
- `s3.bucketName`: Target bucket for data storage
- `s3.externalPresignedEndpoint`: External URL for presigned download links

**Important Configuration Note:**

> The `s3.externalPresignedEndpoint` should reference your machine's local IP address (e.g., `http://192.168.x.x:9000`) for development environments, or the public URL for production deployments.

#### Volume Mounts

**Instance A Volume Configuration:**

- Connector Configuration: `./connector_a_resources:/config`
- Security Certificates: `./tc_cert:/cert`
- FTP Data Directory: `./:/home/nobody/ftp`
- Application Logs: `tc_a_log:/var/log/tc`
- UI Configuration: `./ui_a_resources/nginx.conf:/etc/nginx/nginx.conf`
- UI SSL Certificates: `./ui_a_resources/ssl:/etc/nginx/ssl:ro`
- MongoDB Data: `mongodb-data_a:/data/db`
- MongoDB Config: `mongodb-configdb_a:/data/configdb`
- Minio S3: `minio_data:/data`

**Instance B Volume Configuration:**

- Connector Configuration: `./connector_b_resources:/config`
- Security Certificates: `./tc_cert:/cert`
- FTP Data Directory: `./:/home/nobody/ftp`
- Application Logs: `tc_b_log:/var/log/tc`
- UI Configuration: `./ui_b_resources/nginx.conf:/etc/nginx/nginx.conf`
- UI SSL Certificates: `./ui_b_resources/ssl:/etc/nginx/ssl:ro`
- MongoDB Data: `mongodb-data_b:/data/db`
- MongoDB Config: `mongodb-configdb_b:/data/configdb`
- Minio S3: `minio_data:/data`

### Getting Started

**System Startup:**

```bash
# Start all services in detached mode
docker-compose up -d

# Verify service status
docker-compose ps
```

**Access Points:**

- **Instance A UI**: http://localhost:4200
- **Instance B UI**: http://localhost:4300
- **Instance A API**: http://localhost:8080
- **Instance B API**: http://localhost:8090
- **Minio**: http://localhost:9001

**System Shutdown:**

```bash
# Gracefully stop all services
docker-compose down

# Stop services and remove volumes (use with caution)
docker-compose down -v
```

### System Monitoring

**Log Management:**

- Individual connector logs stored in respective volume mounts
- MongoDB data persisted in named volumes for reliability
- Real-time log monitoring: `docker-compose logs -f [service-name]`

**Health Checks:**

- Monitor container status: `docker-compose ps`
- Resource utilization: `docker stats`
- Network connectivity verification between instances

---

## Application Features

The DSP TRUE Connector UI provides comprehensive management capabilities for dataspace operations:

- **Catalog Management**: Complete catalog lifecycle management
- **Service Management**: Service registration and configuration
- **Dataset Management**: Data asset organization and control
- **Distribution Management**: Data distribution configuration
- **Catalog Browser**: External catalog discovery and exploration
- **Contract Negotiation**: Complete agreement processing
- **Data Transfer Management**: Secure data exchange operations
- **Audit Trail**: Comprehensive system activity monitoring
- **Connector Configuration**: System parameter management

---

## Catalog Management

### Overview

Catalog Management provides centralized control over your dataspace catalog information. Access this functionality through the main navigation menu under "Manage catalog data."

For comprehensive information about catalog data structures and protocols, refer to the [IDS Catalog Protocol Documentation](https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/catalog/catalog.protocol).

![Catalog management](/screenshots/catalog_overview.png)

<p align="center">Catalog Management Dashboard</p>

### Available Operations

**Catalog Information Management:**

- **View Details**: Comprehensive catalog information display
- **Edit Information**: Modify catalog metadata and properties
- **Delete Entries**: Remove obsolete catalog entries with confirmation
- **Export Data**: Download complete catalog as JSON format

**Editing Workflow:**
![Catalog management edit](/screenshots/catalog_edit.png)

<p align="center">Catalog Data Editing Interface</p>

**Operation Steps:**

1. Select the catalog entry to modify
2. Click the edit button (pencil icon)
3. Update required fields and metadata
4. **Save**: Commit changes to database
5. **Cancel/Back**: Discard modifications and return to overview

---

## Service Management

### Overview

Service Management provides comprehensive control over all service-related operations within your dataspace connector. This section enables registration, configuration, and lifecycle management of services offered through your connector.

![Service overview](/screenshots/services_overview.png)

<p align="center">Service Management Dashboard</p>

### Available Operations

**Service Lifecycle Management:**

- **View Service Details**: Comprehensive service information and metadata
- **Edit Services**: Modify existing service configurations
- **Delete Services**: Remove services with dependency validation
- **Add New Services**: Register new services with complete configuration

**Service Detail View:**
![Service details](/screenshots/service_details.png)

<p align="center">Detailed Service Information</p>

**Adding New Services:**
![Service add](/screenshots/service_add.png)

<p align="center">New Service Registration</p>

**Service Creation Workflow:**

1. Click "Add New Service" button
2. Complete all required service information fields
3. Configure service parameters and metadata
4. **Save**: Register service in database
5. **Cancel/Back**: Discard entry and return to dashboard

**Service Modification:**
![Service edit](/screenshots/service_edit.png)

<p align="center">Service Configuration Editing</p>

**Editing Workflow:**

1. Select service from the management dashboard
2. Click edit button to modify configuration
3. Update necessary fields and parameters
4. **Save**: Apply changes to database
5. **Cancel/Back**: Discard modifications

---

## Dataset Management

### Overview

Dataset Management provides complete control over data assets within your catalog. This comprehensive section handles dataset registration, configuration, and lifecycle management including associated distributions and access policies and actual datasets representation (artifacts).

![Dataset overview](/screenshots/dataset_overview.png)

<p align="center">Dataset Management Dashboard</p>

### Available Operations

**Dataset Lifecycle Management:**

- **View Dataset Details**: Complete dataset information and metadata
- **Edit Dataset Information**: Modify existing dataset configurations
- **Delete Datasets**: Remove datasets with dependency validation
- **Add New Datasets**: Register datasets with distributions and policies

**Dataset Detail View:**
![Dataset details](/screenshots/dataset_details.png)

<p align="center">Comprehensive Dataset Information</p>

**Dataset Registration:**
![Dataset add](/screenshots/dataset_add.png)

<p align="center">New Dataset Registration Interface</p>

**Dataset Creation Workflow:**

1. Navigate to Dataset Management section
2. Click "Add New Dataset" button
3. Complete dataset metadata and information
4. Configure associated distributions and access policies
5. **Save**: Register dataset in catalog
6. **Cancel/Back**: Discard registration and return

### Artifact Management

Datasets can be associated with artifacts through two primary methods:

**File Upload Artifacts:**
![Artifact add](/screenshots/artifact_add_file.png)

<p align="center">File Artifact Upload Interface</p>

**External URL Artifacts:**
![Artifact add](/screenshots/artifact_add_external.png)

<p align="center">External Artifact Configuration</p>

**Artifact Configuration Options:**

- **File Upload**: Direct file upload to system storage
- **External URL**: Reference to external data sources
- **Authorization Methods**:
  - None: Public access
  - Basic Authentication: Username/password credentials
  - Bearer Token: Token-based authentication

**Dataset Modification:**
![Dataset add](/screenshots/dataset_edit.png)

<p align="center">Dataset Configuration Editing</p>

**Editing Process:**

1. Select dataset from management dashboard
2. Access edit mode via edit button
3. Modify dataset properties, distributions, or policies
4. **Save**: Apply changes to catalog
5. **Cancel/Back**: Discard modifications

---

## Distribution Management

### Overview

Distribution Management provides centralized control over data distribution configurations for all datasets within your catalog. This section manages how datasets are made available and accessible to consumers within the dataspace.

![Distribution overview](/screenshots/distribution_overview.png)

<p align="center">Distribution Management Dashboard</p>

### Available Operations

**Distribution Lifecycle Management:**

- **View Distribution Details**: Complete distribution configuration and metadata
- **Edit Distribution Information**: Modify existing distribution settings
- **Delete Distributions**: Remove distributions with validation checks
- **Add New Distributions**: Create new distribution configurations

**Distribution Detail View:**
![Distribution details](/screenshots/distribution_details.png)

<p align="center">Detailed Distribution Information</p>

**Distribution Registration:**
![Distribution add](/screenshots/distribution_add.png)

<p align="center">New Distribution Creation Interface</p>

**Distribution Creation Process:**

1. Access Distribution Management section
2. Click "Add New Distribution" button
3. Configure distribution parameters and access methods
4. Define format, protocol, and endpoint information
5. **Save**: Register distribution in system
6. **Cancel/Back**: Discard creation and return

**Distribution Modification:**
![Distribution add](/screenshots/distribution_edit.png)

<p align="center">Distribution Configuration Editing</p>

**Editing Workflow:**

1. Select distribution from dashboard
2. Enter edit mode via edit button
3. Update distribution parameters and configurations
4. **Save**: Apply changes to database
5. **Cancel/Back**: Discard modifications

---

## Catalog Browser

### Overview

The Catalog Browser enables discovery and exploration of external provider catalogs within the dataspace ecosystem. This functionality facilitates catalog browsing and initiates contract negotiation processes with external data providers.

![Catalog browser](/screenshots/catalog_browser.png)

<p align="center">Catalog Browser Interface</p>

### Navigation Guide

**Catalog Discovery Process:**

1. **Provider Endpoint Configuration**:

   - Enter the target provider's endpoint address
   - **Pre-configured Endpoints**:
     - From Connector A UI (`http://localhost:4200`): Use `http://connector-b:8080`
     - From Connector B UI (`http://localhost:4300`): Use `http://connector-a:8080`

2. **Catalog Retrieval**:

   - Click the arrow exchange icon to fetch catalog data
   - System performs DSP protocol communication with provider
   - Catalog information populates in the interface

3. **Catalog Exploration**:
   - Click the eye icon for detailed catalog information
   - Browse available datasets and services
   - Review provider capabilities and offerings

![Catalog browser fetched data](/screenshots/catalog_browser_fetched.png)

<p align="center">Catalog Browser with Retrieved Data</p>

![Catalog browser details](/screenshots/catalog_browser_details.png)

<p align="center">Detailed Catalog Information View</p>

### Contract Negotiation Initiation

**Negotiation Startup Process:**

1. **Dataset Selection**:

   - Navigate to the "Datasets" tab within catalog details
   - Review available dataset offerings and their terms

2. **Offer Configuration**:

   - Select desired dataset offer
   - Choose appropriate data format from available options
   - Review associated policies and constraints

3. **Negotiation Launch**:
   - Click "Start Negotiation" button
   - System initializes contract negotiation protocol
   - Negotiation appears in Contract Negotiation management section

![Contract negotiation start](/screenshots/negotiation_start.png)

<p align="center">Contract Negotiation Initiation Interface</p>

---

## Contract Negotiation

### Protocol Overview

Contract Negotiation implements the DSP Contract Negotiation Protocol, enabling agreement processes between data providers and consumers. The system manages the complete negotiation lifecycle from initial offer through final agreement.

For comprehensive protocol information, including states, flows, and message formats, refer to the [IDS Contract Negotiation Protocol Documentation](https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/contract-negotiation/contract.negotiation.protocol).

### Provider Perspective

The Provider view manages incoming negotiation requests from external consumers seeking access to your catalog offerings.

![CN Provider](/screenshots/cn_provider.png)

<p align="center">Provider Contract Negotiation Dashboard</p>

**Provider Responsibilities:**

- Review incoming negotiation requests
- Evaluate consumer proposals against policies
- Accept, reject, or counter-propose agreements
- Monitor negotiation progress and status

### Consumer Perspective

The Consumer view tracks outgoing negotiation requests initiated through the Catalog Browser for external provider offerings.

![CN Consumer](/screenshots/cn_consumer.png)

<p align="center">Consumer Contract Negotiation Dashboard</p>

**Consumer Operations:**

- Monitor negotiation status and progress
- Respond to provider counter-offers
- Accept or decline final agreements
- Track negotiation outcomes

### Management Operations

**Advanced Filtering Capabilities:**

- **State Filtering**: Filter by negotiation states (offered, requested, agreed, terminated)
- **Offer ID**: Search by specific offer identifiers
- **Provider PID**: Filter by provider process identifiers
- **Consumer PID**: Filter by consumer process identifiers
- **Date Range**: Filter negotiations within specific time periods

**Available Actions:**

- **View Negotiation Details**: Access comprehensive negotiation information
- **Respond to Negotiations**: Take appropriate actions based on current negotiation state
- **Status Monitoring**: Track negotiation progress through protocol states
- **Agreement Management**: Handle final agreement acceptance and processing

---

## Data Transfer Management

### Protocol Overview

Data Transfer Management implements the DSP Transfer Process Protocol, handling secure data exchange operations between negotiated parties. The system manages the complete transfer lifecycle from initiation through completion.

For detailed protocol information, including states, flows, and security considerations, refer to the [IDS Transfer Process Protocol Documentation](https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.protocol).

### Provider Transfer Operations

Provider transfers manage outbound data delivery to consumers who have successfully completed contract negotiations.

![TP Provider](/screenshots/tp_provider.png)

<p align="center">Provider Data Transfer Dashboard</p>

**Provider Transfer Management:**

- Monitor outbound transfer requests
- Validate transfer authorization against agreements
- Manage data delivery processes
- Track transfer completion status

### Consumer Transfer Operations

Consumer transfers handle inbound data reception from providers following successful contract negotiations.

![TP Consumer](/screenshots/tp_consumer.png)

<p align="center">Consumer Data Transfer Dashboard</p>

**Consumer Transfer Management:**

- Monitor inbound transfer processes
- Manage data reception and storage
- Validate received data integrity
- Access downloaded artifacts

### Transfer Management

**Advanced Filtering Options:**

- **State Filtering**: Filter transfers by current processing state
- **Dataset ID**: Search transfers by associated dataset identifiers
- **Provider PID**: Filter by provider process identifiers
- **Consumer PID**: Filter by consumer process identifiers
- **Date Range**: Filter transfers within specific time periods

**Available Operations:**

- **View Transfer Details**: Access comprehensive transfer information and metadata
- **Status Management**: Monitor and manage transfer processing states
- **Artifact Download**: Download successfully transferred data artifacts
- **Artifact Viewing**: Preview and inspect received data content
- **Transfer Monitoring**: Real-time tracking of transfer progress and status

---

## Audit Trail

### Overview

The Audit Trail provides comprehensive logging and monitoring capabilities, enabling complete visibility into all system events and activities within the DSP TRUE Connector application. This functionality supports compliance, security monitoring, and operational oversight.

![Audit Trail](/screenshots/audit_trail_overview.png)

<p align="center">Audit Trail Management Dashboard</p>

### Event Monitoring

The audit trail captures and displays system events in a comprehensive tabular format, providing detailed information about:

- **User Activities**: Authentication, authorization, and user-initiated operations
- **System Events**: Connector operations, configuration changes, and system status
- **Protocol Operations**: DSP message exchanges, negotiations, and transfers
- **Data Operations**: Catalog modifications, dataset changes, and access events
- **Security Events**: Authentication failures, authorization violations, and security alerts

**Event Information Includes:**

- Precise timestamps with timezone information
- Event type classification and categorization
- User account and session information
- Source system and component identification
- Detailed event descriptions and metadata
- Related process and transaction identifiers

### Advanced Filtering

The audit trail provides sophisticated filtering capabilities for precise event analysis and investigation:

![Audit Trail Filtering](/screenshots/audit_trail_filtering.png)

<p align="center">Advanced Filtering Interface</p>

**Available Filter Criteria:**

- **Event Type**: Filter by specific event categories and classifications

  - Contract negotiations and agreement processes
  - Data transfer operations and status changes
  - Catalog management and modification operations
  - User authentication and authorization events
  - System configuration and administrative changes

- **Username**: Filter events by specific user accounts and identities
- **Source**: Filter by event source systems, components, or services
- **IP Address**: Filter events by client IP addresses and network locations
- **Provider PID**: Filter by provider process identifiers in DSP operations
- **Consumer PID**: Filter by consumer process identifiers in DSP operations
- **Date Range**: Filter events within specific time periods using comprehensive date selectors
  - From Date: Specify start date and time for event range
  - To Date: Specify end date and time for event range

**Filter Combination**: Apply multiple filters simultaneously for precise event targeting and analysis.

![Audit Trail Details](/screenshots/audit_trail_details.png)

<p align="center">Detailed Event Information View</p>

### Usage Guidelines

**Accessing Audit Trail:**

1. Navigate to the Audit Trail section via the main application menu
2. Review the complete event listing in chronological order
3. Utilize search and filter options to locate specific events of interest

**Event Investigation Process:**

1. Apply appropriate filters to narrow down relevant events
2. Click on individual log entries to access comprehensive event details
3. Review event metadata, timestamps, and associated information
4. Cross-reference related events using process identifiers

**Compliance and Reporting:**

1. Configure date ranges for specific reporting periods
2. Apply relevant filters for compliance-specific event types
3. Export filtered results for external analysis and audit purposes
4. Generate comprehensive reports for regulatory and oversight requirements

**Best Practices:**

- Regularly monitor audit trails for unusual or suspicious activities
- Maintain appropriate retention policies for audit data
- Implement automated alerts for critical security events
- Use precise filtering to reduce investigation time and improve efficiency

---

## Connector Configuration

### Overview

The Connector Configuration section provides comprehensive management of system parameters and operational settings. This functionality enables administrators to view, modify, and maintain critical connector properties that control system behavior and integration capabilities.

![Connector Configuration](/screenshots/connector_configuration_overview.png)

<p align="center">Connector Configuration Management Interface</p>

### Configuration Management

**Property Organization:**
Configuration properties are logically grouped by functionality for easier management:

- **DAPS Configuration**: Dynamic Attribute Provisioning Service settings
- **Security Settings**: Encryption, certificates, and authentication parameters
- **Network Configuration**: Communication endpoints and protocol settings
- **Storage Configuration**: Database and file system parameters
- **Integration Settings**: External system connection parameters

**Property Display Features:**

- **Expandable Groups**: Click to expand/collapse property categories
- **Property Labels**: Human-readable descriptions for each configuration item
- **Configuration Keys**: Technical parameter identifiers for reference
- **Input Controls**: Appropriate interfaces for different data types
- **Mandatory Indicators**: Star icons (`⭐`) mark required properties
- **Help Information**: Hover tooltips provide detailed parameter descriptions

**Available Operations:**

**Property Viewing:**

- Browse configuration properties organized by functional groups
- Access detailed information through help icons and tooltips
- Identify mandatory fields and their current values
- Review current system configuration state

**Property Modification:**

- **Boolean Properties**: Use toggle switches for true/false settings
- **Text Properties**: Enter values in dedicated text input fields
- **Validation**: Real-time validation of input values and formats
- **Dependency Checking**: Automatic validation of related property constraints

**Change Management:**

- **Save Changes**: Persist all modifications to system configuration
- **Cancel Modifications**: Revert unsaved changes to previous values
- **Refresh Configuration**: Reload current properties from server
- **Validation Feedback**: Immediate notification of validation errors or conflicts

**Configuration Workflow:**

1. Access the Connector Configuration section from main navigation
2. Expand relevant property groups to locate desired settings
3. Modify property values using appropriate input controls
4. Validate changes using built-in validation mechanisms
5. Save modifications to apply changes system-wide
6. Monitor system behavior to ensure proper configuration application

**Security Considerations:**

- Sensitive properties (passwords, keys) are appropriately masked
- Configuration changes require appropriate administrative privileges
- All configuration modifications are logged in the audit trail
- Backup and recovery procedures should include configuration settings

---

_This manual provides comprehensive guidance for the DSP TRUE Connector UI. For additional technical support, system updates, or advanced configuration assistance, please consult the official documentation or contact the system administrators._
