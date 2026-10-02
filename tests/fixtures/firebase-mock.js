/* Firebase simulado para o teste de estabilidade da Home (tests/home-stability.browser.cjs). Nunca toca o projeto real. */
/* In-memory Firebase mock served in place of gstatic firebasejs modules.
   Simulates network latency per collection so the real Home composition order is exercised. */
const LAT = (typeof window !== 'undefined' && window.__MOCK_LATENCY) || {};
const lat = (name) => (name in LAT ? LAT[name] : (LAT.default ?? 120));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const now = () => Date.now();
const Timestamp = (ms) => ({ toMillis: () => ms, seconds: Math.floor(ms / 1000), nanoseconds: 0, toDate: () => new Date(ms) });

const SEED = (typeof window !== 'undefined' && window.__MOCK_SEED) || {};
// One shared state for the four module URLs this file is served under.
const SHARED = window.__MOCK_STATE || (window.__MOCK_STATE = { store: new Map(), listeners: new Map(), seeded: false });
const store = SHARED.store, listeners = SHARED.listeners;
if (!SHARED.seeded) { SHARED.seeded = true; for (const [coll, docs] of Object.entries(SEED)) { const m = new Map(); for (const d of docs) { const { id, ...rest } = d; m.set(id, rest); } store.set(coll, m); } }
const coll = (name) => { if (!store.has(name)) store.set(name, new Map()); return store.get(name); };
window.__MOCK_ADD = (name, d) => { const { id, ...rest } = d; coll(name).set(id, rest); notify(name); };
function notify(name) { (listeners.get(name) || []).forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

let serverTsCounter = 0;
export function serverTimestamp() { return { __st: true, ms: now() + (serverTsCounter++) }; }
export function arrayUnion(...v) { return { __au: v }; }
export function increment(n) { return { __inc: n }; }
function materialize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (v && v.__st) out[k] = Timestamp(v.ms);
    else out[k] = v;
  }
  return out;
}
function merge(old, patch) {
  const out = { ...(old || {}) };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && v.__au) out[k] = [...new Set([...(out[k] || []), ...v.__au])];
    else if (v && v.__inc) out[k] = (out[k] || 0) + v.__inc;
    else if (v && v.__st) out[k] = Timestamp(v.ms);
    else out[k] = v;
  }
  return out;
}

export function initializeApp(cfg, name) { return { cfg, name: name || '[DEFAULT]' }; }
export function getFirestore() { return { __db: true }; }
export function getStorage() { return { __storage: true }; }
export function collection(db, name) { return { __coll: name }; }
export function doc(dbOrColl, a, b) {
  if (dbOrColl && dbOrColl.__coll) return { __doc: true, coll: dbOrColl.__coll, id: a || ('auto_' + Math.random().toString(36).slice(2)) };
  return { __doc: true, coll: a, id: b };
}
export function query(c, ...clauses) { return { __coll: c.__coll, clauses: [...(c.clauses || []), ...clauses] }; }
export function where(f, op, v) { return { where: [f, op, v] }; }
export function orderBy(f, dir) { return { orderBy: [f, dir || 'asc'] }; }
export function limit(n) { return { limit: n }; }

function val(d, f) { return f.split('.').reduce((o, k) => (o == null ? undefined : o[k]), d); }
function cmp(a, b) {
  const A = a && a.toMillis ? a.toMillis() : a, B = b && b.toMillis ? b.toMillis() : b;
  if (A === B) return 0; if (A == null) return -1; if (B == null) return 1; return A < B ? -1 : 1;
}
function runQuery(q) {
  let rows = [...coll(q.__coll).entries()].map(([id, data]) => ({ id, data }));
  for (const c of (q.clauses || [])) {
    if (c.where) {
      const [f, op, v] = c.where;
      rows = rows.filter(({ data }) => {
        const x = val(data, f);
        switch (op) {
          case '==': return x === v;
          case '!=': return x !== v;
          case 'in': return (v || []).includes(x);
          case 'array-contains': return Array.isArray(x) && x.includes(v);
          case 'array-contains-any': return Array.isArray(x) && x.some(y => (v || []).includes(y));
          case '>=': return cmp(x, v) >= 0;
          case '<=': return cmp(x, v) <= 0;
          case '>': return cmp(x, v) > 0;
          case '<': return cmp(x, v) < 0;
          default: return true;
        }
      });
    }
  }
  for (const c of (q.clauses || [])) if (c.orderBy) { const [f, dir] = c.orderBy; rows.sort((a, b) => cmp(val(a.data, f), val(b.data, f)) * (dir === 'desc' ? -1 : 1)); }
  for (const c of (q.clauses || [])) if (c.limit) rows = rows.slice(0, c.limit);
  return rows;
}
function docSnap(ref) {
  const data = coll(ref.coll).get(ref.id);
  return { id: ref.id, exists: () => data !== undefined, data: () => (data === undefined ? undefined : { ...data }), ref };
}
function querySnap(q) {
  const rows = runQuery(q);
  const docs = rows.map(({ id, data }) => ({ id, data: () => ({ ...data }), exists: () => true, ref: { coll: q.__coll, id } }));
  return { docs, empty: docs.length === 0, size: docs.length, forEach: fn => docs.forEach(fn), docChanges: () => docs.map(d => ({ type: 'added', doc: d })) };
}
export async function getDocs(q) { await sleep(lat(q.__coll)); return querySnap(q); }
export async function getDoc(ref) { await sleep(lat(ref.coll)); return docSnap(ref); }
export async function setDoc(ref, data, opts) {
  await sleep(lat(ref.coll) / 2);
  const old = coll(ref.coll).get(ref.id);
  coll(ref.coll).set(ref.id, opts && opts.merge ? merge(old, data) : merge({}, data));
  notify(ref.coll);
}
export async function addDoc(c, data) {
  await sleep(lat(c.__coll) / 2);
  const id = 'auto_' + Math.random().toString(36).slice(2);
  coll(c.__coll).set(id, merge({}, data)); notify(c.__coll);
  return { id, coll: c.__coll, __doc: true };
}
export async function updateDoc(ref, data) {
  await sleep(lat(ref.coll) / 2);
  const old = coll(ref.coll).get(ref.id);
  if (old === undefined) { const e = new Error('No document'); e.code = 'not-found'; throw e; }
  coll(ref.coll).set(ref.id, merge(old, data)); notify(ref.coll);
}
export async function deleteDoc(ref) { await sleep(lat(ref.coll) / 2); coll(ref.coll).delete(ref.id); notify(ref.coll); }
export function writeBatch() {
  const ops = [];
  return {
    set: (ref, data, opts) => ops.push(() => setDoc(ref, data, opts)),
    update: (ref, data) => ops.push(() => updateDoc(ref, data)),
    delete: (ref) => ops.push(() => deleteDoc(ref)),
    commit: async () => { for (const op of ops) await op(); }
  };
}
export async function runTransaction(db, fn) {
  const tx = { get: async (ref) => docSnap(ref), set: (ref, d, o) => { const old = coll(ref.coll).get(ref.id); coll(ref.coll).set(ref.id, o && o.merge ? merge(old, d) : merge({}, d)); notify(ref.coll); }, update: (ref, d) => { coll(ref.coll).set(ref.id, merge(coll(ref.coll).get(ref.id), d)); notify(ref.coll); }, delete: (ref) => { coll(ref.coll).delete(ref.id); notify(ref.coll); } };
  return fn(tx);
}
export function onSnapshot(target, onNext, onErr) {
  const name = target.__coll || target.coll;
  const denied = (window.__MOCK_DENY || []).includes(name);
  const emit = () => { try { onNext(target.__doc ? docSnap(target) : querySnap(target)); } catch (e) { console.error('snapshot handler', name, e); } };
  let active = true;
  window.__MOCK_SNAPSHOTS = window.__MOCK_SNAPSHOTS || [];
  window.__MOCK_SNAPSHOTS.push({ name, t: performance.now() });
  setTimeout(() => {
    if (!active) return;
    if (denied) { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; onErr && onErr(e); return; }
    emit();
  }, lat(name));
  const fn = () => { if (active) setTimeout(emit, 5); };
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => { active = false; listeners.get(name).delete(fn); };
}

/* storage */
export function ref(storage, path) { return { path }; }
export async function uploadString() { await sleep(50); return {}; }
export async function getDownloadURL(r) { await sleep(20); return 'https://example.invalid/' + encodeURIComponent(r.path); }
export async function deleteObject() { await sleep(20); }

/* auth */
const USER = (typeof window !== 'undefined' && window.__MOCK_USER) || { uid: 'uid_prof', email: 'prof@example.org' };
const auth = { currentUser: USER, authStateReady: async () => { await sleep(30); }, __listeners: [] };
export function getAuth() { return auth; }
export function onAuthStateChanged(a, cb) { a.__listeners.push(cb); setTimeout(() => cb(a.currentUser), 10); return () => {}; }
export async function signInWithEmailAndPassword(a, email) { await sleep(100); a.currentUser = USER; a.__listeners.forEach(cb => cb(USER)); return { user: USER }; }
export async function signOut(a) { a.currentUser = null; a.__listeners.forEach(cb => cb(null)); }
export async function createUserWithEmailAndPassword() { throw new Error('not in mock'); }
export async function sendPasswordResetEmail() { }
