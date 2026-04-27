import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

const rawImages = import.meta.glob<{ default: ImageMetadata }>('../assets/bgphotos/*.jpg', {
  eager: true,
});

export async function getBgMap(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(rawImages).map(async ([path, mod]) => {
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
