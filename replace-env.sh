#!/bin/sh

set -e  # Exit on error

ENV_DIR="${ENV_DIR:-/usr/share/nginx/html/browser}"
CUSTOM_ASSETS_DIR="${CUSTOM_ASSETS_DIR:-/custom-assets}"
TARGET_IMG_DIR="${ENV_DIR}/assets/img"

# Find all JavaScript files (main and chunks)
JS_FILES=$(find "$ENV_DIR" -name '*.js' -type f)

if [ -z "$JS_FILES" ]; then
    echo "Error: No JavaScript files found in $ENV_DIR"
    exit 1
fi

echo "Found JavaScript files:"
echo "$JS_FILES" | while read -r file; do
    echo "  - $(basename "$file")"
done
echo

replace_placeholder() {
    local placeholder=$1
    local value=$2
    local allow_empty=${3:-false}

    if [ -z "$placeholder" ]; then
        echo "Error: Empty placeholder parameter"
        return 1
    fi

    local env_variable_name=${placeholder%_PLACEHOLDER}

    if [ -z "$value" ] && [ "$allow_empty" != "true" ]; then
        echo "Warning: Environment variable for ${env_variable_name} is not set or is empty. Skipping insertion."
        return 0
    fi

    local line_break carriage_return
    line_break='
'
    carriage_return=$(printf '\r')
    case "$value" in
        *"$line_break"*|*"$carriage_return"*)
            echo "Error: ${env_variable_name} must not contain line breaks"
            return 1
            ;;
    esac

    local escaped_value
    escaped_value=$(printf '%s' "$value" |
        sed -e 's/\\/\\\\/g' -e "s/'/\\\\'/g" |
        sed -e 's/[\\&|]/\\&/g')

    # Print which variable is being replaced
    # If value contains 'secret', 'password', 'key', or 'token', mask it
    case "$env_variable_name" in
        AUTH_PROVIDER|KEYCLOAK_*)
            echo "Applying ${env_variable_name}=********"
            ;;
        *)
            if echo "$value" | grep -iqE 'secret|password|key|token'; then
                echo "Applying ${env_variable_name}=********"
            else
                echo "Applying ${env_variable_name}=${value}"
            fi
            ;;
    esac

    local files_modified=0

    # Process each JavaScript file using a for loop instead of pipe
    for file in $JS_FILES; do
        if [ ! -w "$file" ]; then
            echo "Warning: No write permission for $file, skipping"
            continue
        fi

        # Check if placeholder exists in this file
        if grep -q "${placeholder}" "$file"; then
            echo "  → Processing $(basename "$file")"

            # Create a backup and perform replacement
            sed -i.bak "s|${placeholder}|${escaped_value}|g" "$file"

            # Verify replacement was successful
            if grep -q "${placeholder}" "$file"; then
                echo "    Warning: Placeholder ${placeholder} still exists after replacement"
            else
                echo "    ✓ Successfully replaced ${placeholder}"
                files_modified=$((files_modified + 1))
            fi
        fi
    done

    if [ "$files_modified" -eq 0 ]; then
        echo "  Warning: Placeholder ${placeholder} not found in any JavaScript files"
    fi
}

echo "Starting environment variable replacement in JavaScript files"
echo "============================================================"

# Keep existing deployments on INTERNAL unless they explicitly opt into KEYCLOAK.
auth_provider=${AUTH_PROVIDER:-INTERNAL}
case "$auth_provider" in
    INTERNAL)
        ;;
    KEYCLOAK)
        if [ -z "${TC_ROOT_API_URL:-}" ]; then
            echo "Error: AUTH_PROVIDER=KEYCLOAK requires TC_ROOT_API_URL for public tenant discovery"
            exit 1
        fi
        if [ -z "${KEYCLOAK_URL:-}" ]; then
            echo "Error: AUTH_PROVIDER=KEYCLOAK requires KEYCLOAK_URL"
            exit 1
        fi
        if [ -z "${KEYCLOAK_CLIENT_ID:-}" ]; then
            echo "Error: AUTH_PROVIDER=KEYCLOAK requires KEYCLOAK_CLIENT_ID"
            exit 1
        fi
        if [ -z "${KEYCLOAK_ADMIN_REALM:-}" ]; then
            echo "Error: AUTH_PROVIDER=KEYCLOAK requires KEYCLOAK_ADMIN_REALM"
            exit 1
        fi
        ;;
    *)
        echo "Error: AUTH_PROVIDER must be INTERNAL or KEYCLOAK"
        exit 1
        ;;
esac

# Replace placeholders with environment variables
replace_placeholder 'TC_ROOT_API_URL_PLACEHOLDER' "$TC_ROOT_API_URL"
replace_placeholder 'AUTH_PROVIDER_PLACEHOLDER' "$auth_provider"
replace_placeholder 'KEYCLOAK_URL_PLACEHOLDER' "${KEYCLOAK_URL:-}"
replace_placeholder 'KEYCLOAK_CLIENT_ID_PLACEHOLDER' "${KEYCLOAK_CLIENT_ID:-}"
replace_placeholder 'KEYCLOAK_ADMIN_REALM_PLACEHOLDER' "${KEYCLOAK_ADMIN_REALM:-}"

apply_logo() {
    local file_name=$1

    if [ -f "${CUSTOM_ASSETS_DIR}/${file_name}" ]; then
        echo "Custom ${file_name} detected, overriding bundled one" >&2
        cp "${CUSTOM_ASSETS_DIR}/${file_name}" "${TARGET_IMG_DIR}/${file_name}"
    else
        echo "No custom ${file_name} supplied" >&2
    fi

    if [ -f "${TARGET_IMG_DIR}/${file_name}" ]; then
        echo "true"
    else
        echo "false"
    fi
}

company_logo_present=$(apply_logo "company_logo.png")
project_logo_present=$(apply_logo "project_logo.png")

replace_placeholder 'COMPANY_LOGO_PRESENT_PLACEHOLDER' "$company_logo_present"
replace_placeholder 'PROJECT_LOGO_PRESENT_PLACEHOLDER' "$project_logo_present"
replace_placeholder 'PROJECT_LABEL_PLACEHOLDER' "${PROJECT_LABEL:-}" true

echo "============================================================"
echo "Environment variables applied!"
echo "Company logo present: ${company_logo_present}"
echo "Project logo present: ${project_logo_present}"
echo "Project label: ${PROJECT_LABEL:-<none>}"

exec "$@"
