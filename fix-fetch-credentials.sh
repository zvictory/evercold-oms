#!/bin/bash

# List of critical pages to fix
pages=(
  "src/app/[locale]/(dashboard)/customers/page.tsx"
  "src/app/[locale]/(dashboard)/drivers/page.tsx"
  "src/app/[locale]/(dashboard)/products/page.tsx"
  "src/app/[locale]/(dashboard)/settings/users/page.tsx"
  "src/app/[locale]/(dashboard)/settings/edo/page.tsx"
  "src/app/[locale]/(dashboard)/vehicles/page.tsx"
  "src/app/[locale]/(dashboard)/branches/page.tsx"
  "src/app/[locale]/(dashboard)/routes/page.tsx"
  "src/app/[locale]/(dashboard)/fleet/page.tsx"
  "src/app/[locale]/(dashboard)/edo/sync/page.tsx"
)

for page in "${pages[@]}"; do
  echo "Processing: $page"
  if [ -f "$page" ]; then
    # Just list the fetch calls first
    grep -n "fetch(" "$page" | head -5
  else
    echo "File not found: $page"
  fi
done
