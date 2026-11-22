import { useEffect, useRef, useState, useCallback } from "react";
import { client } from "./liveblocks.config";
import { LOBBY_ROOM, ROOM_BASE } from "./config";
import { cleanBrand } from "./brand";
import { copyBoard, clearBoard } from "./boardCopy";
import {
  newRoomSecret, roomIdFromSecret, makeProtectedSlots, openProtected,
  makeSetupSlot, checkSetupCode, checkRecoveryCode, randomCode,
} from "./crypto";

const CONNECT_TIMEOUT_MS = 20000;
const UNLOCK_KEY = `lb-unlock-v1:${ROOM_BASE}`;

let memoryUnlock = null;

export function loadUnlock() {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return memoryUnlock;
}
export function saveUnlock(secret, epoch) {
  memoryUnlock = { secret, epoch };
  try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(memoryUnlock)); } catch {}
}
export function clearUnlock() {
  memoryUnlock = null;
  try { localStorage.removeItem(UNLOCK_KEY); } catch {}
}

const ADMIN_KEY = `lb-admin-v1:${ROOM_BASE}`;
let memoryAdmin = null;
export function isAdmin(lobby) {
  let v = memoryAdmin;
  try { v = localStorage.getItem(ADMIN_KEY) || v; } catch {}
  return !!lobby && !!v && v === lobby.epoch;
}
function saveAdmin(epoch) {
  memoryAdmin = epoch;
  try { localStorage.setItem(ADMIN_KEY, epoch); } catch {}
}
export function clearAdmin() {
  memoryAdmin = null;
  try { localStorage.removeItem(ADMIN_KEY); } catch {}
}
export async function unlockAdmin(lobby, code) {
  const ok = lobby.mode === "protected" ? await checkRecoveryCode(lobby, code) : await checkSetupCode(lobby, code);
  if (!ok) return false;
  saveAdmin(lobby.epoch);
  return true;
}

const newEpoch = () => randomCode().replace(/-/g, "");

export function useLobby() {
  const [state, setState] = useState({ status: "loading", lobby: null, error: null });
  const rootRef = useRef(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    setState({ status: "loading", lobby: null, error: null });

    const { room, leave } = client.enterRoom(LOBBY_ROOM, {
      initialPresence: {},
      initialStorage:  { mode: "new" },
    });

    const timer = setTimeout(() => {
      if (!cancelled && !rootRef.current) {
        setState({ status: "error", lobby: null, error: "Could not reach Liveblocks. The key may be wrong or the account may be over its limit." });
      }
    }, CONNECT_TIMEOUT_MS);

    room.getStorage().then(({ root }) => {
      if (cancelled) return;
      clearTimeout(timer);
      rootRef.current = root;
      const push = () => setState({ status: "ready", lobby: root.toImmutable(), error: null });
      push();
      unsub = room.subscribe(root, push);
    }).catch((e) => {
      if (!cancelled) setState({ status: "error", lobby: null, error: e?.message || "Could not reach Liveblocks." });
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsub();
      rootRef.current = null;
      leave();
    };
  }, [attempt]);

  const write = useCallback((patch, remove = []) => {
    const root = rootRef.current;
    if (!root) throw new Error("Not connected yet");
    root.update(patch);
    for (const k of remove) root.delete(k);
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, write, retry };
}

export async function chooseOpen(write, setupCode, cloudinary, brand) {
  const setupSlot = await makeSetupSlot(setupCode);
  const epoch = newEpoch();
  write({ mode: "open", setupSlot, epoch, ...cloudPatch(cloudinary), ...brandPatch(brand) });
  saveAdmin(epoch);
}

const brandPatch = (b) => (cleanBrand(b) ? { brand: cleanBrand(b) } : {});
const cloudPatch = (c) => (c && c.cloud && c.preset ? { cloud: c.cloud.trim(), preset: c.preset.trim() } : {});

export async function protectBoard(write, { password, recoveryCode, fromRoomId, cloudinary, brand }) {
  const roomSecret = newRoomSecret();
  const toRoomId   = await roomIdFromSecret(roomSecret);
  const { pwSlot, recSlot } = await makeProtectedSlots(roomSecret, password, recoveryCode);

  await copyBoard(client, fromRoomId, toRoomId);

  const epoch = newEpoch();
  write({ mode: "protected", pwSlot, recSlot, epoch, ...cloudPatch(cloudinary), ...brandPatch(brand) }, ["setupSlot"]);
  saveUnlock(roomSecret, epoch);
  saveAdmin(epoch);

  try { await clearBoard(client, fromRoomId); } catch {}
  return { roomSecret, epoch };
}

export async function enableProtection(write, lobby, { setupCode, password, recoveryCode }) {
  if (!(await checkSetupCode(lobby, setupCode))) throw new Error("That setup code is not correct.");
  return protectBoard(write, { password, recoveryCode, fromRoomId: ROOM_BASE });
}

export async function changePassword(write, lobby, { current, password, recoveryCode, currentRoomId }) {
  if (!(await openProtected(lobby, current))) throw new Error("The current password is not correct.");
  return protectBoard(write, { password, recoveryCode, fromRoomId: currentRoomId });
}

export async function removeProtection(write, lobby, { current, setupCode, currentRoomId }) {
  if (!(await openProtected(lobby, current))) throw new Error("The password is not correct.");
  const setupSlot = await makeSetupSlot(setupCode);
  await copyBoard(client, currentRoomId, ROOM_BASE);
  const epoch = newEpoch();
  write({ mode: "open", setupSlot, epoch }, ["pwSlot", "recSlot"]);
  saveAdmin(epoch);
  clearUnlock();
  try { await clearBoard(client, currentRoomId); } catch {}
}

export async function unlock(lobby, secret) {
  const roomSecret = await openProtected(lobby, secret);
  if (!roomSecret) return null;
  saveUnlock(roomSecret, lobby.epoch);
  return roomIdFromSecret(roomSecret);
}

export function saveCloudinary(write, { cloud, preset }) {
  if (cloud && preset) write({ cloud: cloud.trim(), preset: preset.trim() });
  else write({}, ["cloud", "preset"]);
}

export function saveBrand(write, name) {
  const b = cleanBrand(name);
  if (b) write({ brand: b });
  else write({}, ["brand"]);
}
