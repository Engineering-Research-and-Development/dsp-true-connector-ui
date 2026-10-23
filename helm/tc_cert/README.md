# TRUE Connector Certificates

This directory is intentionally **empty** in the public repository.

To deploy the TRUE Connector you MUST provide your own keystores and truststores
(e.g. JKS / PKCS12 files) as Kubernetes secrets.

Recommended:
- Generate certificates & keystores offline.
- Store them in a secure secrets manager (Vault, SOPS, etc.).
- Mount them via:
  - `connector.certsSecret.existingSecretName` (for Java keystores)
  - `ui.tls.existingSecretName` (for UI TLS)
