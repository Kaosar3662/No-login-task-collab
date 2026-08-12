import { useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { RoomProvider } from "./liveblocks.config";
import { ThemeCtx, LIGHT, DARK } from "./theme";
import { COLUMN_NAMES } from "./constants";
import Board from "./components/Board";

export default function App() {
  const [mode, setMode] = useState("light");
  const C      = mode === "light" ? DARK : LIGHT;
  const toggle = () => setMode((m) => (m === "light" ? "dark" : "light"));

  return (
    <ThemeCtx.Provider value={{ C, mode, toggle }}>
      <RoomProvider
        id="webocean-kanban-v1"
        initialPresence={{ cursor: null }}
        initialStorage={{
          columns: new LiveList(
            COLUMN_NAMES.map((title, i) =>
              new LiveObject({ id: `col-${i}`, title, cards: new LiveList([]) })
            )
          ),
        }}
      >
        <Board />
      </RoomProvider>
    </ThemeCtx.Provider>
  );
}
