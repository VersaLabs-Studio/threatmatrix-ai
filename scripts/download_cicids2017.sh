#!/bin/bash
# ThreatMatrix AI — CICIDS2017 Dataset Downloader
#
# Downloads the MachineLearningCSV.zip (pre-extracted features) from Kaggle.
# Requires: kaggle CLI (pip install kaggle) + ~/.kaggle/kaggle.json
#
# Usage:
#   bash scripts/download_cicids2017.sh [target_dir]
#
# Default target: backend/ml/saved_models/datasets/cicids2017/

set -euo pipefail

TARGET_DIR="${1:-backend/ml/saved_models/datasets/cicids2017}"
ZIP_NAME="MachineLearningCSV.zip"

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

# Check for kaggle CLI
if command -v kaggle &> /dev/null; then
    echo "[1/3] Downloading via Kaggle API..."
    kaggle datasets download -d cicdataset/cicids2017 \
        -f "$ZIP_NAME" \
        -p "$TARGET_DIR" \
        --force
else
    echo "[1/3] Kaggle CLI not found. Installing..."
    pip install kaggle -q

    if [ ! -f "$HOME/.kaggle/kaggle.json" ]; then
        echo ""
        echo "⚠️  Kaggle API credentials not found."
        echo ""
        echo "Option 1: Set up Kaggle credentials:"
        echo "  1. Go to https://www.kaggle.com/settings -> API -> Create New Token"
        echo "  2. Download kaggle.json"
        echo "  3. mkdir -p ~/.kaggle && mv kaggle.json ~/.kaggle/ && chmod 600 ~/.kaggle/kaggle.json"
        echo ""
        echo "Option 2: Manual download:"
        echo "  1. Go to https://www.kaggle.com/datasets/cicdataset/cicids2017"
        echo "  2. Download MachineLearningCSV.zip"
        echo "  3. Place it in: $TARGET_DIR/"
        echo "  4. Re-run this script to extract"
        echo ""
        exit 1
    fi

    echo "[1/3] Downloading via Kaggle API..."
    kaggle datasets download -d cicdataset/cicids2017 \
        -f "$ZIP_NAME" \
        -p "$TARGET_DIR" \
        --force
fi

echo "[2/3] Extracting CSV files..."
cd "$TARGET_DIR"
if [ -f "$ZIP_NAME" ]; then
    unzip -o "$ZIP_NAME"
    rm -f "$ZIP_NAME"
    echo "   Extracted $(ls *.csv 2>/dev/null | wc -l) CSV files"
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
ls -lh *.csv
