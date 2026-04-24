const rawImages = import.meta.glob<string>('../assets/bgphotos/*.jpg', {
  query: '?url',
  import: 'default',
  eager: true,
});

export const bgMap: Record<string, string> = {};
for (const [path, url] of Object.entries(rawImages)) {
  const basename = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  bgMap[basename] = url;
}

export const bgUrls = Object.values(bgMap);
