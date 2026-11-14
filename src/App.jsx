import { useState, useMemo } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "./liveblocks.config";
import { ThemeCtx, LIGHT, DARK, buildTheme, setPalette } from "./theme";
import { COLUMN_NAMES, GENERAL_CATEGORY_ID } from "./constants";
import Board from "./components/Board";
import BackgroundArt from "./components/BackgroundArt";

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
      <RoomProvider
        id="webocean-kanban-v1"
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
    </ThemeCtx.Provider>
  );
}
