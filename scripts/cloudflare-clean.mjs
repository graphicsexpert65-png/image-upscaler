// Cloudflare Pages: remove WASM artifacts exceeding 25 MiB.
// Runtime WASM is fetched from the version-matched external CDN.
import { readdir, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
const limit = 25 * 1024 * 1024;
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) await walk(path);
    else if (item.isFile() && item.name.endsWith('.wasm') && (await stat(path)).size > limit) {
      await rm(path);
      console.log('Cloudflare: removed oversized WASM asset:', path);
    }
  }
}
await walk('dist');
