// src/services/cache.js
// Tiny stale-while-revalidate helper.
//   - If we already have data for `key` (memory or sessionStorage) -> onData(cached) is called
//     IMMEDIATELY so the page paints in ~0 ms.
//   - Then fresh data is fetched (only if the cached copy is older than `ttl`) and onData(fresh)
//     is called again.
//   - Concurrent calls for the same key share ONE network request.
//   - Cache is scoped to the logged-in token, so one user never sees another user's data.

const mem = new Map();        // scopedKey -> { data, at }
const inflight = new Map();   // scopedKey -> Promise
const PREFIX = 'crmswr:';

const scope = () => (localStorage.getItem('token') || 'anon').slice(-16);
const skey = (key) => `${scope()}:${key}`;

const read = (key) => {
  const k = skey(key);
  const m = mem.get(k);
  if (m) return m;
  try {
    const raw = sessionStorage.getItem(PREFIX + k);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.at === 'number') {
        mem.set(k, parsed);
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return null;
};

const write = (key, data) => {
  const k = skey(key);
  const entry = { data, at: Date.now() };
  mem.set(k, entry);
  try { sessionStorage.setItem(PREFIX + k, JSON.stringify(entry)); } catch { /* quota: memory copy is enough */ }
};

export async function swr(key, fetcher, { ttl = 15000, onData, force = false } = {}) {
  const cached = read(key);
  const age = cached ? Date.now() - cached.at : Infinity;

  if (cached && onData) onData(cached.data, { cached: true });
  if (cached && age < ttl && !force) return cached.data;

  const k = skey(key);
  let p = inflight.get(k);
  if (!p) {
    p = fetcher()
      .then((data) => { write(key, data); return data; })
      .finally(() => inflight.delete(k));
    inflight.set(k, p);
  }

  try {
    const fresh = await p;
    if (onData) onData(fresh, { cached: false });
    return fresh;
  } catch (err) {
    // We already showed cached data -> do not blow the page up because a refresh failed.
    if (cached) return cached.data;
    throw err;
  }
}

// Call after you change data so the next read is fresh. invalidate('district:') clears every district list.
export function invalidate(prefix = '') {
  const p = skey(prefix);
  for (const k of Array.from(mem.keys())) if (k.startsWith(p)) mem.delete(k);
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX + p))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

export function clearCache() {
  mem.clear();
  try {
    Object.keys(sessionStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}
