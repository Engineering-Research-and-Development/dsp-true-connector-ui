# TRUE Connector Helm Chart

This chart deploys a **TRUE Connector stack** composed of:
- The TRUE Connector (Java Spring Boot)
- The Connector UI (Angular/SPA behind Nginx)
- MongoDB (optional, can be disabled)
- MinIO (optional: either external or in-cluster)
- Optional initial data (JSON files mounted as ConfigMap)

> **Important:** This public version is sanitized. All real certificates,
> keys and passwords have been replaced with placeholders.  
> **Never commit real secrets** into this repository.

---

## 1. Repository Structure

- `Chart.yaml` – Helm chart metadata.
- `values.yaml` – Default values with sane defaults and placeholders.
- `values/` – Example overrides for different pilots (ITC, NP, ADSC, DIGI).
- `templates/` – Kubernetes manifests:
  - `connector-*` – TRUE Connector deployment, service, config & PVCs.
  - `ui-*` – UI deployment, service, config & TLS secret.
  - `mongo.yaml` – Optional MongoDB deployment & service.
  - `minio-*` – Optional MinIO deployment & credentials.
  - `initial-file-config.yaml` – Initial data mounted as ConfigMap(s).
- `files/initial-data/` – Example JSON files for initial import.
- `tc_cert/` – **Empty in public repo**. Add your own keystore/truststore
  and create Kubernetes secrets externally.

---

## 2. Quick Start

### 2.1 Prerequisites

- Kubernetes cluster (≥ 1.25)
- Helm v3
- A namespace (default in chart: `eng-connectors`)
- External DAPS & Identity Provider properly configured
- Container registry access to:
  - TRUE Connector image
  - UI image

Create the namespace (if you haven’t already):

```bash
kubectl create namespace eng-connectors
```

### 2.2 Installing with default values

```bash
helm install my-connector ./true-connector \
  -n eng-connectors
```

### 2.3 Installing with an environment-specific values file

For example for the `itc` pilot:

```bash
helm install itc-connector ./true-connector \
  -n eng-connectors \
  -f values/itc-values.yaml
```

Repeat with `np-values.yaml`, `adsc-values.yaml`, `digi-values.yaml` as needed.

---

## 3. Secrets and Certificates

### 3.1 Java keystores (Connector TLS, DAPS)

You must provide:
- Connector keystore & truststore
- DAPS keystore (PKCS12/JKS)

Recommended pattern:

1. Create a Kubernetes secret **outside** of Helm:

```bash
kubectl create secret generic my-connector-certs \
  -n eng-connectors \
  --from-file=true-connector-keystore.jks \
  --from-file=true-connector-truststore.jks
```

2. In `values.yaml` (or your override):

```yaml
connector:
  certsSecret:
    enabled: true
    existingSecretName: my-connector-certs
```

> Note: The `keystoreJksB64` / `truststoreJksB64` fields are kept only as an
> escape hatch for internal testing. For public deployments, **prefer
> `existingSecretName`** and do not commit base64 blobs.

### 3.2 UI TLS

Similarly, for the UI ingress/TLS secret:

```bash
kubectl create secret tls my-connector-ui-tls \
  -n eng-connectors \
  --cert=ui.crt \
  --key=ui.key
```

Then in `values.yaml`:

```yaml
ui:
  tls:
    enabled: true
    create: false
    existingSecretName: my-connector-ui-tls
```

---

## 4. Main Configuration Sections (values.yaml)

### 4.1 Global

```yaml
global:
  namespace: eng-connectors   # default target namespace
  imagePullPolicy: IfNotPresent
```

> In most cases you can just use `.Release.Namespace`. The `global.namespace`
> value is kept for backwards compatibility. If you change it, make sure all
> templates referencing it are updated consistently.

### 4.2 Connector

Key options:

```yaml
connector:
  image: ghcr.io/engineering-research-and-development/dsp-true-connector:0.5.0
  replicas: 1
  resources:
    requests:
      cpu: "250m"
      memory: "512Mi"
    limits: {}
  service:
    apiPort: 8080
    ftpPort: 2222
  persistence:
    ftp:
      enabled: true
      size: 1Gi
    logs:
      enabled: true
      size: 1Gi
```

Environment-specific configuration (DAPS, IDS, Mongo, MinIO, etc.) is located
under:

```yaml
connector:
  env:
    # CALLBACK_ADDRESS, DAPS URLs, Mongo URL, MinIO URL, etc.
```

Use the pilot-specific override files in `values/` as examples and adapt them
to your own environment.

### 4.3 MongoDB

```yaml
mongo:
  enabled: true
  pvcSize: 1Gi
```

If you already have a managed MongoDB instance, set `enabled: false` and
configure:

```yaml
connector:
  env:
    SPRING_DATA_MONGODB_URI: "mongodb://user:pass@your-mongo:27017/dbname"
```

### 4.4 MinIO

```yaml
minio:
  enabled: true
  name: "shared-minio"
  credentials:
    secretName: "shared-minio-cred"
    accessKey: "<MINIO_ACCESS_KEY>"
    secretKey: "<MINIO_SECRET_KEY>"
```

For production:
- Prefer an external object storage (S3, MinIO, etc.).
- Manage credentials with an existing secret instead of plain values.

---

## 5. Using Pilot-Specific Values

Files in `values/` (ITC, NP, ADSC, DIGI) illustrate:
- Custom CALLBACK_ADDRESS per connector
- Preconfigured DAPS endpoints
- Different Mongo/MinIO endpoints

**Guideline:** treat them as **examples**, not as production-ready values.
Replace all placeholders (`<...>`) with your own endpoints and credentials.

---

## 6. Notes & Troubleshooting

- Check `templates/NOTES.txt` after installation:

```bash
helm status my-connector -n eng-connectors
```

- If pods are stuck in `CrashLoopBackOff`:
  - Verify secrets are present in the namespace.
  - Check that the correct keystore/truststore paths are configured.
  - Ensure external dependencies (DAPS, Mongo, MinIO) are reachable.

- For multiple connectors in the same cluster:
  - Deploy multiple releases with different `--name` (or in different namespaces).
  - Optionally use separate MinIO buckets and Mongo databases.
