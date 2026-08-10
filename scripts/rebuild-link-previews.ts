import { rebuildAllPreviews } from '../src/lib/linkPreview.ts';

const results = await rebuildAllPreviews();

if (results.length === 0) {
  console.log('No <LinkPreview href="..."> usages found in src/ — nothing to rebuild.');
} else {
  for (const { url, ok } of results.sort((a, b) => a.url.localeCompare(b.url))) {
    console.log(`${ok ? '✓' : '✗'} ${url}`);
  }

  const failed = results.filter((r) => !r.ok).length;
  const plural = results.length === 1 ? '' : 's';
  const failedNote = failed ? ` (${failed} failed to fetch — using fallback data)` : '';
  console.log(`\nRebuilt ${results.length} link preview${plural} in src/data/link-previews.json${failedNote}.`);
}
