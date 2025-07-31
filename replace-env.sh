#!/bin/sh

set -e  # Exit on error

ENV_DIR="/usr/share/nginx/html/browser"

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
            sed -i.bak "s|${placeholder}|${value}|g" "$file"
            
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

echo "============================================================"
echo "Environment variables applied!"

exec "$@"