@echo off
REM ==================================================================
REM Certificate Generation Script for DSP True Connector
REM Creates a complete PKI hierarchy:
REM   1. Root CA (self-signed)
REM   2. Intermediate CA (signed by Root CA)
REM   3. Server certificates (signed by Intermediate CA)
REM   4. Moves generated files to their respective target directories
REM   5. Verifies all files are properly in place
REM ==================================================================

setlocal enabledelayedexpansion

REM Ensure execution from the directory containing this script (e.g. \tc_cert)
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM ==================================================================
REM CONFIGURATION - Edit these values as needed
REM ==================================================================

REM Target Directory Configuration (Relative to current script directory)
set "CERT_BASE_DIR=%CD%"
set "DIR_CA=%CERT_BASE_DIR%\ca"
set "DIR_CONNECTOR_A=%CERT_BASE_DIR%\connector-a"
set "DIR_CONNECTOR_B=%CERT_BASE_DIR%\connector-b"
set "DIR_S3STORAGE=%CERT_BASE_DIR%\s3storage"
set "DIR_UI_A=%CERT_BASE_DIR%\ui-a"
set "DIR_UI_B=%CERT_BASE_DIR%\ui-b"

REM Root CA Configuration
set ROOT_ALIAS=dsp-root-ca
set ROOT_DNAME=CN=DSP Root CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS
set ROOT_VALIDITY=3650
set ROOT_KEYSTORE=dsp-root-ca.p12
set ROOT_PASSWORD=password

REM Intermediate CA Configuration
set INTERMEDIATE_ALIAS=dsp-intermediate-ca
set INTERMEDIATE_DNAME=CN=DSP Intermediate CA, OU=Security, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS
set INTERMEDIATE_VALIDITY=1825
set INTERMEDIATE_KEYSTORE=dsp-intermediate-ca.p12
set INTERMEDIATE_PASSWORD=password

REM Server Certificate Configuration
set SERVER_VALIDITY=365
set SERVER_PASSWORD=password

REM Subject Alternative Names (SAN) - Edit these lists as needed for each service
REM Each server should only have the SANs it actually needs for security best practices
set SAN_CONNECTOR_A=DNS:localhost,DNS:connector-a,IP:127.0.0.1
set SAN_CONNECTOR_B=DNS:localhost,DNS:connector-b,IP:127.0.0.1
set SAN_S3STORAGE=DNS:localhost,DNS:s3storage,IP:127.0.0.1
set SAN_UI_A=DNS:localhost,DNS:ui-a,IP:127.0.0.1
set SAN_UI_B=DNS:localhost,DNS:ui-b,IP:127.0.0.1

REM Truststore Configuration
set TRUSTSTORE=dsp-truststore.p12
set TRUSTSTORE_PASSWORD=password

REM Key Algorithm and Size
set KEY_ALG=RSA
set KEY_SIZE=2048

REM ==================================================================
REM START CERTIFICATE GENERATION
REM ==================================================================

echo.
echo ==================================================================
echo DSP True Connector - Certificate Generation Script
echo ==================================================================
echo.
echo Working directory: %CERT_BASE_DIR%
echo.
echo This script will generate:
echo   1. Root CA (self-signed)
echo   2. Intermediate CA (signed by Root CA)
echo   3. Server certificates for connector-a and connector-b
echo   4. S3 storage certificate (PEM format: s3storage_cert.pem ^& s3storage_key.pem)
echo   5. UI-A and UI-B certificates (PEM format with fullchain)
echo   6. Truststore with Intermediate CA certificate
echo   7. Organize files into target subdirectories inside %CERT_BASE_DIR%
echo   8. Verify all required files are present
echo.
echo Target Directories:
echo   - CA:          %DIR_CA%
echo   - Connector-A: %DIR_CONNECTOR_A%
echo   - Connector-B: %DIR_CONNECTOR_B%
echo   - S3 storage:      %DIR_S3STORAGE%
echo   - UI-A:        %DIR_UI_A%
echo   - UI-B:        %DIR_UI_B%
echo.
echo Configuration:
echo   - connector-a SANs: %SAN_CONNECTOR_A%
echo   - connector-b SANs: %SAN_CONNECTOR_B%
echo   - S3 storage SANs:      %SAN_S3STORAGE%
echo   - UI-A SANs:        %SAN_UI_A%
echo   - UI-B SANs:        %SAN_UI_B%
echo   - Key Algorithm:    %KEY_ALG% %KEY_SIZE% bits
echo   - Root CA Validity: %ROOT_VALIDITY% days
echo   - Intermediate CA Validity: %INTERMEDIATE_VALIDITY% days
echo   - Server Cert Validity:     %SERVER_VALIDITY% days
echo.
echo ==================================================================
echo.

pause

REM Clean up old files in working directory
echo Cleaning up old certificate files...
if exist %ROOT_KEYSTORE% del /f /q %ROOT_KEYSTORE%
if exist %INTERMEDIATE_KEYSTORE% del /f /q %INTERMEDIATE_KEYSTORE%
if exist connector-a.p12 del /f /q connector-a.p12
if exist connector-b.p12 del /f /q connector-b.p12
if exist s3storage-temp.p12 del /f /q s3storage-temp.p12
if exist ui-a-temp.p12 del /f /q ui-a-temp.p12
if exist ui-b-temp.p12 del /f /q ui-b-temp.p12
if exist s3storage_key.pem del /f /q s3storage_key.pem
if exist s3storage_cert.pem del /f /q s3storage_cert.pem
if exist private.key del /f /q private.key
if exist public.crt del /f /q public.crt
if exist ui-a-cert.key del /f /q ui-a-cert.key
if exist ui-a-cert.crt del /f /q ui-a-cert.crt
if exist ui-a-fullchain.crt del /f /q ui-a-fullchain.crt
if exist ui-b-cert.key del /f /q ui-b-cert.key
if exist ui-b-cert.crt del /f /q ui-b-cert.crt
if exist ui-b-fullchain.crt del /f /q ui-b-fullchain.crt
if exist %TRUSTSTORE% del /f /q %TRUSTSTORE%
if exist *.csr del /f /q *.csr
if exist *.crt del /f /q *.crt
if exist *.cer del /f /q *.cer

REM Ensure destination directories exist
if not exist "%DIR_CA%" mkdir "%DIR_CA%"
if not exist "%DIR_CONNECTOR_A%" mkdir "%DIR_CONNECTOR_A%"
if not exist "%DIR_CONNECTOR_B%" mkdir "%DIR_CONNECTOR_B%"
if not exist "%DIR_S3STORAGE%" mkdir "%DIR_S3STORAGE%"
if not exist "%DIR_UI_A%" mkdir "%DIR_UI_A%"
if not exist "%DIR_UI_B%" mkdir "%DIR_UI_B%"

echo Done.
echo.

REM ==================================================================
REM STEP 1: Generate Root CA (Self-Signed)
REM ==================================================================

echo ==================================================================
echo STEP 1: Generating Root CA (Self-Signed)
echo ==================================================================
echo.

keytool -genkeypair ^
    -alias %ROOT_ALIAS% ^
    -keyalg %KEY_ALG% ^
    -keysize %KEY_SIZE% ^
    -dname "%ROOT_DNAME%" ^
    -validity %ROOT_VALIDITY% ^
    -keystore %ROOT_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %ROOT_PASSWORD% ^
    -keypass %ROOT_PASSWORD% ^
    -ext BasicConstraints:critical=ca:true ^
    -ext KeyUsage:critical=keyCertSign,cRLSign

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Root CA
    exit /b 1
)

echo.
echo Root CA generated successfully!
echo   - Keystore: %ROOT_KEYSTORE%
echo   - Alias: %ROOT_ALIAS%
echo.

REM Export Root CA certificate
echo Exporting Root CA certificate...
keytool -exportcert ^
    -alias %ROOT_ALIAS% ^
    -keystore %ROOT_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %ROOT_PASSWORD% ^
    -file root-ca.crt ^
    -rfc

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to export Root CA certificate
    exit /b 1
)
echo Done.
echo.

REM ==================================================================
REM STEP 2: Generate Intermediate CA
REM ==================================================================

echo ==================================================================
echo STEP 2: Generating Intermediate CA
echo ==================================================================
echo.

REM Generate Intermediate CA key pair
echo Generating Intermediate CA key pair...
keytool -genkeypair ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keyalg %KEY_ALG% ^
    -keysize %KEY_SIZE% ^
    -dname "%INTERMEDIATE_DNAME%" ^
    -validity %INTERMEDIATE_VALIDITY% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -keypass %INTERMEDIATE_PASSWORD% ^
    -ext BasicConstraints:critical=ca:true,pathlen:0 ^
    -ext KeyUsage:critical=keyCertSign,cRLSign

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Intermediate CA key pair
    exit /b 1
)
echo Done.
echo.

REM Generate CSR for Intermediate CA
echo Generating Certificate Signing Request for Intermediate CA...
keytool -certreq ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -file intermediate-ca.csr

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate Intermediate CA CSR
    exit /b 1
)
echo Done.
echo.

REM Sign Intermediate CA certificate with Root CA
echo Signing Intermediate CA certificate with Root CA...
keytool -gencert ^
    -alias %ROOT_ALIAS% ^
    -keystore %ROOT_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %ROOT_PASSWORD% ^
    -infile intermediate-ca.csr ^
    -outfile intermediate-ca.crt ^
    -validity %INTERMEDIATE_VALIDITY% ^
    -ext BasicConstraints:critical=ca:true,pathlen:0 ^
    -ext KeyUsage:critical=keyCertSign,cRLSign ^
    -rfc

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to sign Intermediate CA certificate
    exit /b 1
)
echo Done.
echo.

REM Import Root CA certificate into Intermediate CA keystore
echo Importing Root CA into Intermediate CA keystore...
keytool -importcert ^
    -alias %ROOT_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -file root-ca.crt ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import Root CA into Intermediate keystore
    exit /b 1
)
echo Done.
echo.

REM Import signed Intermediate CA certificate
echo Importing signed Intermediate CA certificate...
keytool -importcert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -file intermediate-ca.crt ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import Intermediate CA certificate
    exit /b 1
)
echo Done.
echo.

echo Intermediate CA generated successfully!
echo   - Keystore: %INTERMEDIATE_KEYSTORE%
echo   - Alias: %INTERMEDIATE_ALIAS%
echo.

REM ==================================================================
REM STEP 3: Generate Server Certificates
REM ==================================================================

echo ==================================================================
echo STEP 3: Generating Server Certificates
echo ==================================================================
echo.

REM Generate server certificates
call :GenerateServerCert connector-a "CN=connector-a, OU=Connectors, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS" "%SAN_CONNECTOR_A%"
call :GenerateServerCert connector-b "CN=connector-b, OU=Connectors, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS" "%SAN_CONNECTOR_B%"

echo.
echo All server certificates generated successfully!
echo.

REM ==================================================================
REM STEP 4: Generate S3 storage Certificate (s3storage_cert.pem & s3storage_key.pem)
REM ==================================================================

echo ==================================================================
echo STEP 4: Generating S3 storage Certificate
echo ==================================================================
echo.

set S3STORAGE_DN=CN=s3storage, OU=Storage, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS
set S3STORAGE_KEYSTORE=s3storage-temp.p12
set S3STORAGE_ALIAS=s3storage

echo Generating key pair for S3 storage...
keytool -genkeypair ^
    -alias %S3STORAGE_ALIAS% ^
    -keyalg %KEY_ALG% ^
    -keysize %KEY_SIZE% ^
    -dname "%S3STORAGE_DN%" ^
    -validity %SERVER_VALIDITY% ^
    -keystore %S3STORAGE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -keypass %SERVER_PASSWORD% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_S3STORAGE%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate key pair for S3 storage
    exit /b 1
)
echo Done.
echo.

echo Generating Certificate Signing Request for S3 storage...
keytool -certreq ^
    -alias %S3STORAGE_ALIAS% ^
    -keystore %S3STORAGE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file s3storage.csr ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_S3STORAGE%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate CSR for S3 storage
    exit /b 1
)
echo Done.
echo.

echo Signing S3 storage certificate with Intermediate CA...
keytool -gencert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -infile s3storage.csr ^
    -outfile s3storage-signed.crt ^
    -validity %SERVER_VALIDITY% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_S3STORAGE%" ^
    -rfc

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to sign certificate for S3 storage
    exit /b 1
)
echo Done.
echo.

echo Importing certificate chain for S3 storage...
echo   - Importing Root CA...
keytool -importcert ^
    -alias %ROOT_ALIAS% ^
    -keystore %S3STORAGE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file root-ca.crt ^
    -noprompt

echo   - Importing Intermediate CA...
keytool -importcert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %S3STORAGE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file intermediate-ca.crt ^
    -noprompt

echo   - Importing signed S3 storage certificate...
keytool -importcert ^
    -alias %S3STORAGE_ALIAS% ^
    -keystore %S3STORAGE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file s3storage-signed.crt ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import certificate chain for S3 storage
    exit /b 1
)
echo Done.
echo.

echo Exporting S3 storage private key (s3storage_key.pem)...
where openssl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    openssl pkcs12 -in %S3STORAGE_KEYSTORE% -nocerts -nodes -passin pass:%SERVER_PASSWORD% -out s3storage_key.pem
    echo Done.
) else (
    echo WARNING: OpenSSL not found. Cannot convert to PEM format automatically.
    echo Please convert manually using:
    echo   openssl pkcs12 -in s3storage-temp.p12 -nocerts -nodes -passin pass:%SERVER_PASSWORD% -out s3storage_key.pem
    echo # S3 storage Private Key> s3storage_key.pem
    echo # Convert from s3storage-temp.p12 using OpenSSL>> s3storage_key.pem
    echo # Command: openssl pkcs12 -in s3storage-temp.p12 -nocerts -nodes -passin pass:%SERVER_PASSWORD% -out s3storage_key.pem>> s3storage_key.pem
)
echo.

echo Exporting S3 storage certificate (s3storage_cert.pem)...
where openssl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    openssl pkcs12 -in %S3STORAGE_KEYSTORE% -clcerts -nokeys -passin pass:%SERVER_PASSWORD% -out s3storage-only.crt
    type s3storage-only.crt intermediate-ca.crt > s3storage_cert.pem
    if exist s3storage-only.crt del s3storage-only.crt
    echo Done.
) else (
    echo WARNING: OpenSSL not found. Using keytool export...
    keytool -exportcert ^
        -alias %S3STORAGE_ALIAS% ^
        -keystore %S3STORAGE_KEYSTORE% ^
        -storetype PKCS12 ^
        -storepass %SERVER_PASSWORD% ^
        -file s3storage_cert.pem ^
        -rfc
    echo Done.
)
echo.

echo S3 storage certificate files generated:
echo   - s3storage_key.pem (Private key in PEM format)
echo   - s3storage_cert.pem (Certificate fullchain in PEM format)
echo   - SAN: %SAN_S3STORAGE%
echo.

REM ==================================================================
REM STEP 4b: Generate UI-A Certificate (PEM format for nginx)
REM ==================================================================

echo ==================================================================
echo STEP 4b: Generating UI-A Certificate (PEM format for nginx)
echo ==================================================================
echo.

set UI_A_NAME=ui-a
set UI_A_DN=CN=ui-a, OU=UI, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS
set UI_A_KEYSTORE=ui-a-temp.p12
set UI_A_ALIAS=ui-a

echo Generating key pair for UI-A...
keytool -genkeypair ^
    -alias %UI_A_ALIAS% ^
    -keyalg %KEY_ALG% ^
    -keysize %KEY_SIZE% ^
    -dname "%UI_A_DN%" ^
    -validity %SERVER_VALIDITY% ^
    -keystore %UI_A_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -keypass %SERVER_PASSWORD% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_UI_A%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate key pair for UI-A
    exit /b 1
)
echo Done.
echo.

echo Generating Certificate Signing Request for UI-A...
keytool -certreq ^
    -alias %UI_A_ALIAS% ^
    -keystore %UI_A_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file ui-a.csr ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_UI_A%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate CSR for UI-A
    exit /b 1
)
echo Done.
echo.

echo Signing UI-A certificate with Intermediate CA...
keytool -gencert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -infile ui-a.csr ^
    -outfile ui-a-signed.crt ^
    -validity %SERVER_VALIDITY% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_UI_A%" ^
    -rfc

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to sign certificate for UI-A
    exit /b 1
)
echo Done.
echo.

echo Importing certificate chain for UI-A...
echo   - Importing Root CA...
keytool -importcert ^
    -alias %ROOT_ALIAS% ^
    -keystore %UI_A_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file root-ca.crt ^
    -noprompt

echo   - Importing Intermediate CA...
keytool -importcert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %UI_A_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file intermediate-ca.crt ^
    -noprompt

echo   - Importing signed UI-A certificate...
keytool -importcert ^
    -alias %UI_A_ALIAS% ^
    -keystore %UI_A_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file ui-a-signed.crt ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import certificate chain for UI-A
    exit /b 1
)
echo Done.
echo.

echo Exporting UI-A private key to PEM format (ui-a-cert.key)...
where openssl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    openssl pkcs12 -in %UI_A_KEYSTORE% -nocerts -nodes -passin pass:%SERVER_PASSWORD% -out ui-a-cert.key
    echo Done.
    echo.
    echo Exporting UI-A certificate to PEM format (ui-a-cert.crt)...
    openssl pkcs12 -in %UI_A_KEYSTORE% -clcerts -nokeys -passin pass:%SERVER_PASSWORD% -out ui-a-cert.crt
    echo Done.
    echo.
    echo Creating fullchain certificate for UI-A (server cert + intermediate CA)...
    type ui-a-cert.crt intermediate-ca.crt > ui-a-fullchain.crt
    echo Done.
) else (
    echo WARNING: OpenSSL not found. Cannot convert to PEM format automatically.
    echo Please install OpenSSL and run this script again.
)
echo.

echo UI-A certificate files generated:
echo   - ui-a-cert.key (Private key in PEM format)
echo   - ui-a-cert.crt (Certificate in PEM format, signed by Intermediate CA)
echo   - ui-a-fullchain.crt (Full certificate chain: server cert + intermediate CA)
echo   - SAN: %SAN_UI_A%
echo.

REM ==================================================================
REM STEP 4c: Generate UI-B Certificate (PEM format for nginx)
REM ==================================================================

echo ==================================================================
echo STEP 4c: Generating UI-B Certificate (PEM format for nginx)
echo ==================================================================
echo.

set UI_B_NAME=ui-b
set UI_B_DN=CN=ui-b, OU=UI, O=DSP True Connector, L=Belgrade, ST=Serbia, C=RS
set UI_B_KEYSTORE=ui-b-temp.p12
set UI_B_ALIAS=ui-b

echo Generating key pair for UI-B...
keytool -genkeypair ^
    -alias %UI_B_ALIAS% ^
    -keyalg %KEY_ALG% ^
    -keysize %KEY_SIZE% ^
    -dname "%UI_B_DN%" ^
    -validity %SERVER_VALIDITY% ^
    -keystore %UI_B_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -keypass %SERVER_PASSWORD% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_UI_B%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate key pair for UI-B
    exit /b 1
)
echo Done.
echo.

echo Generating Certificate Signing Request for UI-B...
keytool -certreq ^
    -alias %UI_B_ALIAS% ^
    -keystore %UI_B_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file ui-b.csr ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_UI_B%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate CSR for UI-B
    exit /b 1
)
echo Done.
echo.

echo Signing UI-B certificate with Intermediate CA...
keytool -gencert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -infile ui-b.csr ^
    -outfile ui-b-signed.crt ^
    -validity %SERVER_VALIDITY% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SAN_UI_B%" ^
    -rfc

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to sign certificate for UI-B
    exit /b 1
)
echo Done.
echo.

echo Importing certificate chain for UI-B...
echo   - Importing Root CA...
keytool -importcert ^
    -alias %ROOT_ALIAS% ^
    -keystore %UI_B_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file root-ca.crt ^
    -noprompt

echo   - Importing Intermediate CA...
keytool -importcert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %UI_B_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file intermediate-ca.crt ^
    -noprompt

echo   - Importing signed UI-B certificate...
keytool -importcert ^
    -alias %UI_B_ALIAS% ^
    -keystore %UI_B_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file ui-b-signed.crt ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import certificate chain for UI-B
    exit /b 1
)
echo Done.
echo.

echo Exporting UI-B private key to PEM format (ui-b-cert.key)...
where openssl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    openssl pkcs12 -in %UI_B_KEYSTORE% -nocerts -nodes -passin pass:%SERVER_PASSWORD% -out ui-b-cert.key
    echo Done.
    echo.
    echo Exporting UI-B certificate to PEM format (ui-b-cert.crt)...
    openssl pkcs12 -in %UI_B_KEYSTORE% -clcerts -nokeys -passin pass:%SERVER_PASSWORD% -out ui-b-cert.crt
    echo Done.
    echo.
    echo Creating fullchain certificate for UI-B (server cert + intermediate CA)...
    type ui-b-cert.crt intermediate-ca.crt > ui-b-fullchain.crt
    echo Done.
) else (
    echo WARNING: OpenSSL not found. Cannot convert to PEM format automatically.
    echo Please install OpenSSL and run this script again.
)
echo.

echo UI-B certificate files generated:
echo   - ui-b-cert.key (Private key in PEM format)
echo   - ui-b-cert.crt (Certificate in PEM format, signed by Intermediate CA)
echo   - ui-b-fullchain.crt (Full certificate chain: server cert + intermediate CA)
echo   - SAN: %SAN_UI_B%
echo.

REM ==================================================================
REM STEP 5: Create Truststore with Intermediate CA
REM ==================================================================

echo ==================================================================
echo STEP 5: Creating Truststore
echo ==================================================================
echo.

echo Creating truststore with Intermediate CA certificate...
keytool -importcert ^
    -trustcacerts ^
    -alias %INTERMEDIATE_ALIAS% ^
    -file intermediate-ca.crt ^
    -keystore %TRUSTSTORE% ^
    -storetype PKCS12 ^
    -storepass %TRUSTSTORE_PASSWORD% ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create truststore
    exit /b 1
)

echo.
echo Importing Root CA certificate into truststore (optional, for complete chain)...
keytool -importcert ^
    -trustcacerts ^
    -alias %ROOT_ALIAS% ^
    -file root-ca.crt ^
    -keystore %TRUSTSTORE% ^
    -storetype PKCS12 ^
    -storepass %TRUSTSTORE_PASSWORD% ^
    -noprompt

echo Done.
echo.

REM ==================================================================
REM STEP 6: Verification of Keystores & Content
REM ==================================================================

echo ==================================================================
echo STEP 6: Verifying Generated Certificates
echo ==================================================================
echo.

echo Root CA Keystore:
keytool -list -v -keystore %ROOT_KEYSTORE% -storepass %ROOT_PASSWORD% -storetype PKCS12 | findstr "Alias Owner Issuer Valid"
echo.

echo Intermediate CA Keystore:
keytool -list -v -keystore %INTERMEDIATE_KEYSTORE% -storepass %INTERMEDIATE_PASSWORD% -storetype PKCS12 | findstr "Alias Owner Issuer Valid"
echo.

echo Connector-A Keystore:
keytool -list -v -keystore connector-a.p12 -storepass %SERVER_PASSWORD% -storetype PKCS12 | findstr "Alias Owner Issuer Valid DNS"
echo.

echo Connector-B Keystore:
keytool -list -v -keystore connector-b.p12 -storepass %SERVER_PASSWORD% -storetype PKCS12 | findstr "Alias Owner Issuer Valid DNS"
echo.

echo S3 storage Certificate Files:
echo   - s3storage_key.pem: Private key in PEM format
echo   - s3storage_cert.pem: Certificate in PEM format
if exist s3storage_key.pem (
    echo   s3storage_key.pem exists: YES
    findstr "BEGIN" s3storage_key.pem
) else (
    echo   s3storage_key.pem exists: NO
)
if exist s3storage_cert.pem (
    echo   s3storage_cert.pem exists: YES
    findstr "BEGIN CERTIFICATE" s3storage_cert.pem
) else (
    echo   s3storage_cert.pem exists: NO
)
echo.

echo Truststore:
keytool -list -v -keystore %TRUSTSTORE% -storepass %TRUSTSTORE_PASSWORD% -storetype PKCS12 | findstr "Alias Owner Issuer Valid"
echo.

REM ==================================================================
REM CLEANUP OF TEMPORARY BUILD FILES
REM ==================================================================

echo ==================================================================
echo Cleaning up temporary build files...
echo ==================================================================
echo.

if exist *.csr del /f /q *.csr
if exist root-ca.crt del /f /q root-ca.crt
if exist intermediate-ca.crt del /f /q intermediate-ca.crt
if exist s3storage-signed.crt del /f /q s3storage-signed.crt
if exist ui-a-signed.crt del /f /q ui-a-signed.crt
if exist ui-b-signed.crt del /f /q ui-b-signed.crt
if exist connector-a.crt del /f /q connector-a.crt
if exist connector-b.crt del /f /q connector-b.crt
if exist *.cer del /f /q *.cer
if exist s3storage-temp.p12 del /f /q s3storage-temp.p12
if exist ui-a-temp.p12 del /f /q ui-a-temp.p12
if exist ui-b-temp.p12 del /f /q ui-b-temp.p12

echo Done.
echo.

REM ==================================================================
REM STEP 7: Move Certificates to Respective Directories
REM ==================================================================

echo ==================================================================
echo STEP 7: Moving Certificates to Respective Directories
echo ==================================================================
echo.

REM Move CA certificates and master truststore
echo Moving CA files to %DIR_CA%...
move /y "%ROOT_KEYSTORE%" "%DIR_CA%\" >nul
move /y "%INTERMEDIATE_KEYSTORE%" "%DIR_CA%\" >nul

REM Distribute truststore to connectors and place master copy in CA
echo Distributing truststore...
copy /y "%TRUSTSTORE%" "%DIR_CONNECTOR_A%\" >nul
copy /y "%TRUSTSTORE%" "%DIR_CONNECTOR_B%\" >nul
move /y "%TRUSTSTORE%" "%DIR_CA%\" >nul

REM Move connector keystores
echo Moving Connector-A certificate to %DIR_CONNECTOR_A%...
move /y connector-a.p12 "%DIR_CONNECTOR_A%\" >nul

echo Moving Connector-B certificate to %DIR_CONNECTOR_B%...
move /y connector-b.p12 "%DIR_CONNECTOR_B%\" >nul

REM Move S3 storage certificates
echo Moving S3 storage certificates to %DIR_S3STORAGE%...
move /y s3storage_key.pem "%DIR_S3STORAGE%\" >nul
move /y s3storage_cert.pem "%DIR_S3STORAGE%\" >nul

REM Move UI certificates
echo Moving UI-A certificates to %DIR_UI_A%...
move /y ui-a-cert.key "%DIR_UI_A%\" >nul
move /y ui-a-cert.crt "%DIR_UI_A%\" >nul
move /y ui-a-fullchain.crt "%DIR_UI_A%\" >nul

echo Moving UI-B certificates to %DIR_UI_B%...
move /y ui-b-cert.key "%DIR_UI_B%\" >nul
move /y ui-b-cert.crt "%DIR_UI_B%\" >nul
move /y ui-b-fullchain.crt "%DIR_UI_B%\" >nul

echo All certificates and keys moved successfully.
echo.

REM ==================================================================
REM STEP 8: Check and Verify File Placement
REM ==================================================================

echo ==================================================================
echo STEP 8: Checking If All Files Are In Place
echo ==================================================================
echo.

set ALL_PRESENT=true

echo CA directory (%DIR_CA%):
call :CheckTargetFile "%DIR_CA%\%ROOT_KEYSTORE%" "Root CA Keystore"
call :CheckTargetFile "%DIR_CA%\%INTERMEDIATE_KEYSTORE%" "Intermediate CA Keystore"
call :CheckTargetFile "%DIR_CA%\%TRUSTSTORE%" "Truststore"
echo.

echo Connector-A directory (%DIR_CONNECTOR_A%):
call :CheckTargetFile "%DIR_CONNECTOR_A%\connector-a.p12" "Server Keystore"
call :CheckTargetFile "%DIR_CONNECTOR_A%\%TRUSTSTORE%" "Truststore"
echo.

echo Connector-B directory (%DIR_CONNECTOR_B%):
call :CheckTargetFile "%DIR_CONNECTOR_B%\connector-b.p12" "Server Keystore"
call :CheckTargetFile "%DIR_CONNECTOR_B%\%TRUSTSTORE%" "Truststore"
echo.

echo S3 storage directory (%DIR_S3STORAGE%):
call :CheckTargetFile "%DIR_S3STORAGE%\s3storage_key.pem" "Private Key"
call :CheckTargetFile "%DIR_S3STORAGE%\s3storage_cert.pem" "Certificate Full Chain"
echo.

echo UI-A directory (%DIR_UI_A%):
call :CheckTargetFile "%DIR_UI_A%\ui-a-cert.key" "Private Key"
call :CheckTargetFile "%DIR_UI_A%\ui-a-cert.crt" "Server Certificate"
call :CheckTargetFile "%DIR_UI_A%\ui-a-fullchain.crt" "Full Chain Certificate"
echo.

echo UI-B directory (%DIR_UI_B%):
call :CheckTargetFile "%DIR_UI_B%\ui-b-cert.key" "Private Key"
call :CheckTargetFile "%DIR_UI_B%\ui-b-cert.crt" "Server Certificate"
call :CheckTargetFile "%DIR_UI_B%\ui-b-fullchain.crt" "Full Chain Certificate"
echo.

if "%ALL_PRESENT%"=="true" (
    echo ==================================================================
    echo ALL CERTIFICATE FILES ARE IN PLACE AND VERIFIED SUCCESSFULLY!
    echo ==================================================================
) else (
    echo ==================================================================
    echo ERROR: One or more certificate files are missing! Check output above.
    echo ==================================================================
    exit /b 1
)
echo.

REM ==================================================================
REM SUMMARY
REM ==================================================================

echo ==================================================================
echo CERTIFICATE GENERATION ^& DISTRIBUTION COMPLETE
echo ==================================================================
echo.
echo Organized directory hierarchy inside %CERT_BASE_DIR%:
echo   - CA (%DIR_CA%\):
echo       * %ROOT_KEYSTORE%
echo       * %INTERMEDIATE_KEYSTORE%
echo       * %TRUSTSTORE%
echo   - Connector-A (%DIR_CONNECTOR_A%\):
echo       * connector-a.p12
echo       * %TRUSTSTORE%
echo   - Connector-B (%DIR_CONNECTOR_B%\):
echo       * connector-b.p12
echo       * %TRUSTSTORE%
echo   - S3 storage (%DIR_S3STORAGE%\):
echo       * s3storage_key.pem
echo       * s3storage_cert.pem
echo   - UI-A (%DIR_UI_A%\):
echo       * ui-a-cert.key
echo       * ui-a-cert.crt
echo       * ui-a-fullchain.crt
echo   - UI-B (%DIR_UI_B%\):
echo       * ui-b-cert.key
echo       * ui-b-cert.crt
echo       * ui-b-fullchain.crt
echo.
echo For S3 storage Docker compose mounting:
echo   Mount:       - ./tc_cert/s3storage:/opt/tls:ro
echo   Environment: S3STORAGE_TLS_PATH=/opt/tls/
echo.
echo ==================================================================

goto :eof

REM ==================================================================
REM SUBROUTINE: Generate Server Certificate
REM Parameters: %1=server name, %2=DN, %3=SAN list
REM ==================================================================
:GenerateServerCert
setlocal
set SERVER_NAME=%~1
set SERVER_DN=%~2
set SERVER_SAN=%~3
set SERVER_KEYSTORE=%SERVER_NAME%.p12
set SERVER_ALIAS=%SERVER_NAME%

echo.
echo ------------------------------------------------------------------
echo Generating server certificate: %SERVER_NAME%
echo ------------------------------------------------------------------
echo.

REM Generate server key pair
echo Generating key pair for %SERVER_NAME%...
keytool -genkeypair ^
    -alias %SERVER_ALIAS% ^
    -keyalg %KEY_ALG% ^
    -keysize %KEY_SIZE% ^
    -dname "%SERVER_DN%" ^
    -validity %SERVER_VALIDITY% ^
    -keystore %SERVER_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -keypass %SERVER_PASSWORD% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SERVER_SAN%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate key pair for %SERVER_NAME%
    exit /b 1
)
echo Done.
echo.

REM Generate CSR
echo Generating Certificate Signing Request for %SERVER_NAME%...
keytool -certreq ^
    -alias %SERVER_ALIAS% ^
    -keystore %SERVER_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file %SERVER_NAME%.csr ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SERVER_SAN%"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to generate CSR for %SERVER_NAME%
    exit /b 1
)
echo Done.
echo.

REM Sign with Intermediate CA
echo Signing %SERVER_NAME% certificate with Intermediate CA...
keytool -gencert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %INTERMEDIATE_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %INTERMEDIATE_PASSWORD% ^
    -infile %SERVER_NAME%.csr ^
    -outfile %SERVER_NAME%.crt ^
    -validity %SERVER_VALIDITY% ^
    -ext KeyUsage:critical=digitalSignature,keyEncipherment ^
    -ext ExtendedKeyUsage=serverAuth,clientAuth ^
    -ext "SAN=%SERVER_SAN%" ^
    -rfc

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to sign certificate for %SERVER_NAME%
    exit /b 1
)
echo Done.
echo.

REM Import certificate chain (Root CA, Intermediate CA, Server Cert)
echo Importing certificate chain for %SERVER_NAME%...

REM First import Root CA
echo   - Importing Root CA...
keytool -importcert ^
    -alias %ROOT_ALIAS% ^
    -keystore %SERVER_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file root-ca.crt ^
    -noprompt

REM Then import Intermediate CA
echo   - Importing Intermediate CA...
keytool -importcert ^
    -alias %INTERMEDIATE_ALIAS% ^
    -keystore %SERVER_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file intermediate-ca.crt ^
    -noprompt

REM Finally import signed server certificate
echo   - Importing signed server certificate...
keytool -importcert ^
    -alias %SERVER_ALIAS% ^
    -keystore %SERVER_KEYSTORE% ^
    -storetype PKCS12 ^
    -storepass %SERVER_PASSWORD% ^
    -file %SERVER_NAME%.crt ^
    -noprompt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import certificate chain for %SERVER_NAME%
    exit /b 1
)

echo Done.
echo.
echo Server certificate %SERVER_NAME% generated successfully!
echo   - Keystore: %SERVER_KEYSTORE%
echo   - Alias: %SERVER_ALIAS%
echo   - SAN: %SERVER_SAN%
echo.

endlocal
goto :eof

REM ==================================================================
REM SUBROUTINE: Check Target File
REM Parameters: %1=file path, %2=description
REM ==================================================================
:CheckTargetFile
if exist %1 (
    echo   [OK] %~1 ^(%~2^)
) else (
    echo   [MISSING] %~1 ^(%~2^)
    set ALL_PRESENT=false
)
goto :eof