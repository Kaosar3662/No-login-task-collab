import { useState, useEffect, useMemo, useCallback } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
import {
  useStorage, useMutation, useOthers, useMyPresence,
  useHistory, useCanUndo, useCanRedo,
} from "../liveblocks.config";
import {
  DndContext, DragOverlay, closestCenter, MeasuringStrategy,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useT, PALETTE, CURSOR_COLORS } from "../theme";
import { uid, colColor } from "../constants";
import Column from "./Column";
import CardGhost from "./CardGhost";
import AddListForm from "./AddListForm";
import PasteImageOverlay from "./PasteImageOverlay";
import { UndoRedoBtn, AddListBtn, Chip, WeboceanLogo } from "./ui";

export default function Board() {
  const { C, mode, toggle } = useT();
  const columns  = useStorage((root) => root.columns);
  const others   = useOthers();
  const [, updateMyPresence] = useMyPresence();

  // Live cursors
  useEffect(() => {
    const onMove  = (e) => updateMyPresence({ cursor: { x: e.clientX, y: e.clientY } });
    const onLeave = ()  => updateMyPresence({ cursor: null });
    window.addEventListener("pointermove",  onMove);
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove",  onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [updateMyPresence]);

  const [activeInfo, setActiveInfo] = useState(null);
  const [overInfo,   setOverInfo]   = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [pasteFile,  setPasteFile]  = useState(null);

  // ── Cmd+V paste image ────────────────────────────────────────────────────
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const items = [...(e.clipboardData?.items ?? [])];
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) setPasteFile(file);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // ── Preview columns during drag ──────────────────────────────────────────
  const displayColumns = useMemo(() => {
    if (!columns) return [];
    const snap = columns.map((col) => ({ ...col, cards: [...(col.cards ?? [])] }));
    if (!activeInfo) return snap;

    // Column drag: no card preview needed — dnd-kit handles column visuals via transforms
    if (activeInfo.type !== "card") return snap;

    // Card drag preview
    const srcCI = snap.findIndex((c) => c.id === activeInfo.columnId);
    if (srcCI === -1) return snap;
    const srcKI = snap[srcCI].cards.findIndex((c) => c.id === activeInfo.card.id);
    if (srcKI !== -1) snap[srcCI].cards.splice(srcKI, 1);
    if (!overInfo) return snap;

    const dstCI = snap.findIndex((c) => c.id === overInfo.columnId);
    if (dstCI === -1) return snap;

    if (overInfo.cardId && overInfo.cardId !== activeInfo.card.id) {
      const pos = snap[dstCI].cards.findIndex((c) => c.id === overInfo.cardId);
      if (pos !== -1) {
        if (activeInfo.columnId === overInfo.columnId) {
          const origOverKI = (columns.find((c) => c.id === overInfo.columnId)?.cards ?? [])
            .findIndex((c) => c.id === overInfo.cardId);
          snap[dstCI].cards.splice(srcKI < origOverKI ? pos + 1 : pos, 0, activeInfo.card);
        } else {
          snap[dstCI].cards.splice(pos, 0, activeInfo.card);
        }
      } else {
        snap[dstCI].cards.push(activeInfo.card);
      }
    } else {
      snap[dstCI].cards.push(activeInfo.card);
    }
    return snap;
  }, [columns, activeInfo, overInfo]);

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  const { undo, redo } = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); if (canUndo) undo(); }
      if (e.key === "z" &&  e.shiftKey) { e.preventDefault(); if (canRedo) redo(); }
      if (e.key === "y")                 { e.preventDefault(); if (canRedo) redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, canUndo, canRedo]);

  // ── Column mutations ──────────────────────────────────────────────────────
  const addColumn = useMutation(({ storage }, title) => {
    storage.get("columns").push(
      new LiveObject({ id: `col-${uid()}`, title, cards: new LiveList([]) })
    );
  }, []);

  const removeColumn = useMutation(({ storage }, colId) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      if (cols.get(i).get("id") === colId) { cols.delete(i); break; }
    }
  }, []);

  const renameColumn = useMutation(({ storage }, colId, title) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") === colId) { col.set("title", title); break; }
    }
  }, []);

  // ── Add card (used by paste handler) ────────────────────────────────────
  const addCardToColumn = useMutation(({ storage }, colId, d) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== colId) continue;
      col.get("cards").push(new LiveObject({
        id:       uid(),
        title:    d.title    || "",
        done:     false,
        priority: d.priority || "",
        date:     d.date     || "",
        author:   d.author   || "",
        image:    d.image    || "",
      }));
      break;
    }
  }, []);

  // ── Column reorder ───────────────────────────────────────────────────────
  const reorderColumn = useMutation(({ storage }, fromId, toId) => {
    const cols = storage.get("columns");
    let fromI = -1, toI = -1;
    for (let i = 0; i < cols.length; i++) {
      const id = cols.get(i).get("id");
      if (id === fromId) fromI = i;
      if (id === toId)   toI   = i;
    }
    if (fromI !== -1 && toI !== -1 && fromI !== toI) cols.move(fromI, toI);
  }, []);

  // ── Card reorder (cross-column) ───────────────────────────────────────────
  const reorderCard = useMutation(({ storage }, cardId, fromColId, toColId, toIndex) => {
    const cols = storage.get("columns");
    let srcColLO = null, srcCardI = -1, cardData = null;

    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== fromColId) continue;
      srcColLO = col;
      const cards = col.get("cards");
      for (let j = 0; j < cards.length; j++) {
        const c = cards.get(j);
        if (c.get("id") === cardId) {
          srcCardI = j;
          cardData = {
            id:       c.get("id"),
            title:    c.get("title"),
            done:     c.get("done")     ?? false,
            priority: c.get("priority") ?? "",
            date:     c.get("date")     ?? "",
            author:   c.get("author")   ?? "",
            image: c.get("image") ?? "",
          };
          break;
        }
      }
      break;
    }
    if (!cardData || !srcColLO) return;

    if (fromColId === toColId) {
      const cards  = srcColLO.get("cards");
      const safeIdx = Math.max(0, Math.min(toIndex, cards.length - 1));
      if (safeIdx !== srcCardI) cards.move(srcCardI, safeIdx);
    } else {
      srcColLO.get("cards").delete(srcCardI);
      for (let i = 0; i < cols.length; i++) {
        const col = cols.get(i);
        if (col.get("id") !== toColId) continue;
        const cards = col.get("cards");
        cards.insert(new LiveObject(cardData), Math.min(toIndex, cards.length));
        return;
      }
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // When dragging a column, ignore card droppables so columns slide correctly
  const collisionDetection = useCallback((args) => {
    if (args.active?.data?.current?.type === "column") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (c) => c.data?.current?.type === "column"
        ),
      });
    }
    return closestCenter(args);
  }, []);

  if (!columns) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: C.pageBg, flexDirection: "column", gap: 12,
      }}>
        <WeboceanLogo size={22} />
        <div style={{ color: C.accent, fontSize: 13 }}>Connecting…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, display: "flex", flexDirection: "column", position: "relative" }}>

      {/* Live cursors */}
      {others.map(({ connectionId, presence }) => {
        if (!presence?.cursor) return null;
        const color = CURSOR_COLORS[connectionId % CURSOR_COLORS.length];
        return (
          <svg
            key={connectionId}
            style={{
              position: "fixed", left: presence.cursor.x, top: presence.cursor.y,
              pointerEvents: "none", zIndex: 9999, overflow: "visible",
              transform: "translate(-2px, -2px)",
            }}
            width="20" height="20" viewBox="0 0 20 20"
          >
            <path
              d="M0 0 L0 14 L4 10 L8 18 L10 17 L6 9 L11 9 Z"
              fill={color} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"
            />
          </svg>
        );
      })}

      {/* Accent bar */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${PALETTE.coral}, ${PALETTE.yellow}, ${PALETTE.mint}, ${PALETTE.teal})`,
        flexShrink: 0,
      }} />

      {/* Header */}
      <header style={{
        background:           C.headerBg,
        backdropFilter:       C.headerBlur,
        WebkitBackdropFilter: C.headerBlur,
        borderBottom:         `1px solid ${C.headerBorder}`,
        padding:              "10px 20px",
        display:              "flex",
        alignItems:           "center",
        justifyContent:       "space-between",
        position:             "sticky",
        top:                  0,
        zIndex:               300,
      }}>
        <WeboceanLogo size={18} />

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {others.length > 0 && (
            <Chip color={C.accent} bg={C.accent + "18"}>
              👥 {others.length + 1} online
            </Chip>
          )}

          <div style={{
            display: "flex", gap: 2,
            background: C.isLight ? "#f0eeff" : "#28284a",
            border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "2px 3px",
          }}>
            <UndoRedoBtn label="↩" title="Undo  (Ctrl+Z)"        enabled={canUndo} onClick={() => canUndo && undo()} />
            <UndoRedoBtn label="↪" title="Redo  (Ctrl+Shift+Z)"  enabled={canRedo} onClick={() => canRedo && redo()} />
          </div>

          <button
            onClick={toggle}
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              background:   C.isLight ? "#f0eeff" : "#28284a",
              border:       `1px solid ${C.border}`,
              borderRadius: 20,
              cursor:       "pointer",
              padding:      "4px 10px",
              fontSize:     14,
              lineHeight:   1,
              color:        C.text,
              transition:   "all 0.2s",
            }}
          >
            {mode === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
        onDragStart={({ active }) => {
          const d = active.data.current;
          if (d?.type === "column") {
            setActiveInfo({ type: "column", columnId: d.columnId, column: columns?.find(c => c.id === d.columnId) });
          } else {
            setActiveInfo({ type: "card", card: d?.card, columnId: d?.columnId });
          }
        }}
        onDragOver={({ active, over }) => {
          if (!over) { setOverInfo(null); return; }
          const ad = active.data.current;
          const od = over.data.current;
          if (ad?.type === "column") {
            if (od?.type === "column" && od.columnId !== ad.columnId) setOverInfo({ columnId: od.columnId });
            else setOverInfo(null);
            return;
          }
          if      (od?.type === "card")   setOverInfo({ columnId: od.columnId, cardId: od.card.id });
          else if (od?.type === "column") setOverInfo({ columnId: od.columnId, cardId: null });
          else setOverInfo(null);
        }}
        onDragEnd={({ active, over }) => {
          const savedActive = activeInfo;
          const savedOver   = overInfo;
          setActiveInfo(null);
          setOverInfo(null);
          if (!savedActive || !over) return;

          // Column reorder
          if (savedActive.type === "column") {
            if (savedOver?.columnId && savedOver.columnId !== savedActive.columnId) {
              reorderColumn(savedActive.columnId, savedOver.columnId);
            }
            return;
          }

          // Card reorder
          let toColId = null, toIndex = 0;

          if (savedOver) {
            toColId = savedOver.columnId;
            const snap  = columns.map((col) => ({ ...col, cards: [...(col.cards ?? [])] }));
            const srcCI = snap.findIndex((c) => c.id === savedActive.columnId);
            const srcKI = srcCI !== -1 ? snap[srcCI].cards.findIndex((c) => c.id === savedActive.card.id) : -1;
            if (srcCI !== -1 && srcKI !== -1) snap[srcCI].cards.splice(srcKI, 1);
            const dstCI = snap.findIndex((c) => c.id === toColId);
            if (dstCI === -1) return;

            if (savedOver.cardId && savedOver.cardId !== savedActive.card.id) {
              const pos = snap[dstCI].cards.findIndex((c) => c.id === savedOver.cardId);
              if (pos !== -1) {
                if (savedActive.columnId === toColId) {
                  const origOverKI = (columns.find((c) => c.id === toColId)?.cards ?? [])
                    .findIndex((c) => c.id === savedOver.cardId);
                  toIndex = srcKI < origOverKI ? pos + 1 : pos;
                } else {
                  toIndex = pos;
                }
              } else {
                toIndex = snap[dstCI].cards.length;
              }
            } else {
              toIndex = snap[dstCI].cards.length;
            }
          } else {
            const od = over.data.current;
            if (od?.type === "column") {
              toColId = od.columnId;
              toIndex = columns?.find((c) => c.id === toColId)?.cards?.length ?? 0;
            } else if (od?.type === "card") {
              toColId = od.columnId;
              const cc = columns?.find((c) => c.id === toColId)?.cards ?? [];
              toIndex  = cc.findIndex((c) => c.id === od.card.id);
              if (toIndex === -1) toIndex = cc.length;
            } else { return; }
          }

          if (!toColId) return;
          reorderCard(active.id, savedActive.columnId, toColId, toIndex);
        }}
      >
        <div style={{
          flex: 1, display: "flex", gap: 14,
          padding: "20px 20px 32px", overflowX: "auto", alignItems: "flex-start",
        }}>
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => {
              const dc = displayColumns.find((d) => d.id === col.id);
              return (
                <Column
                  key={col.id}
                  column={col}
                  displayCards={dc?.cards ?? col.cards ?? []}
                  activeCardId={activeInfo?.card?.id ?? null}
                  onRemove={() => removeColumn(col.id)}
                  onRename={(t) => renameColumn(col.id, t)}
                />
              );
            })}
          </SortableContext>

          <div style={{ flexShrink: 0 }}>
            {addingList ? (
              <AddListForm
                onAdd={(t) => { addColumn(t); setAddingList(false); }}
                onCancel={() => setAddingList(false)}
              />
            ) : (
              <AddListBtn onClick={() => setAddingList(true)} />
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeInfo?.type === "card"   && activeInfo.card && (
            <CardGhost card={activeInfo.card} />
          )}
          {activeInfo?.type === "column" && activeInfo.column && (
            <div style={{
              width:        240,
              background:   C.colBg,
              border:       `1px solid ${C.border}`,
              borderTop:    `3px solid ${colColor(activeInfo.columnId)}`,
              borderRadius: 12,
              padding:      "9px 10px 18px",
              opacity:      0.92,
              boxShadow:    "0 12px 32px rgba(0,0,0,0.28)",
              cursor:       "grabbing",
              minHeight:    80,
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>
                {activeInfo.column.title}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Cmd+V paste image overlay */}
      {pasteFile && (
        <PasteImageOverlay
          columns={columns}
          imageFile={pasteFile}
          onAdd={(colId, url) => {
            addCardToColumn(colId, { image: url });
            setPasteFile(null);
          }}
          onClose={() => setPasteFile(null)}
        />
      )}
    </div>
  );
}
