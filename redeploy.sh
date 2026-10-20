#!/bin/sh
# 重新同步資料並推送至 GitHub Pages（GBNETWORK168/medical-compare）
set -e
cd "$(dirname "$0")"
export GH_CONFIG_DIR=/home/box/.config/gh-gbn
./sync_data.sh
git add -A
git commit -m "資料更新 $(date '+%Y-%m-%d %H:%M')" || echo "沒有變更"
git push origin main
echo "已推送；GitHub Pages 約 1–2 分鐘後更新：https://gbnetwork168.github.io/medical-compare/"
