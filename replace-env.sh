#!/bin/sh

set -e  # Exit on error

ENV_DIR="/usr/share/nginx/html/browser"
ENV_FILE=$(find "$ENV_DIR" -name 'main-*.js' | head -n 1)

if [ -z "$ENV_FILE" ]; then
    echo "Error: No main-*.js file found in $ENV_DIR"
    exit 1
fi

if [ ! -w "$ENV_FILE" ]; then
    echo "Error: No write permission for $ENV_FILE"
    exit 1
fi

replace_placeholder() {
    local placeholder=$1
    local value=$2
    
    if [ -z "$placeholder" ]; then
        echo "Error: Empty placeholder parameter"
        return 1
    fi
    
    local env_variable_name=${placeholder%_PLACEHOLDER}
    
    if [ -z "$value" ]; then
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
    
    # Create a backup and perform replacement
    sed -i.bak "s|${placeholder}|${value}|g" "$ENV_FILE"
    
    # Verify replacement was successful
    if grep -q "${placeholder}" "$ENV_FILE"; then
        echo "Warning: Placeholder ${placeholder} still exists after replacement"
    else
        echo "✓ Successfully replaced ${placeholder}"
    fi
}

echo "Starting environment variable replacement in $ENV_FILE"
echo "----------------------------------------"

# Replace placeholders with environment variables
replace_placeholder 'TC_ROOT_API_URL_PLACEHOLDER' "$TC_ROOT_API_URL"

echo "----------------------------------------"
echo "Environment variables applied!"

exec "$@"