import { LiveList, LiveObject } from "@liveblocks/client";

const SYNC_TIMEOUT_MS = 20000;

export function toLive(value) {
  if (Array.isArray(value)) return new LiveList(value.map(toLive));
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = toLive(value[k]);
    return new LiveObject(out);
  }
  return value;
}

export function isBoardSnapshot(b) {
  return !!b && Array.isArray(b.columns) && b.columns.every(
    (c) => c && typeof c.id === "string" && typeof c.title === "string" && Array.isArray(c.cards ?? []),
  );
}

export function pickBoard(root) {
  return {
    categories: Array.isArray(root?.categories) ? root.categories : [],
    columns:    Array.isArray(root?.columns)    ? root.columns    : [],
  };
}

function withTimeout(promise, ms, message) {
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function enter(client, roomId) {
  return client.enterRoom(roomId, { initialPresence: {} });
}

export async function waitSynced(room) {
  await withTimeout(new Promise((resolve) => {
    const done = () => room.getStorageStatus() === "synchronized";
    if (done()) return resolve();
    const unsub = room.subscribe("storage-status", () => {
      if (done()) { unsub(); resolve(); }
    });
  }), SYNC_TIMEOUT_MS, "Saving to Liveblocks timed out");
}

export async function readBoard(client, roomId) {
  const { room, leave } = enter(client, roomId);
  try {
    const { root } = await withTimeout(room.getStorage(), SYNC_TIMEOUT_MS, "Could not reach Liveblocks");
    const board = pickBoard(root.toImmutable());
    return board.columns.length ? board : null;
  } finally {
    leave();
  }
}

export async function writeBoard(client, roomId, board) {
  const { room, leave } = enter(client, roomId);
  try {
    const { root } = await withTimeout(room.getStorage(), SYNC_TIMEOUT_MS, "Could not reach Liveblocks");
    root.set("categories", toLive(board.categories));
    root.set("columns",    toLive(board.columns));
    await waitSynced(room);
  } finally {
    leave();
  }
}

export async function clearBoard(client, roomId) {
  const { room, leave } = enter(client, roomId);
  try {
    const { root } = await withTimeout(room.getStorage(), SYNC_TIMEOUT_MS, "Could not reach Liveblocks");
    root.set("categories", new LiveList([]));
    root.set("columns",    new LiveList([]));
    await waitSynced(room);
  } finally {
    leave();
  }
}

export async function copyBoard(client, fromRoomId, toRoomId) {
  const board = await readBoard(client, fromRoomId);
  if (!board) return false;
  await writeBoard(client, toRoomId, board);
  return true;
}

export const EXPORT_FORMAT = "no-login-task-collab-board";

export function makeExport(board) {
  return JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), board }, null, 2);
}

export function parseExport(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("That file is not valid JSON."); }
  const board = data?.format === EXPORT_FORMAT ? data.board : null;
  if (!isBoardSnapshot(board)) throw new Error("That file is not a board export from this app.");
  return {
    categories: Array.isArray(board.categories) ? board.categories : [],
    columns:    board.columns.map((c) => ({ ...c, cards: c.cards ?? [] })),
  };
}

export function downloadText(filename, text, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
