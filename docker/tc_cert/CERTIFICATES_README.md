# Certificate Generation Guide

## Overview

PKI hierarchy for DSP True Connector:
- **Root CA** (self-signed) → signs
- **Intermediate CA** → signs
- **Server Certificates** (connector-a, connector-b)

## Quick Start

### 1. Run the Script
```cmd
cd docker/tc_cert
generate-certificates.cmd
```

The script generates all certificates, truststore, and verifies the chain automatically.

### 2. Generated Files

| File | Purpose |
|------|---------|
| `dsp-root-ca.p12` | Root CA keystore (keep offline after generation) |
| `dsp-intermediate-ca.p12` | Intermediate CA keystore (keep secure) |
| `connector-a.p12` | Server certificate for consumer application |
| `connector-b.p12` | Server certificate for provider application |
| `private.key` / `public.crt` | MinIO private key and certificate in PEM format |
| `ui-a-cert.key` / `ui-a-cert.crt` | UI-A private key and certificate in PEM format (for nginx) |
| `ui-b-cert.key` / `ui-b-cert.crt` | UI-B private key and certificate in PEM format (for nginx) |
| `dsp-truststore.p12` | Truststore with Intermediate CA certificate (use for TLS validation) |


### 3. Edit Configuration (Optional)

Edit `generate-certificates.cmd` configuration section to customize:

```batch
REM Subject Alternative Names (SAN) - Edit for each service
set SAN_CONNECTOR_A=DNS:localhost,DNS:connector-a,IP:127.0.0.1
set SAN_CONNECTOR_B=DNS:localhost,DNS:connector-b,IP:127.0.0.1
set SAN_MINIO=DNS:localhost,DNS:minio,IP:127.0.0.1
set SAN_UI_A=DNS:localhost,DNS:ui-a,IP:127.0.0.1
set SAN_UI_B=DNS:localhost,DNS:ui-b,IP:127.0.0.1

REM Root CA Distinguished Name
set ROOT_DNAME=CN=DSP Root CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS

REM Validity periods (in days)
set ROOT_VALIDITY=3650        # 10 years
set INTERMEDIATE_VALIDITY=1825 # 5 years
set SERVER_VALIDITY=365        # 1 year

REM Passwords (CHANGE FOR PRODUCTION!)
set ROOT_PASSWORD=password
set INTERMEDIATE_PASSWORD=password
set SERVER_PASSWORD=password
set TRUSTSTORE_PASSWORD=password
```

## Why Intermediate CA?

Using an Intermediate CA is a security best practice:

✅ **Root CA stays offline** - Only used to sign Intermediate CA, then stored securely  
✅ **Compromise isolation** - Revoke compromised Intermediate CA without affecting Root CA  
✅ **Easier rotation** - Renew server certificates without touching Root CA  
✅ **Production-like** - Mimics real-world PKI structures

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

## SANs (Subject Alternative Names)

Each server certificate has specific SANs for **hostname verification**:

**Connector-A Certificate:**
- `DNS:localhost`, `DNS:connector-a`, `IP:127.0.0.1`
- ✅ Works: `https://localhost`, `https://connector-a`, `https://127.0.0.1`
- ❌ Fails: `https://provider`, `https://192.168.1.100` (not in SANs)

**Important:** Only the **server certificate's SANs** matter for hostname verification. The Intermediate CA's SANs are used only for trust validation, not for hostname matching.

## Connector-to-Connector Communication

**Will it work?** ✅ YES - Both connectors have the same truststore and can verify each other's certificates.

**Connection URLs that work:**
- `https://localhost:8090` - "localhost" is in connector-b SANs
- `https://127.0.0.1:8090` - IP is in connector-b SANs  
- `https://connector-b:8090` - "connector-b" is in SANs (needs DNS/hosts entry)

**Connection URLs that don't work:**
- `https://provider:8090` - "provider" is NOT in SANs
- `https://192.168.1.100:8090` - this IP is NOT in SANs
- Hostname verification will fail with: `CertificateException: No subject alternative names matching`

## Spring Boot Configuration

### Consumer (connector-a) Properties

```properties
# Server SSL (incoming HTTPS)
server.ssl.enabled=true
server.ssl.key-alias=connector-a
server.ssl.key-password=password
server.ssl.key-store=classpath:connector-a.p12
server.ssl.key-store-password=password
server.ssl.key-store-type=PKCS12

# SSL Bundle (outgoing HTTPS to other services)
spring.ssl.bundle.jks.connector.keystore.location=classpath:connector-a.p12
spring.ssl.bundle.jks.connector.keystore.password=password
spring.ssl.bundle.jks.connector.keystore.type=PKCS12
spring.ssl.bundle.jks.connector.key.alias=connector-a
spring.ssl.bundle.jks.connector.key.password=password

spring.ssl.bundle.jks.connector.truststore.location=classpath:dsp-truststore.p12
spring.ssl.bundle.jks.connector.truststore.password=password
spring.ssl.bundle.jks.connector.truststore.type=PKCS12

# OCSP Validation (disable for development, enable for production)
application.ocsp.validation.enabled=false
application.ocsp.validation.soft-fail=true
```

### Provider (connector-b) Properties

```properties
# Server SSL (incoming HTTPS)
server.ssl.enabled=true
server.ssl.key-alias=connector-b
server.ssl.key-password=password
server.ssl.key-store=classpath:connector-b.p12
server.ssl.key-store-password=password
server.ssl.key-store-type=PKCS12

# SSL Bundle (outgoing HTTPS to other services)
spring.ssl.bundle.jks.connector.keystore.location=classpath:connector-b.p12
spring.ssl.bundle.jks.connector.keystore.password=password
spring.ssl.bundle.jks.connector.keystore.type=PKCS12
spring.ssl.bundle.jks.connector.key.alias=connector-b
spring.ssl.bundle.jks.connector.key.password=password

spring.ssl.bundle.jks.connector.truststore.location=classpath:dsp-truststore.p12
spring.ssl.bundle.jks.connector.truststore.password=password
spring.ssl.bundle.jks.connector.truststore.type=PKCS12

# OCSP Validation (disable for development, enable for production)
application.ocsp.validation.enabled=false
application.ocsp.validation.soft-fail=true
```

**Note:** Both applications use the **same truststore** (`dsp-truststore.p12`) so they can validate each other's certificates.

## Verification Commands

```cmd
REM Check what's in a keystore
keytool -list -v -keystore connector-a.p12 -storepass password -storetype PKCS12

REM Check truststore contents
keytool -list -v -keystore dsp-truststore.p12 -storepass password -storetype PKCS12

REM Verify TLS is working (from provider startup)
curl -v https://localhost:8090/actuator/health
REM Look for: SSL connection using TLSv1.3, subject: CN=connector-b
```

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `PKIX path building failed` | Truststore doesn't contain Intermediate CA | Regenerate certificates: `generate-certificates.cmd` |
| `No subject alternative names matching` | URL hostname not in certificate SANs | Use hostname that's in SANs or add it and regenerate |
| `Certificate has expired` | Cert validity period passed | Regenerate certificates |

## Production Recommendations

- **Change passwords** - Don't use default "password"
- **Secure Root CA** - Store `dsp-root-ca.p12` offline
- **Secure Intermediate CA** - Store in secure location
- **Automate renewal** - Server certs valid 1 year (renew annually)
- **Enable OCSP** - For production, set `application.ocsp.validation.enabled=true` in properties





