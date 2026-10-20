#!/bin/sh

set -e  # Exit on error

ENV_DIR="/usr/share/nginx/html/browser"
CUSTOM_ASSETS_DIR="/custom-assets"
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

# Escapes a value for use inside a JS string literal and as a sed replacement (| is the delimiter)
escape_sed_replacement() {
    printf '%s' "$1" | sed -e 's/[\\]/\\\\\\\\/g' -e "s/['\"]/\\\\\\\\&/g" -e 's/[|&]/\\&/g'
}

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
    
    # Print which variable is being replaced
    # If value contains 'secret', 'password', 'key', or 'token', mask it
    if echo "$value" | grep -iqE 'secret|password|key|token'; then
        echo "Applying ${env_variable_name}=********"
    else
        echo "Applying ${env_variable_name}=${value}"
    fi
    
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
            sed -i.bak "s|${placeholder}|$(escape_sed_replacement "$value")|g" "$file"
            
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

# Replace placeholders with environment variables
replace_placeholder 'TC_ROOT_API_URL_PLACEHOLDER' "$TC_ROOT_API_URL"

# Applies an optional logo override supplied via the /custom-assets bind mount.
# Prints "true" when a logo is available (custom or bundled), "false" otherwise.
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
# Always replaced, so an unset label leaves an empty string instead of the placeholder text
replace_placeholder 'PROJECT_LABEL_PLACEHOLDER' "$PROJECT_LABEL" true

echo "============================================================"
echo "Environment variables applied!"
echo "Company logo present: ${company_logo_present}"
echo "Project logo present: ${project_logo_present}"
echo "Project label: ${PROJECT_LABEL:-<none>}"

exec "$@"