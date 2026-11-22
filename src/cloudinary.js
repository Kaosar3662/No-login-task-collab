import { useSyncExternalStore } from "react";
import { ENV_CLOUDINARY } from "./config";

let lobbyValues = { cloud: "", preset: "" };
const listeners = new Set();

function current() {
  const cloud  = ENV_CLOUDINARY.cloud  || lobbyValues.cloud;
  const preset = ENV_CLOUDINARY.preset || lobbyValues.preset;
  return { cloud, preset };
}

let snapshot = current();

export function setLobbyCloudinary(values) {
  const next = { cloud: (values?.cloud || "").trim(), preset: (values?.preset || "").trim() };
  if (next.cloud === lobbyValues.cloud && next.preset === lobbyValues.preset) return;
  lobbyValues = next;
  snapshot = current();
  listeners.forEach((l) => l());
}

export function cloudinaryEnvLocked() {
  return Boolean(ENV_CLOUDINARY.cloud && ENV_CLOUDINARY.preset);
}

export function cloudinaryEnabled() {
  return Boolean(snapshot.cloud && snapshot.preset);
}

export function useCloudinaryEnabled() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => snapshot.cloud !== "" && snapshot.preset !== "",
  );
}

export async function uploadToCloudinary(file) {
  const { cloud, preset } = snapshot;
  if (!cloud || !preset) throw new Error("Image uploads are not set up");
  const fd = new FormData();
  fd.append("file",          file);
  fd.append("upload_preset", preset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
}
