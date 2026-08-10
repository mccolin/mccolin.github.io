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
  embeddedIn: string[];
}

type FetchedData = Omit<LinkPreviewData, 'embeddedIn'>;
type Cache = Record<string, LinkPreviewData>;

const CACHE_PATH = path.resolve(process.cwd(), 'src/data/link-previews.json');
const SRC_DIR = path.resolve(process.cwd(), 'src');
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Matches static `<LinkPreview ... href="...">` usages so stale cache entries
// (URLs no longer referenced anywhere in the site content) can be pruned, and
// so each cache entry can record which file(s) embed it.
// Hrefs passed as dynamic expressions (`href={var}`) aren't detected — every
// usage in this codebase is a string literal, so this covers the real cases.
const LINK_PREVIEW_HREF_RE = /<LinkPreview\b[^>]*\bhref\s*=\s*"([^"]*)"[^>]*>/g;

let cachePromise: Promise<Cache> | null = null;
let usageMapPromise: Promise<Map<string, string[]>> | null = null;

// Maps each referenced URL to the sorted, repo-relative paths of every file
// that embeds it via <LinkPreview href="...">.
async function findUsedUrls(): Promise<Map<string, string[]>> {
  const used = new Map<string, Set<string>>();
  const entries = await fs.readdir(SRC_DIR, { withFileTypes: true, recursive: true });
  const files = entries
    .filter((entry) => entry.isFile() && /\.(astro|mdx?)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));

  await Promise.all(
    files.map(async (file) => {
      const source = await fs.readFile(file, 'utf-8');
      const relPath = path.relative(process.cwd(), file);
      for (const match of source.matchAll(LINK_PREVIEW_HREF_RE)) {
        const url = match[1];
        if (!used.has(url)) used.set(url, new Set());
        used.get(url)!.add(relPath);
      }
    })
  );

  const result = new Map<string, string[]>();
  for (const [url, paths] of used) {
    result.set(url, [...paths].sort());
  }
  return result;
}

async function loadUsedUrls(): Promise<Map<string, string[]>> {
  if (!usageMapPromise) {
    usageMapPromise = findUsedUrls();
  }
  return usageMapPromise;
}

async function loadCache(): Promise<Cache> {
  if (!cachePromise) {
    cachePromise = (async () => {
      const raw = await fs
        .readFile(CACHE_PATH, 'utf-8')
        .then((text) => JSON.parse(text) as Cache)
        .catch(() => ({} as Cache));

      const usageMap = await loadUsedUrls();
      const pruned: Cache = {};
      for (const [url, data] of Object.entries(raw)) {
        const embeddedIn = usageMap.get(url);
        if (!embeddedIn) continue; // no longer referenced anywhere — drop
        pruned[url] = { ...data, embeddedIn };
      }

      if (JSON.stringify(pruned) !== JSON.stringify(raw)) {
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

function fallback(url: string): FetchedData {
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

async function fetchAndParse(url: string): Promise<FetchedData> {
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

  const usageMap = await loadUsedUrls();
  const data = await fetchAndParse(url);
  const withEmbeddedIn: LinkPreviewData = { ...data, embeddedIn: usageMap.get(url) ?? [] };
  cache[url] = withEmbeddedIn;
  await saveCache(cache);
  return withEmbeddedIn;
}

// Force-refetches OG data for every URL currently referenced via
// <LinkPreview href="..."> anywhere in src/, ignoring the existing cache, and
// overwrites src/data/link-previews.json with the fresh results. Used by the
// `npm run rebuild-link-previews` script for a manual full refresh.
export async function rebuildAllPreviews(): Promise<{ url: string; ok: boolean }[]> {
  const usageMap = await findUsedUrls();
  const cache: Cache = {};

  const results = await Promise.all(
    [...usageMap.entries()].map(async ([url, embeddedIn]) => {
      const data = await fetchAndParse(url);
      cache[url] = { ...data, embeddedIn };
      return { url, ok: data.ok };
    })
  );

  await saveCache(cache);
  return results;
}
