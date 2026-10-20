#!/bin/sh
# 同步資料：自負額＋一般實支（不含 PDF）
set -e
D=/workspace/deductible-medical
S=$(dirname "$0")
cp $D/data/deductible_products.json $S/data/
if [ -f $D/regular/products.json ]; then python3 $S/tools/normalize_regular.py $D/regular/products.json $S/data/regular.json; else echo "regular/products.json 尚未產出"; fi
date '+%Y-%m-%d %H:%M（台北時間）' > $S/data/updated.txt
