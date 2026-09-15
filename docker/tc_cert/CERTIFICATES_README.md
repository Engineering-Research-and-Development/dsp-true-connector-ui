# Certificate Generation Guide

## Overview

PKI hierarchy and certificate distribution for DSP True Connector:
- **Root CA** (self-signed) → signs
- **Intermediate CA** → signs
- **Server Certificates & Keystores**:
  - `connector-a` & `connector-b` (PKCS12 `.p12` keystores)
  - `rustfs` (PEM private key & fullchain certificate)
  - `ui-a` & `ui-b` (PEM private keys, certificates, & fullchain certificates for Nginx)
  - `dsp-truststore.p12` (Distributed to CA and Connectors for TLS verification)

All generated artifacts are automatically distributed into dedicated service subdirectories and verified.

---

## Quick Start

### 1. Prerequisites
- **Java keytool** (included with JDK/JRE)
- **OpenSSL** (required for exporting PEM certificates and private keys for RustFS and UI services)

### 2. Run the Script

**Linux / macOS:**
```bash
cd docker/tc_cert
chmod +x generate-certificates.sh
./generate-certificates.sh
```

**Windows:**
```cmd
cd docker\tc_cert
generate-certificates.cmd
```

The script generates the complete PKI hierarchy, converts PEM keys/certificates, organizes them into target subdirectories, and verifies all target files are present.

---

## Directory Hierarchy & Generated Files

After execution, files are distributed inside the script directory (`tc_cert`):

```text
tc_cert/
├── ca/
│   ├── dsp-root-ca.p12          # Root CA keystore (keep secure/offline)
│   ├── dsp-intermediate-ca.p12  # Intermediate CA keystore (keep secure)
│   └── dsp-truststore.p12       # Master truststore (Root CA + Intermediate CA)
├── connector-a/
│   ├── connector-a.p12          # Server keystore for Consumer application
│   └── dsp-truststore.p12       # Truststore copy for Connector-A
├── connector-b/
│   ├── connector-b.p12          # Server keystore for Provider application
│   └── dsp-truststore.p12       # Truststore copy for Connector-B
├── rustfs/
│   ├── rustfs_key.pem           # RustFS private key (PEM format, permissions 644)
│   └── rustfs_cert.pem          # RustFS certificate fullchain (server cert + Intermediate CA)
├── ui-a/
│   ├── ui-a-cert.key            # UI-A private key (PEM format for Nginx)
│   ├── ui-a-cert.crt            # UI-A server certificate
│   └── ui-a-fullchain.crt       # UI-A fullchain (server cert + Intermediate CA)
└── ui-b/
    ├── ui-b-cert.key            # UI-B private key (PEM format for Nginx)
    ├── ui-b-cert.crt            # UI-B server certificate
    └── ui-b-fullchain.crt       # UI-B fullchain (server cert + Intermediate CA)
```

### File Details

| Directory | File | Purpose | Format |
|---|---|---|---|
| `ca/` | `dsp-root-ca.p12` | Root CA key and self-signed certificate | PKCS#12 |
| `ca/` | `dsp-intermediate-ca.p12` | Intermediate CA key and certificate signed by Root CA | PKCS#12 |
| `ca/`, `connector-*/` | `dsp-truststore.p12` | Truststore containing Intermediate CA and Root CA | PKCS#12 |
| `connector-a/` | `connector-a.p12` | Identity keystore for Connector-A (Consumer) | PKCS#12 |
| `connector-b/` | `connector-b.p12` | Identity keystore for Connector-B (Provider) | PKCS#12 |
| `rustfs/` | `rustfs_key.pem` | RustFS private key (unencrypted) | PEM (`RSA PRIVATE KEY`) |
| `rustfs/` | `rustfs_cert.pem` | RustFS server certificate concatenated with Intermediate CA | PEM (`CERTIFICATE`) |
| `ui-a/` | `ui-a-cert.key` | UI-A private key for Nginx reverse proxy | PEM (`RSA PRIVATE KEY`) |
| `ui-a/` | `ui-a-cert.crt` | UI-A server certificate | PEM (`CERTIFICATE`) |
| `ui-a/` | `ui-a-fullchain.crt`| Full chain (server cert + Intermediate CA) for Nginx | PEM (`CERTIFICATE`) |
| `ui-b/` | `ui-b-cert.key` | UI-B private key for Nginx reverse proxy | PEM (`RSA PRIVATE KEY`) |
| `ui-b/` | `ui-b-cert.crt` | UI-B server certificate | PEM (`CERTIFICATE`) |
| `ui-b/` | `ui-b-fullchain.crt`| Full chain (server cert + Intermediate CA) for Nginx | PEM (`CERTIFICATE`) |

---

## Configuration Reference

Default parameters configured in the script:

```bash
# Key Algorithm and Size
KEY_ALG="RSA"
KEY_SIZE=2048

# Validity Periods (in days)
ROOT_VALIDITY=3650          # 10 years
INTERMEDIATE_VALIDITY=1825   # 5 years
SERVER_VALIDITY=365          # 1 year

# Distinguished Names (DN)
ROOT_DNAME="CN=DSP Root CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"
INTERMEDIATE_DNAME="CN=DSP Intermediate CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"

# Subject Alternative Names (SAN)
SAN_CONNECTOR_A="DNS:localhost,DNS:connector-a,IP:127.0.0.1"
SAN_CONNECTOR_B="DNS:localhost,DNS:connector-b,IP:127.0.0.1"
SAN_RUSTFS="DNS:localhost,DNS:rustfs,IP:127.0.0.1"
SAN_UI_A="DNS:localhost,DNS:ui-a,IP:127.0.0.1"
SAN_UI_B="DNS:localhost,DNS:ui-b,IP:127.0.0.1"

# Passwords (CHANGE FOR PRODUCTION!)
ROOT_PASSWORD="password"
INTERMEDIATE_PASSWORD="password"
SERVER_PASSWORD="password"
TRUSTSTORE_PASSWORD="password"
```

---

## Why Intermediate CA?

Using an Intermediate CA is a security best practice:

- ✅ **Root CA stays offline** – Only used once to sign the Intermediate CA, then archived securely.
- ✅ **Compromise isolation** – If an intermediate key is compromised, revoke it without invalidating the Root CA.
- ✅ **Easier rotation** – Rotate and re-issue server and service certificates easily without modifying trust in the Root CA.
- ✅ **Production parity** – Aligns local/development environments with real-world enterprise PKI setups.

---

## How It Works

**Certificate Chain:**
- Server certificates (connector-a, connector-b) are signed by Intermediate CA
- Intermediate CA is signed by Root CA
- Both connectors have the same truststore containing Intermediate CA
- This creates a "circle of trust" - each connector trusts certificates signed by Intermediate CA, so they trust each other

**TLS Handshake when connector-a connects to connector-b at `https://localhost:8090`:**
1. Connector-b presents connector-b.p12 certificate (signed by Intermediate CA)
2. Connector-a validates: Is the certificate signed by a trusted CA? (checks truststore → finds Intermediate CA ✅)
3. Connector-a validates: Does the hostname match a SAN? (looks for "localhost" in certificate SANs ✅)
4. TLS handshake succeeds!

### SANs (Subject Alternative Names)

Each server certificate has specific SANs for **hostname verification**:

**Connector-A Certificate:**
- `DNS:localhost`, `DNS:connector-a`, `IP:127.0.0.1`
- ✅ Works: `https://localhost`, `https://connector-a`, `https://127.0.0.1`
- ❌ Fails: `https://provider`, `https://192.168.1.100` (not in SANs)

**Important:** Only the **server certificate's SANs** matter for hostname verification. The Intermediate CA's SANs are used only for trust validation, not for hostname matching.

### Connector-to-Connector Communication

**Will it work?** ✅ YES - Both connectors have the same truststore and can verify each other's certificates.

**Connection URLs that work:**
- `https://localhost:8090` - "localhost" is in connector-b SANs
- `https://127.0.0.1:8090` - IP is in connector-b SANs
- `https://connector-b:8090` - "connector-b" is in SANs (needs DNS/hosts entry)

**Connection URLs that don't work:**
- `https://provider:8090` - "provider" is NOT in SANs
- `https://192.168.1.100:8090` - this IP is NOT in SANs
- Hostname verification will fail with: `CertificateException: No subject alternative names matching`

---

## Service Integrations

### 1. Spring Boot Connectors

#### Consumer (`connector-a`) Properties
```properties
# Server SSL (Incoming HTTPS)
server.ssl.enabled=true
server.ssl.key-alias=connector-a
server.ssl.key-password=password
server.ssl.key-store=classpath:connector-a.p12
server.ssl.key-store-password=password
server.ssl.key-store-type=PKCS12

# SSL Bundle (Outgoing HTTPS)
spring.ssl.bundle.jks.connector.keystore.location=classpath:connector-a.p12
spring.ssl.bundle.jks.connector.keystore.password=password
spring.ssl.bundle.jks.connector.keystore.type=PKCS12
spring.ssl.bundle.jks.connector.key.alias=connector-a
spring.ssl.bundle.jks.connector.key.password=password

spring.ssl.bundle.jks.connector.truststore.location=classpath:dsp-truststore.p12
spring.ssl.bundle.jks.connector.truststore.password=password
spring.ssl.bundle.jks.connector.truststore.type=PKCS12

# OCSP Validation (disable for dev/test, enable for production)
application.ocsp.validation.enabled=false
application.ocsp.validation.soft-fail=true
```

#### Provider (`connector-b`) Properties
```properties
# Server SSL (Incoming HTTPS)
server.ssl.enabled=true
server.ssl.key-alias=connector-b
server.ssl.key-password=password
server.ssl.key-store=classpath:connector-b.p12
server.ssl.key-store-password=password
server.ssl.key-store-type=PKCS12

# SSL Bundle (Outgoing HTTPS)
spring.ssl.bundle.jks.connector.keystore.location=classpath:connector-b.p12
spring.ssl.bundle.jks.connector.keystore.password=password
spring.ssl.bundle.jks.connector.keystore.type=PKCS12
spring.ssl.bundle.jks.connector.key.alias=connector-b
spring.ssl.bundle.jks.connector.key.password=password

spring.ssl.bundle.jks.connector.truststore.location=classpath:dsp-truststore.p12
spring.ssl.bundle.jks.connector.truststore.password=password
spring.ssl.bundle.jks.connector.truststore.type=PKCS12

# OCSP Validation (disable for dev/test, enable for production)
application.ocsp.validation.enabled=false
application.ocsp.validation.soft-fail=true
```

---

### 2. RustFS Storage Integration

RustFS expects standard PEM certificate chains and private keys mounted into the container.

**Docker Compose snippet:**
```yaml
services:
  rustfs:
    image: rustfs/rustfs:latest
    environment:
      - RUSTFS_TLS_PATH=/opt/tls/
    volumes:
      - ./tc_cert/rustfs:/opt/tls:ro
    ports:
      - "9000:9000"
```

Files used inside container (`/opt/tls/`):
- `rustfs_key.pem`
- `rustfs_cert.pem`

---

### 3. UI Services (Nginx Reverse Proxy)

For UI-A and UI-B running on Nginx, configure the SSL virtual host with the generated fullchain certificate and private key:

```nginx
server {
    listen 443 ssl;
    server_name ui-a localhost;

    ssl_certificate     /etc/nginx/certs/ui-a-fullchain.crt;
    ssl_certificate_key /etc/nginx/certs/ui-a-cert.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```

**Docker Compose volume mount:**
```yaml
volumes:
  - ./tc_cert/ui-a:/etc/nginx/certs:ro
```

---

## Verification Commands

### Check Keystore / Truststore Contents
```bash
# Verify connector keystore
keytool -list -v -keystore tc_cert/connector-a/connector-a.p12 -storepass password -storetype PKCS12

# Verify truststore contents (shows Root CA & Intermediate CA)
keytool -list -v -keystore tc_cert/ca/dsp-truststore.p12 -storepass password -storetype PKCS12
```

### Verify PEM Certificates and Chains
```bash
# Verify RustFS certificate subject and SANs
openssl x509 -in tc_cert/rustfs/rustfs_cert.pem -noout -text | grep -E "Subject:|DNS:|IP Address:"

# Verify RustFS certificate chain against the Root CA
openssl verify -CAfile tc_cert/ca/dsp-root-ca.p12 tc_cert/rustfs/rustfs_cert.pem

# Verify UI fullchain
openssl x509 -in tc_cert/ui-a/ui-a-fullchain.crt -noout -subject -issuer
```

### Test Live TLS Handshake
```bash
# Connector-B health endpoint
curl -v https://localhost:8090/actuator/health --cacert tc_cert/rustfs/rustfs_cert.pem

# OpenSSL s_client TLS check
openssl s_client -connect localhost:8090 -CAfile tc_cert/ui-a/ui-a-fullchain.crt
```

---

## Common Issues & Troubleshooting

| Issue | Root Cause | Solution |
|---|---|---|
| `PKIX path building failed` | Application truststore missing Intermediate CA or Root CA | Ensure the app uses `dsp-truststore.p12` which contains both CAs. |
| `No subject alternative names matching` | Requested hostname is not present in cert SANs | Connect using `localhost`, `127.0.0.1`, or the exact service name (e.g., `connector-a`, `rustfs`). Add hostnames to `SAN_*` and re-run the script if custom hostnames are needed. |
| `Permission denied` on RustFS keys | Container user cannot read `rustfs_key.pem` | The script sets `chmod 644` on RustFS keys. Ensure mounted volume maintains read permissions for the container process. |
| `OpenSSL not found` during execution | OpenSSL binary is missing in system `PATH` | Install OpenSSL (`apt-get install openssl` or `brew install openssl`). Required for PEM key and chain exports. |

---

## Production Recommendations

1. **Passwords**: Change default passwords (`password`) in configuration variables before generating certificates for non-local environments.
2. **Offline Root CA**: Archive and remove `ca/dsp-root-ca.p12` from online servers after generating intermediate certificates.
3. **Restricted File Permissions**: Set strict permissions (`chmod 600` or `400`) on all private keys (`*.key`, `*.p12`) in production environments.
4. **Certificate Rotation**: Server certificates expire in 365 days; plan automated rotation before expiration.
5. **Enable OCSP**: For production setups, configure and enable OCSP validation:
   ```properties
   application.ocsp.validation.enabled=true
   application.ocsp.validation.soft-fail=false
   ```