const ITERATIONS = 310000;
const enc = new TextEncoder();

export const cryptoAvailable = () =>
  typeof crypto !== "undefined" && !!crypto.subtle && typeof crypto.getRandomValues === "function";

export const MIN_PASSWORD_LENGTH = 8;

export function toB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function fromB64(str) {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

export const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));

async function deriveAesKey(secret, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function wrap(plain, secret) {
  const salt = randomBytes(16);
  const iv   = randomBytes(12);
  const key  = await deriveAesKey(secret, salt);
  const ct   = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  return { salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) };
}

export async function unwrap(slot, secret) {
  try {
    const key = await deriveAesKey(secret, fromB64(slot.salt));
    const pt  = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(slot.iv) }, key, fromB64(slot.ct));
    return new Uint8Array(pt);
  } catch {
    return null;
  }
}

export const newRoomSecret = () => toB64(randomBytes(32));

export async function roomIdFromSecret(secretB64) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode("linkboard-room:" + secretB64));
  return "pb-" + toHex(new Uint8Array(digest)).slice(0, 40);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode() {
  const bytes = randomBytes(20);
  let out = "";
  for (let i = 0; i < 20; i++) {
    if (i > 0 && i % 4 === 0) out += "-";
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export const normalizeCode = (s) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

export const codeSecret = (s) => "code:" + normalizeCode(s);
export const passwordSecret = (s) => "pw:" + s;

export async function makeProtectedSlots(roomSecret, password, recoveryCode) {
  const plain = fromB64(roomSecret);
  return {
    pwSlot:  await wrap(plain, passwordSecret(password)),
    recSlot: await wrap(plain, codeSecret(recoveryCode)),
  };
}

export async function openProtected(lobby, secret) {
  const tryPw  = lobby.pwSlot  ? await unwrap(lobby.pwSlot,  passwordSecret(secret)) : null;
  if (tryPw) return toB64(tryPw);
  const tryRec = lobby.recSlot ? await unwrap(lobby.recSlot, codeSecret(secret)) : null;
  if (tryRec) return toB64(tryRec);
  return null;
}

export async function makeSetupSlot(code) {
  return wrap(randomBytes(16), codeSecret(code));
}
export async function checkSetupCode(lobby, code) {
  if (!lobby.setupSlot) return false;
  return (await unwrap(lobby.setupSlot, codeSecret(code))) !== null;
}

export async function checkRecoveryCode(lobby, code) {
  if (!lobby.recSlot) return false;
  return (await unwrap(lobby.recSlot, codeSecret(code))) !== null;
}
