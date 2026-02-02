#!/bin/bash

# Find all fetch calls in dashboard pages and add credentials
find . -path "*/\(dashboard\)/*" -name "*.tsx" -type f | while read file; do
  # Skip if already has credentials
  if grep -q "credentials.*include" "$file"; then
    echo "✓ Already fixed: $file"
    continue
  fi
  
  # Check if has fetch calls
  if ! grep -q "fetch(" "$file"; then
    continue
  fi
  
  echo "Fixing: $file"
  
  # Use sed to add credentials to fetch calls that don't have them
  # This is a simple pattern that handles most cases
  perl -i -pe 's/fetch\(([^{]+?)\{\s*method\s*:\s*([^}]+?)}\s*\)/fetch($1{ method: $2, credentials: \x27include\x27 })/g' "$file"
  perl -i -pe 's/fetch\(([^{]+?)\{\s*([^}]*?)headers\s*:/fetch($1{ $2credentials: \x27include\x27, headers\x27:/g' "$file"
done
