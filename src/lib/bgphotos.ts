import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const rawPublic = import.meta.glob<{ default: ImageMetadata }>('../assets/bgphotos/*.jpg', {
  eager: true,
});

const rawHidden = import.meta.glob<{ default: ImageMetadata }>('../assets/bghidden/*.jpg', {
  eager: true,
});

async function processGlob(
  raw: Record<string, { default: ImageMetadata }>
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(raw).map(async ([path, mod]) => {
      const basename = path.split('/').pop()!.replace(/\.[^.]+$/, '');
      const src = mod.default;
      const optimized = await getImage({
        src,
        width: Math.min(src.width, 1920),
        format: 'jpeg',
        quality: 85,
      });
      return [basename, optimized.src] as const;
    })
  );
  return Object.fromEntries(entries);
}

// Public photos only — used for random selection on the root page.
export async function getBgMap(): Promise<Record<string, string>> {
  return processGlob(rawPublic);
}

// Hidden photos only — used for the hidden section of /test.
export async function getHiddenBgMap(): Promise<Record<string, string>> {
  return processGlob(rawHidden);
}

// All photos (public + hidden) — used for ?bg= lookup on the root page.
export async function getAllBgMap(): Promise<Record<string, string>> {
  const [pub, hidden] = await Promise.all([
    processGlob(rawPublic),
    processGlob(rawHidden),
  ]);
  return { ...pub, ...hidden };
}
