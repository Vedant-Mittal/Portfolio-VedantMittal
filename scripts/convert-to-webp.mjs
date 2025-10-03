import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const roots = [
  path.resolve('public'),
  path.resolve('src/assets'),
];

const exts = new Set(['.png', '.jpg', '.jpeg']);
const quality = Number(process.env.WEBP_QUALITY || 82);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function convertOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (!exts.has(ext)) return;

  const out = file.slice(0, -ext.length) + '.webp';
  try {
    const [srcStat, outStat] = await Promise.allSettled([fs.stat(file), fs.stat(out)]);
    const srcMtime = srcStat.status === 'fulfilled' ? srcStat.value.mtimeMs : 0;
    const outMtime = outStat.status === 'fulfilled' ? outStat.value.mtimeMs : -1;

    if (outMtime >= srcMtime && outMtime !== -1) {
      console.log('skip (up-to-date):', path.relative(process.cwd(), out));
      return;
    }

    await sharp(file).webp({ quality }).toFile(out);
    console.log('converted:', path.relative(process.cwd(), out));
  } catch (err) {
    console.error('failed:', file, err?.message || err);
  }
}

async function main() {
  for (const root of roots) {
    try {
      for await (const file of walk(root)) {
        await convertOne(file);
      }
    } catch {
      // ignore missing dirs
    }
  }
  console.log('done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
