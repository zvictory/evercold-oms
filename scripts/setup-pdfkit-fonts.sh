#!/bin/bash
# Setup script to create /ROOT symlink for PDFKit fonts
# Run this once with: sudo bash scripts/setup-pdfkit-fonts.sh

if [ "$EUID" -ne 0 ]; then 
  echo "❌ Please run with sudo:"
  echo "   sudo bash scripts/setup-pdfkit-fonts.sh"
  exit 1
fi

PROJECT_DIR="/Users/zafar/Documents/evercold"

echo "Creating /ROOT symlink..."
ln -sf "$PROJECT_DIR" /ROOT

if [ -L /ROOT ]; then
  echo "✅ Symlink created successfully!"
  echo "   /ROOT -> $PROJECT_DIR"
  ls -la /ROOT/node_modules/pdfkit/js/data/Helvetica.afm
else
  echo "❌ Failed to create symlink"
  exit 1
fi

echo ""
echo "🎉 PDFKit fonts are now accessible!"
