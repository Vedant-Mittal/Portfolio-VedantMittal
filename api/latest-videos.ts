import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverless function to fetch latest 3 videos from a YouTube channel WITHOUT an API key.
// Strategy:
// 1) Accept a channel URL or handle via ?url= or default to https://www.youtube.com/@thevaluationschool
// 2) Resolve channelId by fetching the HTML and extracting "channelId":"UC..."
// 3) Fetch RSS/Atom feed: https://www.youtube.com/feeds/videos.xml?channel_id=UC...
// 4) Parse first 3 entries and return minimal info

function extractFirst(text: string, regex: RegExp): string | null {
  const m = text.match(regex);
  return m && m[1] ? m[1] : null;
}

const DEFAULT_CHANNEL_ID = 'UCYqhvzHrm7JVGx8wXlmvC-w'; // @thevaluationschool

async function resolveChannelId(channelUrl: string): Promise<string | null> {
  // If URL already contains /channel/UC..., extract directly
  const direct = extractFirst(channelUrl, /\/channel\/(UC[\w-]+)/i);
  if (direct) return direct;

  // Fetch HTML and look for "channelId":"UC..." or externalId
  const res = await fetch(channelUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) return null;
  const html = await res.text();
  const fromJson = extractFirst(html, /"channelId":"(UC[^"]+)"/);
  if (fromJson) return fromJson;
  const fromExternal = extractFirst(html, /"externalId":"(UC[^"]+)"/);
  if (fromExternal) return fromExternal;
  // Try canonical link pointing to /channel/UC...
  const fromCanonical = extractFirst(html, /href=\"https:\/\/www\.youtube\.com\/channel\/(UC[\w-]+)\"/);
  return fromCanonical;
}

function parseEntriesFromRss(xml: string) {
  // Split entries, naive but effective for this feed structure
  const entries = Array.from(xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)).map((m) => m[0]);
  return entries.slice(0, 3).map((entryXml) => {
    const id = extractFirst(entryXml, /<yt:videoId>([^<]+)<\/yt:videoId>/) || extractFirst(entryXml, /yt:video:([^<]+)<\/id>/) || '';
    const title = (extractFirst(entryXml, /<title>([\s\S]*?)<\/title>/) || '').trim();
    const publishedAt = extractFirst(entryXml, /<published>([^<]+)<\/published>/) || '';
    const thumb = extractFirst(entryXml, /<media:thumbnail[^>]*url=\"([^\"]+)\"/i) || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    const description = (extractFirst(entryXml, /<media:description>([\s\S]*?)<\/media:description>/) || '').trim();
    return { id, title, description, thumbnail: thumb, publishedAt };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const urlParam = (req.query.url as string) || 'https://www.youtube.com/@thevaluationschool';
    const channelId = (req.query.channelId as string) || (await resolveChannelId(urlParam)) || DEFAULT_CHANNEL_ID;
    if (!channelId) {
      res.status(500).json({ error: 'Unable to resolve channelId from URL', url: urlParam });
      return;
    }

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feedRes = await fetch(feedUrl, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!feedRes.ok) {
      const t = await feedRes.text();
      res.status(500).json({ error: 'Failed to fetch channel feed', detail: t });
      return;
    }
    const feedXml = await feedRes.text();
    const videos = parseEntriesFromRss(feedXml);

    // CORS headers for client-side fetch
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    res.status(200).json({ videos });
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', detail: e?.message || String(e) });
  }
}


