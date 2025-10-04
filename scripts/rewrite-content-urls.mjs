#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'storage';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PAGE_PATH = process.env.PAGE_PATH || 'portfolio';
const SECTIONS = (process.env.SECTIONS || 'designs,websites,ai_designs').split(',').map(s => s.trim()).filter(Boolean);

function toPublicPrefix(urlBase) {
  return `${urlBase.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`;
}

function mapSupabaseUrlToLocalPath(url) {
  if (!url || typeof url !== 'string') return url;
  const prefixes = [
    toPublicPrefix(SUPABASE_URL),
  ];
  for (const p of prefixes) {
    if (url.startsWith(p)) {
      const pathPart = url.slice(p.length); // e.g., designs/foo.webp
      return `/media/${pathPart}`;
    }
  }
  return url;
}

function rewriteContent(content) {
  if (!content || typeof content !== 'object') return content;
  // We expect { items: [...] }
  const items = Array.isArray(content.items) ? content.items : [];
  const rewritten = items.map((it) => {
    const copy = { ...it };
    if (Array.isArray(copy.images)) {
      copy.images = copy.images.map((u) => mapSupabaseUrlToLocalPath(u));
    }
    if (typeof copy.screenshot === 'string') {
      copy.screenshot = mapSupabaseUrlToLocalPath(copy.screenshot);
    }
    if (typeof copy.src === 'string') {
      copy.src = mapSupabaseUrlToLocalPath(copy.src);
    }
    return copy;
  });
  return { ...content, items: rewritten };
}

async function processSection(section) {
  console.log(`\nProcessing section: ${section}`);
  const { data, error } = await supabase
    .from('content_sections')
    .select('*')
    .eq('page_path', PAGE_PATH)
    .eq('section_identifier', section)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    console.log(`No row found for section ${section}`);
    return;
  }
  const prev = data.content;
  const next = rewriteContent(prev);
  if (JSON.stringify(prev) === JSON.stringify(next)) {
    console.log('No changes detected');
    return;
  }
  const { error: upErr } = await supabase
    .from('content_sections')
    .update({ content: next })
    .eq('id', data.id);
  if (upErr) throw upErr;
  console.log('Updated.');
}

async function main() {
  for (const s of SECTIONS) {
    await processSection(s);
  }
  console.log('\nAll done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



