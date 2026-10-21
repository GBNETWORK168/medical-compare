#!/bin/sh
# 同步資料：自負額＋一般實支（不含 PDF）
set -e
D=/workspace/deductible-medical
S=$(dirname "$0")
cp $D/data/deductible_products.json $S/data/
if [ -f $D/regular/products.json ]; then python3 $S/tools/normalize_regular.py $D/regular/products.json $S/data/regular.json; else echo "regular/products.json 尚未產出"; fi
date '+%Y-%m-%d %H:%M（台北時間）' > $S/data/updated.txt
# 公司名正規化為簡稱（富邦人壽→富邦）＋檢查同公司只有一個名稱
python3 $S/tools/companies.py fix $S/data/deductible_products.json $S/data/regular.json
python3 $S/tools/companies.py check $S/data/deductible_products.json $S/data/regular.json
