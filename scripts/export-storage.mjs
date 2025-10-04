#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workspace root assumed two levels up from this script
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_MEDIA_DIR = path.resolve(ROOT, 'public', 'media');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'storage';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Known folders used by the app. Add more if you store in other prefixes.
const KNOWN_FOLDERS = (process.env.EXPORT_FOLDERS ? process.env.EXPORT_FOLDERS.split(',') : ['designs', 'ai-designs', 'websites']).map(s => s.trim()).filter(Boolean);

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  await ensureDir(path.dirname(destPath));
  await fs.writeFile(destPath, Buffer.from(arrayBuffer));
}

async function listAll(folder) {
  const files = [];
  let offset = 0;
  const limit = 1000;
  // Supabase Storage list is not recursive; we assume flat files within the folder
  // If you have nested subfolders, run with EXPORT_FOLDERS including those subpaths.
  // Loop for pagination within the same folder
  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      // Skip pseudo folders
      if (item.id && item.name && !item.name.endsWith('/')) {
        files.push({ name: item.name });
      }
    }
    if (data.length < limit) break;
    offset += data.length;
  }
  return files;
}

function publicUrlFor(objectPath) {
  // objectPath is like `designs/foo.png`
  const encoded = objectPath.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

async function exportFolder(folder) {
  console.log(`\nExporting folder: ${folder}`);
  const entries = await listAll(folder);
  if (entries.length === 0) {
    console.log(`No files found under ${folder}`);
    return;
  }
  console.log(`Found ${entries.length} files under ${folder}`);

  let ok = 0, fail = 0;
  for (const entry of entries) {
    const objectPath = `${folder}/${entry.name}`;
    const url = publicUrlFor(objectPath);
    const dest = path.join(PUBLIC_MEDIA_DIR, objectPath);
    try {
      await downloadToFile(url, dest);
      ok += 1;
    } catch (e) {
      fail += 1;
      console.error(`Failed: ${objectPath} -> ${e.message}`);
    }
  }
  console.log(`Folder ${folder}: downloaded ${ok}, failed ${fail}`);
}

async function main() {
  console.log(`Exporting Supabase Storage (bucket: ${BUCKET}) to ${PUBLIC_MEDIA_DIR}`);
  await ensureDir(PUBLIC_MEDIA_DIR);
  for (const folder of KNOWN_FOLDERS) {
    await exportFolder(folder);
  }
  console.log('\nDone. You can now reference images at /media/<folder>/<filename>');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



