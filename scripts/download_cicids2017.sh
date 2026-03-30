#!/bin/bash
# ThreatMatrix AI — CICIDS2017 Dataset Downloader
#
# Downloads the CICIDS2017 dataset from Zenodo mirror (Option B fallback).
# Direct UNB URLs redirect to HTML, Kaggle may be unavailable.
#
# Usage:
#   bash scripts/download_cicids2017.sh [target_dir]
#
# Default target: backend/ml/saved_models/datasets/cicids2017/

set -euo pipefail

TARGET_DIR="${1:-backend/ml/saved_models/datasets/cicids2017}"
ZIP_NAME="CIC-IDS-2017-V2.zip"
ZENODO_URL="https://zenodo.org/records/10141593/files/CIC-IDS-2017-V2.zip"

echo "============================================"
echo "  CICIDS2017 Dataset Downloader"
echo "============================================"
echo ""

# Create target directory
mkdir -p "$TARGET_DIR"

# Check if already downloaded
CSV_COUNT=$(find "$TARGET_DIR" -name "*.csv" 2>/dev/null | wc -l)
if [ "$CSV_COUNT" -ge 8 ]; then
    echo "✅ CICIDS2017 already present ($CSV_COUNT CSV files found)"
    echo "   Location: $TARGET_DIR"
    ls -lh "$TARGET_DIR"/*.csv
    exit 0
fi

echo "[1/3] Downloading from Zenodo mirror (~368 MB)..."
echo "   URL: $ZENODO_URL"
echo "   Target: $TARGET_DIR/$ZIP_NAME"
echo ""

cd "$TARGET_DIR"
wget -O "$ZIP_NAME" "$ZENODO_URL" || {
    echo ""
    echo "❌ Download failed!"
    echo ""
    echo "Alternative options:"
    echo "  1. Manually download from: https://zenodo.org/records/10141593"
    echo "  2. Or from Kaggle: https://www.kaggle.com/datasets/cicdataset/cicids2017"
    echo "  3. Place the ZIP file in: $TARGET_DIR/"
    echo "  4. Re-run this script to extract"
    exit 1
}

echo ""
echo "[2/3] Extracting CSV files..."
if [ -f "$ZIP_NAME" ]; then
    unzip -o "$ZIP_NAME"
    
    # Zenodo V2 may have files in subdirectories, find and move CSVs
    find . -name "*.csv" -type f -exec mv {} . \; 2>/dev/null || true
    
    # Clean up any subdirectories created during extraction
    find . -mindepth 1 -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove the ZIP file
    rm -f "$ZIP_NAME"
    
    CSV_COUNT=$(ls *.csv 2>/dev/null | wc -l)
    echo "   Extracted $CSV_COUNT CSV files"
else
    echo "   ERROR: $ZIP_NAME not found in $TARGET_DIR"
    exit 1
fi

echo "[3/3] Verifying dataset..."
CSV_COUNT=$(ls *.csv 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh . | cut -f1)
echo ""
echo "✅ CICIDS2017 ready!"
echo "   Location: $TARGET_DIR"
echo "   CSV files: $CSV_COUNT"
echo "   Total size: $TOTAL_SIZE"
echo ""
echo "Expected files:"
ls -lh *.csv 2>/dev/null || echo "   No CSV files found"
echo ""
echo "NOTE: Zenodo V2 may have slightly different column names."
echo "The CICIDS2017Loader handles missing columns gracefully."