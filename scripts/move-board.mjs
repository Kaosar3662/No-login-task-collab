#!/usr/bin/env node
/**
 * Copy every room (the lobby and the board, protected or not) from one Liveblocks account to another.
 *
 * Secret keys are read from the environment, never from this file:
 *
 *   OLD_SECRET_KEY=sk_... NEW_SECRET_KEY=sk_... node scripts/move-board.mjs
 *
 * Secret keys live in the Liveblocks dashboard under API keys. They are different from the public
 * key the app uses. Never commit them. Optional: ONLY=room-id-1,room-id-2 to copy specific rooms.
 *
 * Afterwards give people the new public key: set VITE_LIVEBLOCKS_PUBLIC_KEY on your host and
 * redeploy, or share an invite link like https://your-site/#k=pk_...
 */

const OLD_KEY = process.env.OLD_SECRET_KEY;
const NEW_KEY = process.env.NEW_SECRET_KEY;
const ONLY    = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const BASE    = "https://api.liveblocks.io/v2";

if (!OLD_KEY || !NEW_KEY) {
  console.error("Set OLD_SECRET_KEY and NEW_SECRET_KEY in the environment (see the top of this file).");
  process.exit(1);
}
if (OLD_KEY === NEW_KEY) {
  console.error("OLD_SECRET_KEY and NEW_SECRET_KEY are the same.");
  process.exit(1);
}

async function lb(key, path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const err = new Error(`${options.method ?? "GET"} ${path} -> ${res.status}: ${await res.text()}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

async function listRoomIds() {
  const ids = [];
  let cursor = "";
  do {
    const page = await lb(OLD_KEY, `/rooms?limit=100${cursor ? `&startingAfter=${encodeURIComponent(cursor)}` : ""}`);
    for (const r of page.data ?? []) ids.push(r.id);
    cursor = page.nextCursor || "";
  } while (cursor);
  return ids;
}

async function copyRoom(id) {
  let storage;
  try {
    storage = await lb(OLD_KEY, `/rooms/${encodeURIComponent(id)}/storage`);
  } catch (e) {
    if (e.status === 404) { console.log(`  skip ${id} (no storage)`); return false; }
    throw e;
  }

  try {
    await lb(NEW_KEY, "/rooms", { method: "POST", body: JSON.stringify({ id, defaultAccesses: ["room:write"] }) });
  } catch (e) {
    if (e.status !== 409) throw e; // 409 = already exists
  }
  try {
    await lb(NEW_KEY, `/rooms/${encodeURIComponent(id)}/storage`, { method: "DELETE" });
  } catch (e) {
    if (e.status !== 404) throw e;
  }
  await lb(NEW_KEY, `/rooms/${encodeURIComponent(id)}/storage`, { method: "POST", body: JSON.stringify(storage) });
  console.log(`  copied ${id}`);
  return true;
}

const ids = ONLY.length ? ONLY : await listRoomIds();
console.log(`Found ${ids.length} room(s) on the old account.`);
let copied = 0;
for (const id of ids) if (await copyRoom(id)) copied++;
console.log(`\nDone. Copied ${copied} of ${ids.length} room(s). The old account was not changed.`);
