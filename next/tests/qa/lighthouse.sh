#!/bin/sh
# Lighthouse 验收: 用 brotli + 长缓存的静态服务模拟生产, 跑移动端四项分数 (要求都 ≥ 90).
# 用法: npm run build:site launch && sh tests/qa/lighthouse.sh dist-sites/launch [desktop]
set -e
DIR=$1; PORT=4190
node tests/qa/serve.mjs "$DIR" $PORT & SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
CHROME_PATH=$(node -e 'import("playwright").then(p=>console.log(p.chromium.executablePath()))')
P=""; [ "$2" = desktop ] && P="--preset=desktop"
CHROME_PATH=$CHROME_PATH npx -y lighthouse@12 "http://localhost:$PORT/" --quiet --output=json --output-path=/tmp/lh.json $P \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --only-categories=performance,accessibility,best-practices,seo
node -e '
const r = JSON.parse(require("fs").readFileSync("/tmp/lh.json", "utf8"));
const s = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
console.log(s);
process.exit(Object.values(s).every((v) => v >= 90) ? 0 : 1);'
