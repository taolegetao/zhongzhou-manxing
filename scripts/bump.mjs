#!/usr/bin/env node
/**
 * 全站静态资源版本号统一改写。
 *
 * GitHub Pages 对静态文件下发 Cache-Control: max-age=600，而且不允许自定义响应头，
 * 所以唯一的破缓存手段就是改 URL 上的 ?v= 查询串。
 *
 * 用法：
 *   node scripts/bump.mjs 1.6.0     改写成 1.6.0（同时写回 package.json）
 *   node scripts/bump.mjs           沿用 package.json 当前的 version
 *   node scripts/bump.mjs --check   只检查一致性，不一致则退出码 1
 *
 * 覆盖范围：index.html、js/**\/*.js、css/*.css
 * 不覆盖：games/、echo/、yanmen/ 等独立页面（它们不参与模块图）
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'package.json');

const TARGETS = ['index.html'];
const SCAN_DIRS = ['js', 'css'];
const EXT = new Set(['.js', '.css']);
const RE = /\?v=[0-9]+\.[0-9]+(?:\.[0-9]+)?/g;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(p.slice(p.lastIndexOf('.')))) out.push(p);
  }
  return out;
}

function listFiles() {
  const files = TARGETS.map((f) => join(ROOT, f)).filter(existsSync);
  for (const d of SCAN_DIRS) files.push(...walk(join(ROOT, d)));
  return files;
}

function collect(files) {
  /** @type {Map<string, {file: string, hits: number, versions: Set<string>}>} */
  const found = new Map();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    const hits = src.match(RE);
    if (!hits) continue;
    found.set(f, {
      hits: hits.length,
      versions: new Set(hits.map((h) => h.slice(3))),
    });
  }
  return found;
}

// ---------- main ----------
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const pkg = JSON.parse(readFileSync(PKG, 'utf8'));
const argVersion = args.find((a) => /^[0-9]+\.[0-9]+/.test(a));
const version = argVersion || pkg.version;

if (checkOnly) {
  const found = collect(listFiles());
  const allVersions = new Set();
  for (const { versions } of found.values()) versions.forEach((v) => allVersions.add(v));
  const consistent = allVersions.size <= 1 && (allVersions.size === 0 || allVersions.has(version));

  console.log(`package.json 版本：${version}`);
  for (const [file, info] of found) {
    const tag = info.versions.size === 1 && info.versions.has(version) ? '✓' : '✗';
    console.log(`  ${tag} ${relative(ROOT, file).replace(/\\/g, '/')}  ${info.hits} 处  [${[...info.versions].join(', ')}]`);
  }
  if (allVersions.size === 0) {
    console.log('  （没有找到任何 ?v= 查询串）');
  }
  if (!consistent) {
    console.error('\n× 版本号不一致。跑一次：node scripts/bump.mjs ' + version);
    process.exit(1);
  }
  console.log('\n✓ 全站版本号一致：' + version);
  process.exit(0);
}

const files = listFiles();
const found = collect(files);
let changedFiles = 0;
let changedHits = 0;

for (const [file, info] of found) {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(RE, `?v=${version}`);
  if (next !== src) {
    writeFileSync(file, next);
    changedFiles += 1;
    changedHits += info.hits;
    console.log(`  ${relative(ROOT, file).replace(/\\/g, '/')}  ${info.hits} 处  [${[...info.versions].join(', ')}] → ${version}`);
  }
}

if (pkg.version !== version) {
  pkg.version = version;
  writeFileSync(PKG, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  package.json  version ${version}`);
}

console.log(`\n✓ 改写完成：${changedFiles} 个文件 / ${changedHits} 处，统一为 ${version}`);
