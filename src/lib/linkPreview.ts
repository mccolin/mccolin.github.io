import { parseHTML } from 'linkedom';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface LinkPreviewData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName: string;
  hostname: string;
  fetchedAt: string;
  ok: boolean;
}

type Cache = Record<string, LinkPreviewData>;

const CACHE_PATH = path.resolve(process.cwd(), 'src/data/link-previews.json');
const SRC_DIR = path.resolve(process.cwd(), 'src');
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Matches static `<LinkPreview ... href="...">` usages so stale cache entries
// (URLs no longer referenced anywhere in the site content) can be pruned.
// Hrefs passed as dynamic expressions (`href={var}`) aren't detected — every
// usage in this codebase is a string literal, so this covers the real cases.
const LINK_PREVIEW_HREF_RE = /<LinkPreview\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>/g;

let cachePromise: Promise<Cache> | null = null;

async function findUsedUrls(): Promise<Set<string>> {
  const used = new Set<string>();
  const entries = await fs.readdir(SRC_DIR, { withFileTypes: true, recursive: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(astro|mdx?)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));

  await Promise.all(
    files.map(async (file) => {
      const source = await fs.readFile(file, 'utf-8');
      for (const match of source.matchAll(LINK_PREVIEW_HREF_RE)) {
        used.add(match[1]);
      }
    })
  );

  return used;
}

async function loadCache(): Promise<Cache> {
  if (!cachePromise) {
    cachePromise = (async () => {
      const raw = await fs
        .readFile(CACHE_PATH, 'utf-8')
        .then((text) => JSON.parse(text) as Cache)
        .catch(() => ({} as Cache));

      const used = await findUsedUrls();
      const pruned: Cache = {};
      for (const [url, data] of Object.entries(raw)) {
        if (used.has(url)) pruned[url] = data;
      }

      if (Object.keys(pruned).length !== Object.keys(raw).length) {
        await saveCache(pruned);
      }

      return pruned;
    })();
  }
  return cachePromise;
}

async function saveCache(cache: Cache): Promise<void> {
  const sorted = Object.fromEntries(
    Object.entries(cache).sort(([a], [b]) => a.localeCompare(b))
  );
  await fs.writeFile(CACHE_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function fallback(url: string): LinkPreviewData {
  const hostname = safeHostname(url);
  return {
    url,
    title: hostname,
    siteName: hostname,
    hostname,
    fetchedAt: new Date().toISOString(),
    ok: false,
  };
}

async function fetchAndParse(url: string): Promise<LinkPreviewData> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
    });
    if (!res.ok) return fallback(url);

    const html = await res.text();
    const { document } = parseHTML(html);
    const meta = (key: string) =>
      document.querySelector(`meta[property="${key}"]`)?.getAttribute('content') ??
      document.querySelector(`meta[name="${key}"]`)?.getAttribute('content') ??
      undefined;

    const hostname = safeHostname(url);
    const title = meta('og:title') ?? document.querySelector('title')?.textContent?.trim() ?? hostname;
    const description = meta('og:description') ?? meta('description');
    const imageRaw = meta('og:image') ?? meta('twitter:image');
    const image = imageRaw ? new URL(imageRaw, res.url || url).href : undefined;
    const siteName = meta('og:site_name') ?? hostname;

    return {
      url,
      title,
      description,
      image,
      siteName,
      hostname,
      fetchedAt: new Date().toISOString(),
      ok: true,
    };
  } catch {
    return fallback(url);
  } finally {
    clearTimeout(timer);
  }
}

export async function getLinkPreview(url: string): Promise<LinkPreviewData> {
  const cache = await loadCache();
  if (cache[url]) return cache[url];

  const data = await fetchAndParse(url);
  cache[url] = data;
  await saveCache(cache);
  return data;
}
