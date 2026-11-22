import { useSyncExternalStore } from "react";
import { ROOM_BASE } from "./config";

export const DEFAULT_BRAND = "Task Board";
export const MAX_BRAND = 40;

const CACHE_KEY = `lb-brand-v1:${ROOM_BASE}`;
const clean = (s) => (typeof s === "string" ? s.trim().slice(0, MAX_BRAND) : "");

let current = (() => {
  try { return clean(localStorage.getItem(CACHE_KEY)) || DEFAULT_BRAND; } catch { return DEFAULT_BRAND; }
})();
const listeners = new Set();

export function setBrand(name) {
  const next = clean(name) || DEFAULT_BRAND;
  if (next === current) return;
  current = next;
  try { localStorage.setItem(CACHE_KEY, next); } catch {}
  if (typeof document !== "undefined") document.title = next;
  listeners.forEach((l) => l());
}

export function useBrand() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => current,
    () => current,
  );
}

export const cleanBrand = clean;
if (typeof document !== "undefined") document.title = current;
