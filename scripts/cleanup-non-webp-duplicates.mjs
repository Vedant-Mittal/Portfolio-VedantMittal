#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_MEDIA_DIR = path.join(ROOT, 'public', 'media');

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...await walk(full));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function stem(p) { const n = path.basename(p); const i = n.lastIndexOf('.'); return i === -1 ? n : n.slice(0, i); }
function ext(p) { const e = path.extname(p).toLowerCase().replace(/^\./, ''); return e; }

async function main() {
  const allFiles = await walk(PUBLIC_MEDIA_DIR);
  const byDirStem = new Map(); // key: dir+stem -> {webp?:string, others:string[]}
  for (const f of allFiles) {
    const e = ext(f);
    if (!['webp', 'jpg', 'jpeg', 'png'].includes(e)) continue;
    const dir = path.dirname(f);
    const key = dir + '::' + stem(f);
    if (!byDirStem.has(key)) byDirStem.set(key, { webp: null, others: [] });
    if (e === 'webp') byDirStem.get(key).webp = f; else byDirStem.get(key).others.push(f);
  }

  const toDelete = [];
  for (const [key, info] of byDirStem) {
    if (info.webp && info.others.length) {
      toDelete.push(...info.others);
    }
  }

  if (!toDelete.length) {
    console.log('No non-webp duplicates found.');
    return;
  }

  for (const f of toDelete) {
    await fs.unlink(f);
    console.log('deleted:', path.relative(ROOT, f));
  }

  console.log(`Deleted ${toDelete.length} files.`);
}

main().catch((e) => { console.error(e); process.exit(1); });


