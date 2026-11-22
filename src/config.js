const env = import.meta.env;

const LS_KEY = "lb-public-key-v1";

export const isPublicKey = (k) => typeof k === "string" && /^pk_[A-Za-z0-9_-]{20,}$/.test(k.trim());

let memoryKey = null;

function lsGet() {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}
function lsSet(v) {
  try { localStorage.setItem(LS_KEY, v); } catch {}
}
function lsRemove() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

(function consumeInviteLink() {
  if (typeof window === "undefined") return;
  const match = /(?:^|[#&])k=([^&]+)/.exec(window.location.hash || "");
  if (!match) return;
  let key = "";
  try { key = decodeURIComponent(match[1]).trim(); } catch { return; }
  if (!isPublicKey(key)) return;
  memoryKey = key;
  lsSet(key);
  try { window.history.replaceState(null, "", window.location.pathname + window.location.search); } catch {}
})();

const envKey = (env.VITE_LIVEBLOCKS_PUBLIC_KEY || "").trim();

export const LIVEBLOCKS_KEY = (() => {
  const saved = memoryKey || lsGet();
  if (isPublicKey(saved)) return saved.trim();
  if (isPublicKey(envKey)) return envKey;
  return "";
})();

export const liveblocksConfigured = LIVEBLOCKS_KEY !== "";

export function saveLiveblocksKey(key) { lsSet(key.trim()); }
export function clearSavedLiveblocksKey() { lsRemove(); }
export function hasSavedLiveblocksKey() { return isPublicKey(lsGet()); }

export function inviteLink(key = LIVEBLOCKS_KEY) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#k=${encodeURIComponent(key)}`;
}

export const ROOM_BASE  = (env.VITE_ROOM_ID || "webocean-kanban-v1").trim();
export const LOBBY_ROOM = `${ROOM_BASE}-lobby`;

export const ENV_CLOUDINARY = {
  cloud:  (env.VITE_CLOUDINARY_CLOUD_NAME    || "").trim(),
  preset: (env.VITE_CLOUDINARY_UPLOAD_PRESET || "").trim(),
};
