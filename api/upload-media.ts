// Using untyped req/res to avoid requiring @vercel/node types during build

// Upload an image to the GitHub repository under public/media/<folder>/<filename>
// Expected JSON body: { name?: string, folder?: string, contentBase64: string }
// Returns: { ok: true, sitePath: string, commitSha: string }

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string | undefined;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Vedant-Mittal';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Portfolio-VedantMittal';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

function sanitizeName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    if (!GITHUB_TOKEN) {
      res.status(500).json({ ok: false, error: 'Missing GITHUB_TOKEN in environment' });
      return;
    }

    const { contentBase64, name, folder } = (typeof req.body === 'string')
      ? JSON.parse(req.body)
      : req.body || {};

    if (!contentBase64 || typeof contentBase64 !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing contentBase64' });
      return;
    }

    const folderSafe = sanitizeName((folder as string) || 'designs');
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);

    const inferredExt = (() => {
      // If user supplied name has extension, use that; else default to .webp
      if (typeof name === 'string' && /\.[a-z0-9]+$/i.test(name)) return name.split('.').pop()!.toLowerCase();
      return 'webp';
    })();

    const baseName = sanitizeName((name as string) || `upload-${timestamp}-${random}.${inferredExt}`);
    const fileName = /\.[a-z0-9]+$/i.test(baseName) ? baseName : `${baseName}.${inferredExt}`;

    const repoPath = `public/media/${folderSafe}/${fileName}`;
    const sitePath = `/media/${folderSafe}/${fileName}`;

    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/contents/${encodeURIComponent(repoPath)}`;

    const body = {
      message: `feat(media): add ${sitePath} via admin upload`,
      content: contentBase64.replace(/^data:[^,]+,/, ''),
      branch: GITHUB_BRANCH,
    };

    const ghRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!ghRes.ok) {
      const txt = await ghRes.text();
      res.status(ghRes.status).json({ ok: false, error: 'GitHub API error', detail: txt });
      return;
    }
    const data = await ghRes.json();

    res.status(200).json({ ok: true, sitePath, commitSha: data?.commit?.sha });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
}


