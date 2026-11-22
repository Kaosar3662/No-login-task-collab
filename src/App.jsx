import { setBrand } from "./brand";
import { useState, useMemo, useEffect } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "./liveblocks.config";
import { ThemeCtx, LIGHT, DARK, buildTheme, setPalette } from "./theme";
import { COLUMN_NAMES, GENERAL_CATEGORY_ID } from "./constants";
import { liveblocksConfigured, ROOM_BASE } from "./config";
import { AccessCtx } from "./AccessContext";
import { useLobby, loadUnlock, clearUnlock } from "./lobby";
import { roomIdFromSecret } from "./crypto";
import { setLobbyCloudinary } from "./cloudinary";
import Board from "./components/Board";
import BackgroundArt from "./components/BackgroundArt";
import {
  KeySetupScreen, LobbyErrorScreen, LoadingScreen, WelcomeScreen, PasswordGate,
} from "./components/Screens";

const STORAGE_KEY = "board-colors-v1";

function loadColors() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
}

function saveColors(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch {}
}

export default function App() {
  const [mode, setMode]     = useState("dark");
  const [custom, setCustom] = useState(loadColors);
  const overrides = custom[mode] ?? {};
  const C = useMemo(() => buildTheme(mode === "dark" ? DARK : LIGHT, overrides), [mode, custom]);
  setPalette(mode, overrides);

  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));

  const setColor = (key, value) => setCustom((prev) => {
    const next = { ...prev, [mode]: { ...prev[mode], [key]: value } };
    saveColors(next);
    return next;
  });

  const resetColors = () => setCustom((prev) => {
    const next = { ...prev };
    delete next[mode];
    saveColors(next);
    return next;
  });

  return (
    <ThemeCtx.Provider value={{ C, mode, toggle, setColor, resetColors, customized: Object.keys(overrides).length > 0 }}>
      <BackgroundArt />
      {liveblocksConfigured ? <LobbyFlow /> : <KeySetupScreen />}
    </ThemeCtx.Provider>
  );
}

function LobbyFlow() {
  const { status, lobby, error, write, retry } = useLobby();
  const [pickKey, setPickKey] = useState(false);

  const mode  = lobby?.mode;
  const epoch = lobby?.epoch;

  useEffect(() => { if (lobby && lobby.mode !== "new") setBrand(lobby.brand); }, [lobby?.brand, lobby?.mode]);

  useEffect(() => {
    setLobbyCloudinary({ cloud: lobby?.cloud, preset: lobby?.preset });
  }, [lobby?.cloud, lobby?.preset]);

  const [roomId, setRoomId] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    if (mode !== "protected") { setRoomId(undefined); return; }
    const saved = loadUnlock();
    if (saved && saved.epoch === epoch) {
      setRoomId(undefined);
      roomIdFromSecret(saved.secret).then((id) => { if (!cancelled) setRoomId(id); });
    } else {
      clearUnlock();
      setRoomId(null);
    }
    return () => { cancelled = true; };
  }, [mode, epoch]);

  if (pickKey)              return <KeySetupScreen start="new" />;
  if (status === "loading") return <LoadingScreen />;
  if (status === "error")   return <LobbyErrorScreen message={error} onRetry={retry} onImportKey={() => setPickKey(true)} />;
  if (mode === "new")       return <WelcomeScreen write={write} />;

  if (mode === "protected") {
    if (roomId === undefined) return <LoadingScreen />;
    if (roomId === null)      return <PasswordGate lobby={lobby} onUnlocked={setRoomId} />;
    return <BoardRoom id={roomId} mode="protected" lobby={lobby} write={write} />;
  }

  return <BoardRoom id={ROOM_BASE} mode="open" lobby={lobby} write={write} />;
}

function BoardRoom({ id, mode, lobby, write }) {
  return (
    <AccessCtx.Provider value={{ mode, roomId: id, lobby, write }}>
      <RoomProvider
        key={id}
        id={id}
        initialPresence={{ cursor: null }}
        initialStorage={{
          categories: new LiveList([
            new LiveObject({ id: GENERAL_CATEGORY_ID, name: "General" }),
          ]),
          columns: new LiveList(
            COLUMN_NAMES.map((title, i) =>
              new LiveObject({ id: `col-${i}`, title, categoryId: GENERAL_CATEGORY_ID, cards: new LiveList([]) })
            )
          ),
        }}
      >
        <Board />
      </RoomProvider>
    </AccessCtx.Provider>
  );
}
