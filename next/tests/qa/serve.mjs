// 生产近似的静态服务: brotli + 长缓存. 用法: node tests/qa/serve.mjs <dir> <port>
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { brotliCompressSync, constants } from "node:zlib";
const root = process.argv[2]; const port = +process.argv[3];
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const cache = new Map();
createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  try {
    const ext = extname(p); const text = /\.(html|js|css|svg)$/.test(p);
    let b = cache.get(p) ?? await readFile(join(root, p));
    if (text && !cache.has(p)) { b = brotliCompressSync(b, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }); cache.set(p, b); }
    res.writeHead(200, { "content-type": types[ext] || "application/octet-stream", ...(text ? { "content-encoding": "br" } : {}), "cache-control": p.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache" });
    res.end(b);
  } catch { res.writeHead(404); res.end(); }
}).listen(port);
