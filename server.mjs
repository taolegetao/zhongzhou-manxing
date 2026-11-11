import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const PORT = Number(portArgIndex >= 0 ? args[portArgIndex + 1] : process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url || !['GET', 'HEAD'].includes(req.method || '')) {
      respond(res, 405, 'text/plain; charset=utf-8', 'Method Not Allowed');
      return;
    }

    const requestUrl = new URL(req.url, 'http://localhost');
    let pathname;
    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      respond(res, 400, 'text/plain; charset=utf-8', 'Bad Request');
      return;
    }

    const relative = pathname.replace(/^\/+/, '') || 'index.html';
    let filePath = path.resolve(ROOT, relative);

    if (!isInside(filePath, ROOT)) {
      respond(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
      return;
    }

    let fileStat = await stat(filePath).catch(() => null);
    if (fileStat?.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fileStat = await stat(filePath).catch(() => null);
    }

    if (!fileStat?.isFile()) {
      respond(res, 404, 'text/html; charset=utf-8', notFoundPage());
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME[extension] || 'application/octet-stream';
    const cacheControl = extension === '.html' ? 'no-store' : 'no-cache';

    if (req.method === 'HEAD') {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': fileStat.size,
        'Cache-Control': cacheControl,
        'X-Content-Type-Options': 'nosniff',
      });
      res.end();
      return;
    }

    const content = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': content.length,
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    res.end(content);
  } catch (error) {
    console.error(error);
    respond(res, 500, 'text/plain; charset=utf-8', 'Internal Server Error');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n端口 ${PORT} 已被占用。`);
    console.error(`请关闭占用该端口的程序，或运行：node server.mjs --port 4174\n`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});

server.listen(PORT, '0.0.0.0', () => {
  const addresses = getLanAddresses();
  const lines = [
    '',
    '  中轴寻迹 · 本地预览服务已启动',
    '  ─────────────────────────────',
    `  电脑访问：http://localhost:${PORT}`,
  ];

  for (const address of addresses) {
    lines.push(`  手机访问：http://${address}:${PORT}`);
  }

  if (addresses.length === 0) {
    lines.push('  未检测到局域网 IPv4 地址，请检查 Wi-Fi 连接。');
  } else {
    lines.push('');
    lines.push('  手机与电脑连接同一 Wi-Fi，扫描 README 中的二维码即可。');
  }

  lines.push('  按 Ctrl + C 停止服务。', '');
  console.log(lines.join('\n'));
});

function isInside(candidate, parent) {
  const normalizedCandidate = path.resolve(candidate).toLowerCase();
  const normalizedParent = path.resolve(parent).toLowerCase();
  return normalizedCandidate === normalizedParent || normalizedCandidate.startsWith(`${normalizedParent}${path.sep}`);
}

function getLanAddresses() {
  const result = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        result.push(entry.address);
      }
    }
  }

  return result.sort((a, b) => addressRank(a) - addressRank(b));
}

function addressRank(address) {
  if (address.startsWith('192.168.')) return 0;
  if (address.startsWith('10.')) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) return 2;
  return 3;
}

function respond(res, status, contentType, body) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function notFoundPage() {
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>页面未找到</title>
  <body style="margin:0;display:grid;min-height:100vh;place-items:center;background:#f4eee0;color:#1b2928;font-family:system-ui,sans-serif">
  <div style="text-align:center"><p style="font-size:44px;margin:0">404</p><p>这个页面不在中轴线上。</p><a href="/" style="color:#b34834">回到漫游</a></div>
  </body></html>`;
}
