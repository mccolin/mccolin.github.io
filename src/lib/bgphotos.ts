import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export type BgPhoto = { url: string; position?: string };

// CSS background-position overrides keyed by image basename (no extension).
const positionOverrides: Record<string, string> = {
  'bg_family_fall': '15% center',
  'bg_colin_bennett_sun': 'left center',
  'bg_colin_cows': '80% center',
  'bg_colin_plaid': 'left center',
  'bg_phillies': 'left center',
  'bg_mountain_coaster': '80% center',
  'bg_eggs_with_dad': 'left center',
};

const rawPublic = import.meta.glob<{ default: ImageMetadata }>('../assets/bgphotos/*.jpg', {
  eager: true,
});

const rawHidden = import.meta.glob<{ default: ImageMetadata }>('../assets/bghidden/*.jpg', {
  eager: true,
});

async function processGlob(
  raw: Record<string, { default: ImageMetadata }>
): Promise<Record<string, BgPhoto>> {
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
      const photo: BgPhoto = { url: optimized.src };
      if (positionOverrides[basename]) photo.position = positionOverrides[basename];
      return [basename, photo] as const;
    })
  );
  return Object.fromEntries(entries);
}

// Public photos only — used for random selection on the root page.
export async function getBgMap(): Promise<Record<string, BgPhoto>> {
  return processGlob(rawPublic);
}

// Hidden photos only — used for the hidden section of /test.
export async function getHiddenBgMap(): Promise<Record<string, BgPhoto>> {
  return processGlob(rawHidden);
}

// All photos (public + hidden) — used for ?bg= lookup on the root page.
export async function getAllBgMap(): Promise<Record<string, BgPhoto>> {
  const [pub, hidden] = await Promise.all([
    processGlob(rawPublic),
    processGlob(rawHidden),
  ]);
  return { ...pub, ...hidden };
}

// A single, deliberately landscape-oriented photo sized as an og:image
// thumbnail for the homepage (some bg photos are portrait and would crop
// awkwardly as a link preview).
const OG_IMAGE_BASENAME = 'bg_colin_cows';

export async function getOgImage(): Promise<string> {
  const entry = Object.entries(rawPublic).find(([path]) => path.includes(OG_IMAGE_BASENAME));
  if (!entry) throw new Error(`OG image source "${OG_IMAGE_BASENAME}" not found in bgphotos`);
  const src = entry[1].default;
  const optimized = await getImage({
    src,
    width: Math.min(src.width, 1200),
    format: 'jpeg',
    quality: 85,
  });
  return optimized.src;
}
