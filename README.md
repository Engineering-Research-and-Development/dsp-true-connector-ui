# DSP TRUE Connector UI Application

[![License: AGPL](https://img.shields.io/github/license/Engineering-Research-and-Development/true-connector-execution_core_container.svg)](https://opensource.org/licenses/AGPL-3.0)
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

## Contributing

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
