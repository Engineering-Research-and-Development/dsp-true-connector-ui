#!/bin/bash
##################################################################
# Certificate Generation Script for DSP True Connector
# Creates a complete PKI hierarchy:
#   1. Root CA (self-signed)
#   2. Intermediate CA (signed by Root CA)
#   3. Server certificates (signed by Intermediate CA)
#   4. Moves generated files to their respective target directories
#   5. Verifies all files are properly in place
##################################################################

set -e  # Exit on error

# Ensure execution from the directory containing this script (e.g. /tc_cert)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

##################################################################
# CONFIGURATION - Edit these values as needed
##################################################################

# Target Directory Configuration (Relative to current script directory)
CERT_BASE_DIR="${SCRIPT_DIR}"
DIR_CA="${CERT_BASE_DIR}/ca"
DIR_CONNECTOR_A="${CERT_BASE_DIR}/connector-a"
DIR_CONNECTOR_B="${CERT_BASE_DIR}/connector-b"
DIR_S3STORAGE="${CERT_BASE_DIR}/s3storage"
DIR_UI_A="${CERT_BASE_DIR}/ui-a"
DIR_UI_B="${CERT_BASE_DIR}/ui-b"

# Root CA Configuration
ROOT_ALIAS="dsp-root-ca"
ROOT_DNAME="CN=DSP Root CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"
ROOT_VALIDITY=3650
ROOT_KEYSTORE="dsp-root-ca.p12"
ROOT_PASSWORD="password"

# Intermediate CA Configuration
INTERMEDIATE_ALIAS="dsp-intermediate-ca"
INTERMEDIATE_DNAME="CN=DSP Intermediate CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"
INTERMEDIATE_VALIDITY=1825
INTERMEDIATE_KEYSTORE="dsp-intermediate-ca.p12"
INTERMEDIATE_PASSWORD="password"

# Server Certificate Configuration
SERVER_VALIDITY=365
SERVER_PASSWORD="password"

# Subject Alternative Names (SAN) - Edit these lists as needed for each service
# Each server should only have the SANs it actually needs for security best practices
SAN_CONNECTOR_A="DNS:localhost,DNS:connector-a,IP:127.0.0.1"
SAN_CONNECTOR_B="DNS:localhost,DNS:connector-b,IP:127.0.0.1"
SAN_S3STORAGE="DNS:localhost,DNS:s3storage,IP:127.0.0.1"
SAN_UI_A="DNS:localhost,DNS:ui-a,IP:127.0.0.1"
SAN_UI_B="DNS:localhost,DNS:ui-b,IP:127.0.0.1"

# Truststore Configuration
TRUSTSTORE="dsp-truststore.p12"
TRUSTSTORE_PASSWORD="password"

# Key Algorithm and Size
KEY_ALG="RSA"
KEY_SIZE=2048

##################################################################
# START CERTIFICATE GENERATION
##################################################################

echo ""
echo "=================================================================="
echo "DSP True Connector - Certificate Generation Script"
echo "=================================================================="
echo ""
echo "Working directory: ${CERT_BASE_DIR}"
echo ""
echo "This script will generate:"
echo "  1. Root CA (self-signed)"
echo "  2. Intermediate CA (signed by Root CA)"
echo "  3. Server certificates for connector-a and connector-b"
echo "  4. S3 storage certificate (PEM format: s3storage_cert.pem & s3storage_key.pem)"
echo "  5. UI-A and UI-B certificates (PEM format with fullchain)"
echo "  6. Truststore with Intermediate CA certificate"
echo "  7. Organize files into target subdirectories inside ${CERT_BASE_DIR}"
echo "  8. Verify all required files are present"
echo ""
echo "Target Directories:"
echo "  - CA:          ${DIR_CA}"
echo "  - Connector-A: ${DIR_CONNECTOR_A}"
echo "  - Connector-B: ${DIR_CONNECTOR_B}"
echo "  - S3 storage:      ${DIR_S3STORAGE}"
echo "  - UI-A:        ${DIR_UI_A}"
echo "  - UI-B:        ${DIR_UI_B}"
echo ""
echo "Configuration:"
echo "  - connector-a SANs: ${SAN_CONNECTOR_A}"
echo "  - connector-b SANs: ${SAN_CONNECTOR_B}"
echo "  - S3 storage SANs: ${SAN_S3STORAGE}"
echo "  - UI-A SANs: ${SAN_UI_A}"
echo "  - UI-B SANs: ${SAN_UI_B}"
echo "  - Key Algorithm: ${KEY_ALG} ${KEY_SIZE} bits"
echo "  - Root CA Validity: ${ROOT_VALIDITY} days"
echo "  - Intermediate CA Validity: ${INTERMEDIATE_VALIDITY} days"
echo "  - Server Cert Validity: ${SERVER_VALIDITY} days"
echo ""
echo "=================================================================="
echo ""

read -p "Press Enter to continue..."

# Clean up old files in working directory
echo "Cleaning up old certificate files..."
rm -f "${ROOT_KEYSTORE}"
rm -f "${INTERMEDIATE_KEYSTORE}"
rm -f connector-a.p12
rm -f connector-b.p12
rm -f s3storage-temp.p12
rm -f ui-a-temp.p12
rm -f ui-b-temp.p12
rm -f s3storage_key.pem
rm -f s3storage_cert.pem
rm -f private.key
rm -f public.crt
rm -f ui-a-cert.key
rm -f ui-a-cert.crt
rm -f ui-a-fullchain.crt
rm -f ui-b-cert.key
rm -f ui-b-cert.crt
rm -f ui-b-fullchain.crt
rm -f "${TRUSTSTORE}"
rm -f *.csr
rm -f *.crt
rm -f *.cer

# Ensure destination directories exist
mkdir -p "${DIR_CA}" "${DIR_CONNECTOR_A}" "${DIR_CONNECTOR_B}" "${DIR_S3STORAGE}" "${DIR_UI_A}" "${DIR_UI_B}"

echo "Done."
echo ""

##################################################################
# STEP 1: Generate Root CA (Self-Signed)
##################################################################

echo "=================================================================="
echo "STEP 1: Generating Root CA (Self-Signed)"
echo "=================================================================="
echo ""

keytool -genkeypair \
    -alias "${ROOT_ALIAS}" \
    -keyalg "${KEY_ALG}" \
    -keysize "${KEY_SIZE}" \
    -dname "${ROOT_DNAME}" \
    -validity "${ROOT_VALIDITY}" \
    -keystore "${ROOT_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${ROOT_PASSWORD}" \
    -keypass "${ROOT_PASSWORD}" \
    -ext BasicConstraints:critical=ca:true \
    -ext KeyUsage:critical=keyCertSign,cRLSign

echo ""
echo "Root CA generated successfully!"
echo "  - Keystore: ${ROOT_KEYSTORE}"
echo "  - Alias: ${ROOT_ALIAS}"
echo ""

# Export Root CA certificate
echo "Exporting Root CA certificate..."
keytool -exportcert \
    -alias "${ROOT_ALIAS}" \
    -keystore "${ROOT_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${ROOT_PASSWORD}" \
    -file root-ca.crt \
    -rfc

echo "Done."
echo ""

##################################################################
# STEP 2: Generate Intermediate CA
##################################################################

echo "=================================================================="
echo "STEP 2: Generating Intermediate CA"
echo "=================================================================="
echo ""

# Generate Intermediate CA key pair
echo "Generating Intermediate CA key pair..."
keytool -genkeypair \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keyalg "${KEY_ALG}" \
    -keysize "${KEY_SIZE}" \
    -dname "${INTERMEDIATE_DNAME}" \
    -validity "${INTERMEDIATE_VALIDITY}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -keypass "${INTERMEDIATE_PASSWORD}" \
    -ext BasicConstraints:critical=ca:true,pathlen:0 \
    -ext KeyUsage:critical=keyCertSign,cRLSign

echo "Done."
echo ""

# Generate CSR for Intermediate CA
echo "Generating Certificate Signing Request for Intermediate CA..."
keytool -certreq \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -file intermediate-ca.csr

echo "Done."
echo ""

# Sign Intermediate CA certificate with Root CA
echo "Signing Intermediate CA certificate with Root CA..."
keytool -gencert \
    -alias "${ROOT_ALIAS}" \
    -keystore "${ROOT_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${ROOT_PASSWORD}" \
    -infile intermediate-ca.csr \
    -outfile intermediate-ca.crt \
    -validity "${INTERMEDIATE_VALIDITY}" \
    -ext BasicConstraints:critical=ca:true,pathlen:0 \
    -ext KeyUsage:critical=keyCertSign,cRLSign \
    -rfc

echo "Done."
echo ""

# Import Root CA certificate into Intermediate CA keystore
echo "Importing Root CA into Intermediate CA keystore..."
keytool -importcert \
    -alias "${ROOT_ALIAS}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -file root-ca.crt \
    -noprompt

echo "Done."
echo ""

# Import signed Intermediate CA certificate
echo "Importing signed Intermediate CA certificate..."
keytool -importcert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -file intermediate-ca.crt \
    -noprompt

echo "Done."
echo ""

echo "Intermediate CA generated successfully!"
echo "  - Keystore: ${INTERMEDIATE_KEYSTORE}"
echo "  - Alias: ${INTERMEDIATE_ALIAS}"
echo ""

##################################################################
# STEP 3: Generate Server Certificates
##################################################################

echo "=================================================================="
echo "STEP 3: Generating Server Certificates"
echo "=================================================================="
echo ""

# Function to generate server certificate
generate_server_cert() {
    local SERVER_NAME=$1
    local SERVER_DN=$2
    local SERVER_SAN=$3
    local SERVER_KEYSTORE="${SERVER_NAME}.p12"
    local SERVER_ALIAS="${SERVER_NAME}"

    echo ""
    echo "------------------------------------------------------------------"
    echo "Generating server certificate: ${SERVER_NAME}"
    echo "------------------------------------------------------------------"
    echo ""

    # Generate server key pair
    echo "Generating key pair for ${SERVER_NAME}..."
    keytool -genkeypair \
        -alias "${SERVER_ALIAS}" \
        -keyalg "${KEY_ALG}" \
        -keysize "${KEY_SIZE}" \
        -dname "${SERVER_DN}" \
        -validity "${SERVER_VALIDITY}" \
        -keystore "${SERVER_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${SERVER_PASSWORD}" \
        -keypass "${SERVER_PASSWORD}" \
        -ext KeyUsage:critical=digitalSignature,keyEncipherment \
        -ext ExtendedKeyUsage=serverAuth,clientAuth \
        -ext "SAN=${SERVER_SAN}"

    echo "Done."
    echo ""

    # Generate CSR
    echo "Generating Certificate Signing Request for ${SERVER_NAME}..."
    keytool -certreq \
        -alias "${SERVER_ALIAS}" \
        -keystore "${SERVER_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${SERVER_PASSWORD}" \
        -file "${SERVER_NAME}.csr" \
        -ext KeyUsage:critical=digitalSignature,keyEncipherment \
        -ext ExtendedKeyUsage=serverAuth,clientAuth \
        -ext "SAN=${SERVER_SAN}"

    echo "Done."
    echo ""

    # Sign with Intermediate CA
    echo "Signing ${SERVER_NAME} certificate with Intermediate CA..."
    keytool -gencert \
        -alias "${INTERMEDIATE_ALIAS}" \
        -keystore "${INTERMEDIATE_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${INTERMEDIATE_PASSWORD}" \
        -infile "${SERVER_NAME}.csr" \
        -outfile "${SERVER_NAME}.crt" \
        -validity "${SERVER_VALIDITY}" \
        -ext KeyUsage:critical=digitalSignature,keyEncipherment \
        -ext ExtendedKeyUsage=serverAuth,clientAuth \
        -ext "SAN=${SERVER_SAN}" \
        -rfc

    echo "Done."
    echo ""

    # Import certificate chain (Root CA, Intermediate CA, Server Cert)
    echo "Importing certificate chain for ${SERVER_NAME}..."

    # First import Root CA
    echo "  - Importing Root CA..."
    keytool -importcert \
        -alias "${ROOT_ALIAS}" \
        -keystore "${SERVER_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${SERVER_PASSWORD}" \
        -file root-ca.crt \
        -noprompt

    # Then import Intermediate CA
    echo "  - Importing Intermediate CA..."
    keytool -importcert \
        -alias "${INTERMEDIATE_ALIAS}" \
        -keystore "${SERVER_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${SERVER_PASSWORD}" \
        -file intermediate-ca.crt \
        -noprompt

    # Finally import signed server certificate
    echo "  - Importing signed server certificate..."
    keytool -importcert \
        -alias "${SERVER_ALIAS}" \
        -keystore "${SERVER_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${SERVER_PASSWORD}" \
        -file "${SERVER_NAME}.crt" \
        -noprompt

    echo "Done."
    echo ""
    echo "Server certificate ${SERVER_NAME} generated successfully!"
    echo "  - Keystore: ${SERVER_KEYSTORE}"
    echo "  - Alias: ${SERVER_ALIAS}"
    echo "  - SAN: ${SERVER_SAN}"
    echo ""
}

# Generate server certificates
generate_server_cert "connector-a" "CN=connector-a, OU=Connectors, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS" "${SAN_CONNECTOR_A}"
generate_server_cert "connector-b" "CN=connector-b, OU=Connectors, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS" "${SAN_CONNECTOR_B}"

echo ""
echo "All server certificates generated successfully!"
echo ""

##################################################################
# STEP 4: Generate S3 storage Certificate (s3storage_cert.pem & s3storage_key.pem)
##################################################################

echo "=================================================================="
echo "STEP 4: Generating S3 storage Certificate"
echo "=================================================================="
echo ""

S3STORAGE_DN="CN=s3storage, OU=Storage, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"
S3STORAGE_KEYSTORE="s3storage-temp.p12"
S3STORAGE_ALIAS="s3storage"

echo "Generating key pair for S3 storage..."
keytool -genkeypair \
    -alias "${S3STORAGE_ALIAS}" \
    -keyalg "${KEY_ALG}" \
    -keysize "${KEY_SIZE}" \
    -dname "${S3STORAGE_DN}" \
    -validity "${SERVER_VALIDITY}" \
    -keystore "${S3STORAGE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -keypass "${SERVER_PASSWORD}" \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_S3STORAGE}"

echo "Done."
echo ""

echo "Generating Certificate Signing Request for S3 storage..."
keytool -certreq \
    -alias "${S3STORAGE_ALIAS}" \
    -keystore "${S3STORAGE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file s3storage.csr \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_S3STORAGE}"

echo "Done."
echo ""

echo "Signing S3 storage certificate with Intermediate CA..."
keytool -gencert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -infile s3storage.csr \
    -outfile s3storage-signed.crt \
    -validity "${SERVER_VALIDITY}" \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_S3STORAGE}" \
    -rfc

echo "Done."
echo ""

echo "Importing certificate chain for S3 storage..."
echo "  - Importing Root CA..."
keytool -importcert \
    -alias "${ROOT_ALIAS}" \
    -keystore "${S3STORAGE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file root-ca.crt \
    -noprompt

echo "  - Importing Intermediate CA..."
keytool -importcert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${S3STORAGE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file intermediate-ca.crt \
    -noprompt

echo "  - Importing signed S3 storage certificate..."
keytool -importcert \
    -alias "${S3STORAGE_ALIAS}" \
    -keystore "${S3STORAGE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file s3storage-signed.crt \
    -noprompt

echo "Done."
echo ""

echo "Exporting S3 storage private key (s3storage_key.pem)..."
if command -v openssl &> /dev/null; then
    openssl pkcs12 -in "${S3STORAGE_KEYSTORE}" -nocerts -nodes -passin pass:"${SERVER_PASSWORD}" -out s3storage_key.pem
    echo "Done."
else
    echo "WARNING: OpenSSL not found. Cannot convert to PEM format automatically."
    echo "Please convert manually using:"
    echo "  openssl pkcs12 -in s3storage-temp.p12 -nocerts -nodes -passin pass:${SERVER_PASSWORD} -out s3storage_key.pem"
    cat > s3storage_key.pem << EOF
# S3 storage Private Key
# Convert from s3storage-temp.p12 using OpenSSL
# Command: openssl pkcs12 -in s3storage-temp.p12 -nocerts -nodes -passin pass:${SERVER_PASSWORD} -out s3storage_key.pem
EOF
fi
echo ""

echo "Exporting S3 storage certificate (s3storage_cert.pem)..."
if command -v openssl &> /dev/null; then
    # Create certificate chain: server cert + intermediate CA
    openssl pkcs12 -in "${S3STORAGE_KEYSTORE}" -clcerts -nokeys -passin pass:"${SERVER_PASSWORD}" -out s3storage-only.crt
    cat s3storage-only.crt intermediate-ca.crt > s3storage_cert.pem
    rm -f s3storage-only.crt
    echo "Done."
else
    echo "WARNING: OpenSSL not found. Using keytool export..."
    keytool -exportcert \
        -alias "${S3STORAGE_ALIAS}" \
        -keystore "${S3STORAGE_KEYSTORE}" \
        -storetype PKCS12 \
        -storepass "${SERVER_PASSWORD}" \
        -file s3storage_cert.pem \
        -rfc
    echo "Done."
fi
echo ""

# Ensure proper permissions for the S3 storage container user
chmod 644 s3storage_cert.pem s3storage_key.pem || true

echo "S3 storage certificate files generated:"
echo "  - s3storage_key.pem (Private key in PEM format)"
echo "  - s3storage_cert.pem (Certificate fullchain in PEM format)"
echo "  - SAN: ${SAN_S3STORAGE}"
echo ""

##################################################################
# STEP 4b: Generate UI-A Certificate (PEM format for nginx)
##################################################################

echo "=================================================================="
echo "STEP 4b: Generating UI-A Certificate (PEM format for nginx)"
echo "=================================================================="
echo ""

UI_A_NAME="ui-a"
UI_A_DN="CN=ui-a, OU=UI, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"
UI_A_KEYSTORE="ui-a-temp.p12"
UI_A_ALIAS="ui-a"

echo "Generating key pair for UI-A..."
keytool -genkeypair \
    -alias "${UI_A_ALIAS}" \
    -keyalg "${KEY_ALG}" \
    -keysize "${KEY_SIZE}" \
    -dname "${UI_A_DN}" \
    -validity "${SERVER_VALIDITY}" \
    -keystore "${UI_A_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -keypass "${SERVER_PASSWORD}" \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_UI_A}"

echo "Done."
echo ""

echo "Generating Certificate Signing Request for UI-A..."
keytool -certreq \
    -alias "${UI_A_ALIAS}" \
    -keystore "${UI_A_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file ui-a.csr \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_UI_A}"

echo "Done."
echo ""

echo "Signing UI-A certificate with Intermediate CA..."
keytool -gencert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -infile ui-a.csr \
    -outfile ui-a-signed.crt \
    -validity "${SERVER_VALIDITY}" \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_UI_A}" \
    -rfc

echo "Done."
echo ""

echo "Importing certificate chain for UI-A..."
echo "  - Importing Root CA..."
keytool -importcert \
    -alias "${ROOT_ALIAS}" \
    -keystore "${UI_A_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file root-ca.crt \
    -noprompt

echo "  - Importing Intermediate CA..."
keytool -importcert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${UI_A_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file intermediate-ca.crt \
    -noprompt

echo "  - Importing signed UI-A certificate..."
keytool -importcert \
    -alias "${UI_A_ALIAS}" \
    -keystore "${UI_A_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file ui-a-signed.crt \
    -noprompt

echo "Done."
echo ""

echo "Exporting UI-A private key to PEM format (ui-a-cert.key)..."
if command -v openssl &> /dev/null; then
    openssl pkcs12 -in "${UI_A_KEYSTORE}" -nocerts -nodes -passin pass:"${SERVER_PASSWORD}" -out ui-a-cert.key
    echo "Done."
    echo ""

    echo "Exporting UI-A certificate to PEM format (ui-a-cert.crt)..."
    openssl pkcs12 -in "${UI_A_KEYSTORE}" -clcerts -nokeys -passin pass:"${SERVER_PASSWORD}" -out ui-a-cert.crt
    echo "Done."
    echo ""

    echo "Creating fullchain certificate for UI-A (server cert + intermediate CA)..."
    cat ui-a-cert.crt intermediate-ca.crt > ui-a-fullchain.crt
    echo "Done."
else
    echo "WARNING: OpenSSL not found. Cannot convert to PEM format automatically."
    echo "Please install OpenSSL and run this script again."
fi
echo ""

echo "UI-A certificate files generated:"
echo "  - ui-a-cert.key (Private key in PEM format)"
echo "  - ui-a-cert.crt (Certificate in PEM format, signed by Intermediate CA)"
echo "  - ui-a-fullchain.crt (Full certificate chain: server cert + intermediate CA)"
echo "  - SAN: ${SAN_UI_A}"
echo ""

##################################################################
# STEP 4c: Generate UI-B Certificate (PEM format for nginx)
##################################################################

echo "=================================================================="
echo "STEP 4c: Generating UI-B Certificate (PEM format for nginx)"
echo "=================================================================="
echo ""

UI_B_NAME="ui-b"
UI_B_DN="CN=ui-b, OU=UI, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS"
UI_B_KEYSTORE="ui-b-temp.p12"
UI_B_ALIAS="ui-b"

echo "Generating key pair for UI-B..."
keytool -genkeypair \
    -alias "${UI_B_ALIAS}" \
    -keyalg "${KEY_ALG}" \
    -keysize "${KEY_SIZE}" \
    -dname "${UI_B_DN}" \
    -validity "${SERVER_VALIDITY}" \
    -keystore "${UI_B_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -keypass "${SERVER_PASSWORD}" \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_UI_B}"

echo "Done."
echo ""

echo "Generating Certificate Signing Request for UI-B..."
keytool -certreq \
    -alias "${UI_B_ALIAS}" \
    -keystore "${UI_B_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file ui-b.csr \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_UI_B}"

echo "Done."
echo ""

echo "Signing UI-B certificate with Intermediate CA..."
keytool -gencert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${INTERMEDIATE_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${INTERMEDIATE_PASSWORD}" \
    -infile ui-b.csr \
    -outfile ui-b-signed.crt \
    -validity "${SERVER_VALIDITY}" \
    -ext KeyUsage:critical=digitalSignature,keyEncipherment \
    -ext ExtendedKeyUsage=serverAuth,clientAuth \
    -ext "SAN=${SAN_UI_B}" \
    -rfc

echo "Done."
echo ""

echo "Importing certificate chain for UI-B..."
echo "  - Importing Root CA..."
keytool -importcert \
    -alias "${ROOT_ALIAS}" \
    -keystore "${UI_B_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file root-ca.crt \
    -noprompt

echo "  - Importing Intermediate CA..."
keytool -importcert \
    -alias "${INTERMEDIATE_ALIAS}" \
    -keystore "${UI_B_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file intermediate-ca.crt \
    -noprompt

echo "  - Importing signed UI-B certificate..."
keytool -importcert \
    -alias "${UI_B_ALIAS}" \
    -keystore "${UI_B_KEYSTORE}" \
    -storetype PKCS12 \
    -storepass "${SERVER_PASSWORD}" \
    -file ui-b-signed.crt \
    -noprompt

echo "Done."
echo ""

echo "Exporting UI-B private key to PEM format (ui-b-cert.key)..."
if command -v openssl &> /dev/null; then
    openssl pkcs12 -in "${UI_B_KEYSTORE}" -nocerts -nodes -passin pass:"${SERVER_PASSWORD}" -out ui-b-cert.key
    echo "Done."
    echo ""

    echo "Exporting UI-B certificate to PEM format (ui-b-cert.crt)..."
    openssl pkcs12 -in "${UI_B_KEYSTORE}" -clcerts -nokeys -passin pass:"${SERVER_PASSWORD}" -out ui-b-cert.crt
    echo "Done."
    echo ""

    echo "Creating fullchain certificate for UI-B (server cert + intermediate CA)..."
    cat ui-b-cert.crt intermediate-ca.crt > ui-b-fullchain.crt
    echo "Done."
else
    echo "WARNING: OpenSSL not found. Cannot convert to PEM format automatically."
    echo "Please install OpenSSL and run this script again."
fi
echo ""

echo "UI-B certificate files generated:"
echo "  - ui-b-cert.key (Private key in PEM format)"
echo "  - ui-b-cert.crt (Certificate in PEM format, signed by Intermediate CA)"
echo "  - ui-b-fullchain.crt (Full certificate chain: server cert + intermediate CA)"
echo "  - SAN: ${SAN_UI_B}"
echo ""

##################################################################
# STEP 5: Create Truststore with Intermediate CA
##################################################################

echo "=================================================================="
echo "STEP 5: Creating Truststore"
echo "=================================================================="
echo ""

echo "Creating truststore with Intermediate CA certificate..."
keytool -importcert \
    -trustcacerts \
    -alias "${INTERMEDIATE_ALIAS}" \
    -file intermediate-ca.crt \
    -keystore "${TRUSTSTORE}" \
    -storetype PKCS12 \
    -storepass "${TRUSTSTORE_PASSWORD}" \
    -noprompt

echo ""
echo "Importing Root CA certificate into truststore (optional, for complete chain)..."
keytool -importcert \
    -trustcacerts \
    -alias "${ROOT_ALIAS}" \
    -file root-ca.crt \
    -keystore "${TRUSTSTORE}" \
    -storetype PKCS12 \
    -storepass "${TRUSTSTORE_PASSWORD}" \
    -noprompt

echo "Done."
echo ""

##################################################################
# STEP 6: Verification of Keystores & Content
##################################################################

echo "=================================================================="
echo "STEP 6: Verifying Generated Certificates"
echo "=================================================================="
echo ""

echo "Root CA Keystore:"
keytool -list -v -keystore "${ROOT_KEYSTORE}" -storepass "${ROOT_PASSWORD}" -storetype PKCS12 | grep -E "Alias|Owner|Issuer|Valid"
echo ""

echo "Intermediate CA Keystore:"
keytool -list -v -keystore "${INTERMEDIATE_KEYSTORE}" -storepass "${INTERMEDIATE_PASSWORD}" -storetype PKCS12 | grep -E "Alias|Owner|Issuer|Valid"
echo ""

echo "Connector-A Keystore:"
keytool -list -v -keystore connector-a.p12 -storepass "${SERVER_PASSWORD}" -storetype PKCS12 | grep -E "Alias|Owner|Issuer|Valid|DNS"
echo ""

echo "Connector-B Keystore:"
keytool -list -v -keystore connector-b.p12 -storepass "${SERVER_PASSWORD}" -storetype PKCS12 | grep -E "Alias|Owner|Issuer|Valid|DNS"
echo ""

echo "S3 storage Certificate Files:"
echo "  - s3storage_key.pem: Private key in PEM format"
echo "  - s3storage_cert.pem: Certificate in PEM format"
if [ -f s3storage_key.pem ]; then
    echo "  s3storage_key.pem exists: YES"
    grep "BEGIN" s3storage_key.pem || true
else
    echo "  s3storage_key.pem exists: NO"
fi
if [ -f s3storage_cert.pem ]; then
    echo "  s3storage_cert.pem exists: YES"
    grep "BEGIN CERTIFICATE" s3storage_cert.pem || true
else
    echo "  s3storage_cert.pem exists: NO"
fi
echo ""

echo "Truststore:"
keytool -list -v -keystore "${TRUSTSTORE}" -storepass "${TRUSTSTORE_PASSWORD}" -storetype PKCS12 | grep -E "Alias|Owner|Issuer|Valid"
echo ""

##################################################################
# CLEANUP OF TEMPORARY BUILD FILES
##################################################################

echo "=================================================================="
echo "Cleaning up temporary build files..."
echo "=================================================================="
echo ""

rm -f *.csr
rm -f root-ca.crt
rm -f intermediate-ca.crt
rm -f s3storage-signed.crt
rm -f ui-a-signed.crt
rm -f ui-b-signed.crt
rm -f connector-a.crt
rm -f connector-b.crt
rm -f *.cer
rm -f s3storage-temp.p12
rm -f ui-a-temp.p12
rm -f ui-b-temp.p12

echo "Done."
echo ""

##################################################################
# STEP 7: Move Certificates to Respective Directories
##################################################################

echo "=================================================================="
echo "STEP 7: Moving Certificates to Respective Directories"
echo "=================================================================="
echo ""

# Move CA certificates and master truststore
echo "Moving CA files to ${DIR_CA}..."
mv -f "${ROOT_KEYSTORE}" "${DIR_CA}/"
mv -f "${INTERMEDIATE_KEYSTORE}" "${DIR_CA}/"

# Distribute truststore to connectors and place master copy in CA
echo "Distributing truststore..."
cp -f "${TRUSTSTORE}" "${DIR_CONNECTOR_A}/"
cp -f "${TRUSTSTORE}" "${DIR_CONNECTOR_B}/"
mv -f "${TRUSTSTORE}" "${DIR_CA}/"

# Move connector keystores
echo "Moving Connector-A certificate to ${DIR_CONNECTOR_A}..."
mv -f connector-a.p12 "${DIR_CONNECTOR_A}/"

echo "Moving Connector-B certificate to ${DIR_CONNECTOR_B}..."
mv -f connector-b.p12 "${DIR_CONNECTOR_B}/"

# Move S3 storage certificates
echo "Moving S3 storage certificates to ${DIR_S3STORAGE}..."
mv -f s3storage_key.pem "${DIR_S3STORAGE}/"
mv -f s3storage_cert.pem "${DIR_S3STORAGE}/"
chmod 644 "${DIR_S3STORAGE}/s3storage_key.pem" "${DIR_S3STORAGE}/s3storage_cert.pem" || true

# Move UI certificates
echo "Moving UI-A certificates to ${DIR_UI_A}..."
mv -f ui-a-cert.key "${DIR_UI_A}/"
mv -f ui-a-cert.crt "${DIR_UI_A}/"
mv -f ui-a-fullchain.crt "${DIR_UI_A}/"

echo "Moving UI-B certificates to ${DIR_UI_B}..."
mv -f ui-b-cert.key "${DIR_UI_B}/"
mv -f ui-b-cert.crt "${DIR_UI_B}/"
mv -f ui-b-fullchain.crt "${DIR_UI_B}/"

echo "All certificates and keys moved successfully."
echo ""

##################################################################
# STEP 8: Check and Verify File Placement
##################################################################

echo "=================================================================="
echo "STEP 8: Checking If All Files Are In Place"
echo "=================================================================="
echo ""

ALL_PRESENT=true

check_target_file() {
    local FILE_PATH="$1"
    local FILE_DESC="$2"

    if [ -f "${FILE_PATH}" ]; then
        echo "  [OK] ${FILE_PATH} (${FILE_DESC})"
    else
        echo "  [MISSING] ${FILE_PATH} (${FILE_DESC})"
        ALL_PRESENT=false
    fi
}

echo "CA directory (${DIR_CA}):"
check_target_file "${DIR_CA}/${ROOT_KEYSTORE}" "Root CA Keystore"
check_target_file "${DIR_CA}/${INTERMEDIATE_KEYSTORE}" "Intermediate CA Keystore"
check_target_file "${DIR_CA}/${TRUSTSTORE}" "Truststore"
echo ""

echo "Connector-A directory (${DIR_CONNECTOR_A}):"
check_target_file "${DIR_CONNECTOR_A}/connector-a.p12" "Server Keystore"
check_target_file "${DIR_CONNECTOR_A}/${TRUSTSTORE}" "Truststore"
echo ""

echo "Connector-B directory (${DIR_CONNECTOR_B}):"
check_target_file "${DIR_CONNECTOR_B}/connector-b.p12" "Server Keystore"
check_target_file "${DIR_CONNECTOR_B}/${TRUSTSTORE}" "Truststore"
echo ""

echo "S3 storage directory (${DIR_S3STORAGE}):"
check_target_file "${DIR_S3STORAGE}/s3storage_key.pem" "Private Key"
check_target_file "${DIR_S3STORAGE}/s3storage_cert.pem" "Certificate Full Chain"
echo ""

echo "UI-A directory (${DIR_UI_A}):"
check_target_file "${DIR_UI_A}/ui-a-cert.key" "Private Key"
check_target_file "${DIR_UI_A}/ui-a-cert.crt" "Server Certificate"
check_target_file "${DIR_UI_A}/ui-a-fullchain.crt" "Full Chain Certificate"
echo ""

echo "UI-B directory (${DIR_UI_B}):"
check_target_file "${DIR_UI_B}/ui-b-cert.key" "Private Key"
check_target_file "${DIR_UI_B}/ui-b-cert.crt" "Server Certificate"
check_target_file "${DIR_UI_B}/ui-b-fullchain.crt" "Full Chain Certificate"
echo ""

if [ "${ALL_PRESENT}" = true ]; then
    echo "=================================================================="
    echo "ALL CERTIFICATE FILES ARE IN PLACE AND VERIFIED SUCCESSFULLY!"
    echo "=================================================================="
else
    echo "=================================================================="
    echo "ERROR: One or more certificate files are missing! Check output above."
    echo "=================================================================="
    exit 1
fi
echo ""

##################################################################
# SUMMARY
##################################################################

echo "=================================================================="
echo "CERTIFICATE GENERATION & DISTRIBUTION COMPLETE"
echo "=================================================================="
echo ""
echo "Organized directory hierarchy inside ${CERT_BASE_DIR}:"
echo "  - CA (${DIR_CA}/):"
echo "      * ${ROOT_KEYSTORE}"
echo "      * ${INTERMEDIATE_KEYSTORE}"
echo "      * ${TRUSTSTORE}"
echo "  - Connector-A (${DIR_CONNECTOR_A}/):"
echo "      * connector-a.p12"
echo "      * ${TRUSTSTORE}"
echo "  - Connector-B (${DIR_CONNECTOR_B}/):"
echo "      * connector-b.p12"
echo "      * ${TRUSTSTORE}"
echo "  - S3 storage (${DIR_S3STORAGE}/):"
echo "      * s3storage_key.pem"
echo "      * s3storage_cert.pem"
echo "  - UI-A (${DIR_UI_A}/):"
echo "      * ui-a-cert.key"
echo "      * ui-a-cert.crt"
echo "      * ui-a-fullchain.crt"
echo "  - UI-B (${DIR_UI_B}/):"
echo "      * ui-b-cert.key"
echo "      * ui-b-cert.crt"
echo "      * ui-b-fullchain.crt"
echo ""
echo "For S3 storage Docker compose mounting:"
echo "  Mount:       - ./tc_cert/s3storage:/opt/tls:ro"
echo "  Environment: S3STORAGE_TLS_PATH=/opt/tls/"
echo ""
echo "=================================================================="