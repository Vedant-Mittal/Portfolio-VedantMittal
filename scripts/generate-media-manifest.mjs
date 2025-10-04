#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const MEDIA_ROOT = path.join(PUBLIC_DIR, 'media');
const OUTPUT_PUBLIC = path.join(PUBLIC_DIR, 'media-manifest.json');
const DIST_DIR = path.join(ROOT, 'dist');
const OUTPUT_DIST = path.join(DIST_DIR, 'media-manifest.json');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, baseUrlPrefix) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(MEDIA_ROOT, full).split(path.sep).join('/');
    if (entry.isDirectory()) {
      const nested = await walk(full, baseUrlPrefix);
      files.push(...nested);
    } else if (entry.isFile()) {
      // Produce site-relative path under /media
      files.push(`${baseUrlPrefix}${rel}`);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

async function main() {
  const hasPublic = await exists(PUBLIC_DIR);
  if (!hasPublic) {
    throw new Error(`Missing public directory at ${PUBLIC_DIR}`);
  }
  const hasMedia = await exists(MEDIA_ROOT);
  if (!hasMedia) {
    await fs.mkdir(MEDIA_ROOT, { recursive: true });
  }
  const files = await walk(MEDIA_ROOT, '/media/');
  const payload = { generatedAt: new Date().toISOString(), count: files.length, files };
  await fs.writeFile(OUTPUT_PUBLIC, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${OUTPUT_PUBLIC} with ${files.length} files.`);
  try {
    await fs.access(DIST_DIR);
    await fs.writeFile(OUTPUT_DIST, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${OUTPUT_DIST} with ${files.length} files.`);
  } catch {
    // dist may not exist during pre-build generation; that's fine.
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


