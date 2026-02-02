#!/usr/bin/env python3
import os
import re
from pathlib import Path

dashboard_path = Path("src/app/[locale]/(dashboard)")
files_modified = 0

for tsx_file in dashboard_path.rglob("*.tsx"):
    content = tsx_file.read_text()
    
    # Skip if already has credentials:
    if "credentials" in content and "include" in content:
        print(f"✓ Already has credentials: {tsx_file}")
        continue
    
    # Skip if no fetch calls
    if "fetch(" not in content:
        continue
    
    original_content = content
    
    # Pattern 1: fetch with method POST/DELETE but no credentials
    # fetch('/api/...', { method: 'POST', ... })
    content = re.sub(
        r"(\bfetch\s*\(\s*['\"][^'\"]+['\"],\s*\{)(\s*method\s*:\s*['\"])",
        r"\1\n        credentials: 'include',\2",
        content,
        flags=re.MULTILINE
    )
    
    # Pattern 2: fetch with headers but no credentials
    # fetch('/api/...', { headers: {...}, body: ... })
    content = re.sub(
        r"(\bfetch\s*\(\s*['\"][^'\"]+['\"],\s*\{)(\s*headers\s*:)",
        r"\1\n        credentials: 'include',\2",
        content,
        flags=re.MULTILINE
    )
    
    # Pattern 3: simple fetch without options
    # fetch('/api/...')
    content = re.sub(
        r"(\bfetch\s*\(\s*['\"][^'\"]+['\"]\s*\)(?!.*credentials))",
        r"fetch(\1.replace(')', ", { credentials: 'include' })"))", 
        content
    )
    
    if content != original_content:
        tsx_file.write_text(content)
        files_modified += 1
        print(f"✓ Fixed: {tsx_file}")
    else:
        print(f"- No changes: {tsx_file}")

print(f"\nTotal files modified: {files_modified}")
