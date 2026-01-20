#!/bin/bash

# NASA Blue Marble テクスチャをダウンロードするスクリプト
# 注: これらは低解像度版です。本番用には高解像度版を使用することを推奨

TEXTURE_DIR="public/assets/textures"

# ディレクトリ作成
mkdir -p $TEXTURE_DIR

echo "🌍 Downloading Earth textures..."

# 地球の昼側テクスチャ (Blue Marble)
# 出典: NASA Visible Earth
echo "Downloading day map..."
curl -L -o "$TEXTURE_DIR/earth_daymap.jpg" \
  "https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg" \
  2>/dev/null || echo "Warning: Could not download day map"

# 代替ソース（solar system scope - より高品質）
# curl -L -o "$TEXTURE_DIR/earth_daymap.jpg" \
#   "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg"

echo "✅ Texture download complete!"
echo ""
echo "Downloaded textures:"
ls -la $TEXTURE_DIR

echo ""
echo "Note: For higher quality, consider using textures from:"
echo "  - https://www.solarsystemscope.com/textures/"
echo "  - https://visibleearth.nasa.gov/collection/1484/blue-marble"
