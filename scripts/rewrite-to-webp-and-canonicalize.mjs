#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'public', 'media-manifest.json');

function stripExt(file) {
  const i = file.lastIndexOf('.');
  return i === -1 ? file : file.slice(0, i);
}

function baseName(file) {
  return file.split('/').pop();
}

function ext(file) {
  const m = file.match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : '';
}

async function loadManifest() {
  const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const set = new Set(files);
  const byName = new Map(); // name.ext -> [paths]
  const byStem = new Map(); // name -> [paths]
  for (const p of files) {
    const name = baseName(p);
    const stem = stripExt(name);
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(p);
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push(p);
  }
  return { files, set, byName, byStem };
}

function isHttp(u) { return /^https?:\/\//i.test(u); }
function isAbsolute(u) { return u.startsWith('/'); }

function preferWebpAmong(paths) {
  const webp = paths.find(p => ext(p) === 'webp');
  return webp || paths[0];
}

function canonicalizeUrl(url, manifest) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  if (isHttp(u)) return u; // leave external as-is

  const ensureAbs = (p) => (p.startsWith('/') ? p : `/${p}`);

  // Already site path
  if (u.startsWith('/media/')) {
    // If a .jpg/.png exists and a .webp counterpart exists, prefer webp
    const name = baseName(u);
    const stem = stripExt(name);
    const dir = u.slice(0, u.lastIndexOf('/'));
    const candidates = [ `${dir}/${stem}.webp`, `${dir}/${stem}.jpg`, `${dir}/${stem}.jpeg`, `${dir}/${stem}.png` ];
    for (const c of candidates) {
      if (manifest.set.has(c)) return c;
    }
    // If not found in same dir, fallback to any with same name
    const any = manifest.byStem.get(stem);
    if (any && any.length) return preferWebpAmong(any);
    return u; // leave
  }

  // If just filename
  if (!u.includes('/')) {
    const name = u;
    // Try designs dir first
    const designs = manifest.byName.get(name) || manifest.byStem.get(stripExt(name)) || [];
    if (designs.length) return ensureAbs(preferWebpAmong(designs));
    return u; // leave
  }

  // Other relative paths like media/...
  if (u.startsWith('media/')) {
    return canonicalizeUrl(`/${u}`, manifest);
  }

  // public/ prefix
  if (u.startsWith('public/')) {
    return canonicalizeUrl(`/${u.replace(/^public\//, '')}`, manifest);
  }

  return u;
}

function rewriteContent(content, manifest) {
  if (!content || typeof content !== 'object') return content;
  const items = Array.isArray(content.items) ? content.items : [];
  const out = items.map((it) => {
    const copy = { ...it };
    if (Array.isArray(copy.images)) {
      copy.images = copy.images.map((u) => canonicalizeUrl(u, manifest));
    }
    if (typeof copy.screenshot === 'string') {
      copy.screenshot = canonicalizeUrl(copy.screenshot, manifest);
    }
    if (typeof copy.src === 'string') {
      copy.src = canonicalizeUrl(copy.src, manifest);
    }
    return copy;
  });
  return { ...content, items: out };
}

async function processSection(section, manifest) {
  const { data, error } = await supabase
    .from('content_sections')
    .select('*')
    .eq('page_path', 'portfolio')
    .eq('section_identifier', section)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { section, present: false };
  const prev = data.content;
  const next = rewriteContent(prev, manifest);
  if (JSON.stringify(prev) === JSON.stringify(next)) return { section, updated: false };
  const { error: upErr } = await supabase
    .from('content_sections')
    .update({ content: next })
    .eq('id', data.id);
  if (upErr) throw upErr;
  return { section, updated: true };
}

async function main() {
  const manifest = await loadManifest();
  const sections = ['designs', 'websites', 'ai_designs'];
  const results = [];
  for (const s of sections) results.push(await processSection(s, manifest));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });


