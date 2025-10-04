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
const PUBLIC_MEDIA = path.join(ROOT, 'public', 'media');

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function checkSection(section) {
  const { data, error } = await supabase
    .from('content_sections')
    .select('*')
    .eq('page_path', 'portfolio')
    .eq('section_identifier', section)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { section, present: false };
  const items = Array.isArray(data.content?.items) ? data.content.items : [];
  const samples = [];
  for (const it of items.slice(0, 10)) {
    const paths = [];
    if (Array.isArray(it.images)) paths.push(...it.images);
    if (typeof it.screenshot === 'string') paths.push(it.screenshot);
    if (typeof it.src === 'string') paths.push(it.src);
    for (const p of paths) {
      if (typeof p !== 'string') continue;
      if (!p.startsWith('/media/')) continue;
      const rel = p.replace(/^\/media\//, '');
      const onDisk = path.join(PUBLIC_MEDIA, rel);
      const ok = await exists(onDisk);
      samples.push({ url: p, onDisk, exists: ok });
    }
  }
  return { section, present: true, count: items.length, samples };
}

async function main() {
  const sections = ['designs', 'websites', 'ai_designs'];
  const results = [];
  for (const s of sections) results.push(await checkSection(s));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });


