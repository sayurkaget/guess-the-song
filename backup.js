/* TuneUp — account-free progress backup. Turns every `tl:*` localStorage entry
   (stats, streaks, Daily history, settings) into one copyable code that can be
   pasted on another browser or device. Preview cache (`tl:trk*`) is skipped. */
(function (root) {
  'use strict';

  const PREFIX = 'TUNEUP1';
  const MAX_VALUE = 200000;
  const MAX_CODE = 900000;
  const MAX_KEYS = 600;

  const isUserKey = (k) => typeof k === 'string' && k.startsWith('tl:') && !k.startsWith('tl:trk') && k.length <= 120;

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function toB64Url(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromB64Url(b64) {
    let s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function userKeys(storage) {
    const keys = [];
    const n = Number(storage && storage.length) || 0;
    for (let i = 0; i < n; i++) {
      const k = storage.key(i);
      if (isUserKey(k)) keys.push(k);
    }
    return keys;
  }

  /** Snapshot of every backup-worthy entry as { key: rawString }. */
  function collect(storage) {
    const out = {};
    for (const k of userKeys(storage)) {
      const v = storage.getItem(k);
      if (typeof v === 'string' && v.length <= MAX_VALUE) out[k] = v;
    }
    return out;
  }

  function encode(entries, now = Date.now()) {
    const body = toB64Url(JSON.stringify({ v: 1, t: now, d: entries || {} }));
    return PREFIX + '.' + body + '.' + hash(body);
  }

  /** Validate a pasted code. Returns { ok, entries, count, createdAt } or { error }. */
  function decode(code) {
    const raw = String(code || '').replace(/\s+/g, '');
    if (!raw) return { error: 'Paste a backup code first.' };
    if (raw.length > MAX_CODE) return { error: 'That backup code is too long to be valid.' };
    const parts = raw.split('.');
    if (parts.length !== 3 || parts[0] !== PREFIX) {
      return { error: 'That does not look like a TuneUp backup code.' };
    }
    if (hash(parts[1]) !== parts[2]) {
      return { error: 'Backup code is incomplete or damaged — copy it again in full.' };
    }
    let parsed;
    try { parsed = JSON.parse(fromB64Url(parts[1])); } catch (e) {
      return { error: 'Backup code could not be read.' };
    }
    if (!parsed || parsed.v !== 1 || !parsed.d || typeof parsed.d !== 'object' || Array.isArray(parsed.d)) {
      return { error: 'Unsupported backup version.' };
    }
    const entries = {};
    let count = 0;
    for (const [k, v] of Object.entries(parsed.d)) {
      if (!isUserKey(k) || typeof v !== 'string' || v.length > MAX_VALUE) continue;
      try { JSON.parse(v); } catch (e) { continue; }
      if (++count > MAX_KEYS) return { error: 'Backup contains too many items.' };
      entries[k] = v;
    }
    if (!count) return { error: 'This backup is empty.' };
    return { ok: true, entries, count, createdAt: Number(parsed.t) || 0 };
  }

  /** Replace all progress on this device with the backup. */
  function restore(storage, entries) {
    for (const k of userKeys(storage)) {
      if (!k.startsWith('tl:trk')) storage.removeItem(k);
    }
    let written = 0;
    for (const [k, v] of Object.entries(entries || {})) {
      if (!isUserKey(k) || typeof v !== 'string') continue;
      storage.setItem(k, v);
      written++;
    }
    return written;
  }

  /** Erase every `tl:*` entry, including the preview cache. */
  function clear(storage) {
    const keys = [];
    const n = Number(storage && storage.length) || 0;
    for (let i = 0; i < n; i++) {
      const k = storage.key(i);
      if (typeof k === 'string' && k.startsWith('tl:')) keys.push(k);
    }
    keys.forEach((k) => storage.removeItem(k));
    return keys.length;
  }

  const api = { PREFIX, isUserKey, collect, encode, decode, restore, clear };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TuneUpBackup = api;
})(typeof window === 'object' ? window : globalThis);
