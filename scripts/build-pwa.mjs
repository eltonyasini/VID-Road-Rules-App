import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import icons from './pwa-icons.json' with { type: 'json' };
for (const [name, data] of Object.entries(icons)) await writeFile(`dist/${name}`, Buffer.from(data, 'base64'));
async function walk(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) files.push(...await walk(`${dir}/${entry.name}`, `${path}/`));
    else if (path !== 'sw.js') files.push(path);
  }
  return files.sort();
}
const files = await walk('dist');
const hash = createHash('sha256');
for (const file of files) { hash.update(file); hash.update(await readFile(`dist/${file}`)); }
const version = hash.digest('hex').slice(0, 16);
await writeFile('dist/sw.js', `
const CACHE = 'learners-offline-${version}';
const FILES = ${JSON.stringify(['./', ...files])};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
// Updates wait until existing app windows close, preserving active quizzes.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('learners-offline-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === 'navigate') return await cache.match('./') || fetch(event.request);
    return await cache.match(event.request, { ignoreSearch: true }) || fetch(event.request);
  })());
});
`);
console.log(`Offline cache prepared: ${files.length} files, version ${version}`);
