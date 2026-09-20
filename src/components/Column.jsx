import { useState, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { LiveObject } from "@liveblocks/client";
import { useMutation } from "../liveblocks.config";
import { useT, PALETTE } from "../theme";
import { uid, colColor, nextPriority, GENERAL_CATEGORY_ID } from "../constants";
import { uploadToCloudinary } from "../cloudinary";
import CategoryPickerPopover from "./CategoryPickerPopover";
import Card from "./Card";
import AddCardForm from "./AddCardForm";
import { AddCardBtn, SmallBtn } from "./ui";

export default function Column({
  column, displayCards, activeCardId, onRemove, onRename,
  categories, onMoveColumnToCategory, onMoveCardToColumn, allColumns,
}) {
  const { C } = useT();
  const [adding,       setAdding]       = useState(false);
  const [renaming,     setRenaming]     = useState(false);
  const [renameV,      setRenameV]      = useState(column.title);
  const [hdrHover,     setHdrHover]     = useState(false);
  const [colDropOver,  setColDropOver]  = useState(false);
  const [colDropping,  setColDropping]  = useState(false);
  const [movingCol,    setMovingCol]    = useState(false);
  const [moveAnchor,   setMoveAnchor]   = useState(null);
  const renameRef = useRef();

  const isFileDrag = (e) => e.dataTransfer.types.includes("Files");

  const handleColDragOver = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setColDropOver(true);
  };
  const handleColDragLeave = (e) => {
    // Only clear if leaving the column entirely
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setColDropOver(false);
  };
  const handleColDrop = async (e) => {
    // Always reset drop-over state, even if a card handled the drop without stopPropagation
    setColDropOver(false);
    if (!isFileDrag(e)) return;
    e.preventDefault();
    // If dropped onto an existing card, the card already handled it — don't create a new one
    if (e.target.closest("[data-card]")) return;
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setColDropping(true);
    try {
      const url = await uploadToCloudinary(file);
      addCard(column.id, { title: "", priority: "", date: "", author: "", image: url });
    } finally {
      setColDropping(false);
    }
  };

  const cc = colColor(column.id);

  const {
    attributes: colAttrs,
    listeners:  colListeners,
    setNodeRef: setColRef,
    transform,
    transition,
    isDragging: isColDragging,
  } = useSortable({
    id:   column.id,
    data: { type: "column", columnId: column.id },
  });

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id:   `droppable:${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addCard = useMutation(({ storage }, colId, d) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== colId) continue;
      col.get("cards").push(new LiveObject({
        id:       uid(),
        title:    d.title,
        done:     false,
        priority: d.priority || "",
        date:     d.date     || "",
        author:   d.author   || "",
        image:    d.image    || "",
      }));
      break;
    }
  }, []);

  const deleteCard = useMutation(({ storage }, colId, cardId) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== colId) continue;
      const cards = col.get("cards");
      for (let j = 0; j < cards.length; j++) {
        if (cards.get(j).get("id") === cardId) { cards.delete(j); return; }
      }
    }
  }, []);

  const toggleDone = useMutation(({ storage }, colId, cardId) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== colId) continue;
      const cards = col.get("cards");
      for (let j = 0; j < cards.length; j++) {
        const c = cards.get(j);
        if (c.get("id") === cardId) { c.set("done", !c.get("done")); return; }
      }
    }
  }, []);

  const editCard = useMutation(({ storage }, colId, cardId, d) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== colId) continue;
      const cards = col.get("cards");
      for (let j = 0; j < cards.length; j++) {
        const c = cards.get(j);
        if (c.get("id") === cardId) {
          c.set("title",    d.title);
          c.set("priority", d.priority || "");
          c.set("date",     d.date     || "");
          c.set("author",   d.author   || "");
          c.set("image",    d.image    || "");
          return;
        }
      }
    }
  }, []);

  const setPriority = useMutation(({ storage }, colId, cardId, priority) => {
    const cols = storage.get("columns");
    for (let i = 0; i < cols.length; i++) {
      const col = cols.get(i);
      if (col.get("id") !== colId) continue;
      const cards = col.get("cards");
      for (let j = 0; j < cards.length; j++) {
        const c = cards.get(j);
        if (c.get("id") === cardId) { c.set("priority", priority); return; }
      }
    }
  }, []);

  // ── Rename helpers ─────────────────────────────────────────────────────────

  const startRename = () => {
    setRenameV(column.title);
    setRenaming(true);
    setTimeout(() => renameRef.current?.focus(), 10);
  };

  const commitRename = () => {
    if (renameV.trim()) onRename(renameV.trim());
    setRenaming(false);
  };

  const total = displayCards?.length ?? 0;
  const done  = displayCards?.filter((c) => c.done).length ?? 0;

  return (
    <div
      ref={setColRef}
      onDragOver={handleColDragOver}
      onDragLeave={handleColDragLeave}
      onDrop={handleColDrop}
      style={{
        width:         240,
        minWidth:      240,
        maxHeight:     "calc(100vh - 90px)",
        borderRadius:  12,
        background:    C.colBg,
        border:        colDropOver
          ? `2px dashed ${PALETTE.teal}`
          : `1px solid ${isOver ? cc : C.border}`,
        borderTop:     colDropOver ? `2px dashed ${PALETTE.teal}` : `3px solid ${cc}`,
        display:       "flex",
        flexDirection: "column",
        flexShrink:    0,
        overflow:      "hidden",
        position:      "relative",
        opacity:       isColDragging ? 0 : 1,
        transform:     CSS.Transform.toString(transform),
        transition:    [transition, "border-color 0.15s, box-shadow 0.15s"].filter(Boolean).join(", "),
        boxShadow:     colDropOver
          ? `0 0 0 3px ${PALETTE.teal}44`
          : (isOver ? `0 0 0 2px ${cc}55, ${C.colShadow}` : C.colShadow),
      }}
    >
      {/* File drop overlay */}
      {(colDropOver || colDropping) && (
        <div style={{
          position:       "absolute", inset: 0, zIndex: 50,
          background:     PALETTE.teal + "18",
          display:        "flex", alignItems: "center", justifyContent: "center",
          flexDirection:  "column", gap: 8,
          pointerEvents:  "none", borderRadius: 12,
        }}>
          <span style={{ fontSize: 28 }}>🖼</span>
          <span style={{ color: PALETTE.teal, fontWeight: 700, fontSize: 13 }}>
            {colDropping ? "Uploading…" : "Drop to create card"}
          </span>
        </div>
      )}

      {/* ── Header (drag handle for column reorder) ── */}
      <div
        {...colAttrs}
        {...colListeners}
        style={{
          padding:        "9px 10px 8px",
          background:     C.isLight ? cc + "18" : C.colHdr,
          borderBottom:   `1px solid ${C.isLight ? cc + "30" : C.border}`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          flexShrink:     0,
          gap:            6,
          cursor:         "grab",
          userSelect:     "none",
        }}
        onMouseEnter={() => setHdrHover(true)}
        onMouseLeave={() => setHdrHover(false)}
      >
        {renaming ? (
          <input
            ref={renameRef}
            value={renameV}
            onChange={(e) => setRenameV(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter")  commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            style={{
              flex:         1,
              minWidth:     0,
              background:   "transparent",
              border:       `1.5px solid ${cc}`,
              borderRadius: 4,
              color:        C.text,
              padding:      "2px 6px",
              fontSize:     12.5,
              outline:      "none",
            }}
          />
        ) : (
          <span
            onDoubleClick={startRename}
            title="Double-click to rename"
            style={{
              flex:         1,
              fontSize:     12.5,
              fontWeight:   700,
              color:        C.isLight ? "#1a1838" : C.text,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              userSelect:   "none",
              cursor:       "default",
            }}
          >
            {column.title}
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <span style={{
            background:   cc + (C.isLight ? "28" : "22"),
            color:        C.isLight ? "#1a1838" : cc,
            borderRadius: 8,
            padding:      "1px 7px",
            fontSize:     11,
            fontWeight:   700,
          }}>
            {done > 0 && done === total ? `✓ ${total}` : total}
          </span>

          {hdrHover && !renaming && (
            <>
              <SmallBtn
                title="Move to category"
                color={cc}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setMoveAnchor({ top: r.bottom + 6, left: r.left });
                  setMovingCol((v) => !v);
                }}
              >📁</SmallBtn>
              <SmallBtn title="Rename list" color={cc}           onClick={startRename}>✎</SmallBtn>
              <SmallBtn title="Remove list" color="#F38181"      onClick={onRemove}>✕</SmallBtn>
            </>
          )}
        </div>
      </div>

      {movingCol && moveAnchor && (
        <CategoryPickerPopover
          anchor={moveAnchor}
          categories={(categories ?? []).filter(
            (cat) => cat.id !== (column.categoryId ?? GENERAL_CATEGORY_ID)
          )}
          onPick={(categoryId) => { onMoveColumnToCategory(categoryId); setMovingCol(false); }}
          onClose={() => setMovingCol(false)}
        />
      )}

      {/* ── Cards (droppable) ── */}
      <div
        ref={setDropRef}
        style={{
          flex:       1,
          overflowY:  "auto",
          padding:    "10px 10px 4px",
          minHeight:  60,
          background: isOver ? (C.isLight ? cc + "10" : cc + "0c") : "transparent",
          transition: "background 0.15s",
        }}
      >
        {total === 0 && !adding && (
          <div style={{
            textAlign:    "center",
            color:        C.muted,
            fontSize:     11,
            padding:      "18px 0",
            opacity:      0.5,
            userSelect:   "none",
            border:       `1.5px dashed ${C.border}`,
            borderRadius: 8,
          }}>
            Drop cards here
          </div>
        )}

        <SortableContext
          items={displayCards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {displayCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              columnId={column.id}
              accentColor={cc}
              isActiveCard={card.id === activeCardId}
              onDelete={() => deleteCard(column.id, card.id)}
              onToggle={() => toggleDone(column.id, card.id)}
              onEditCard={(d) => editCard(column.id, card.id, d)}
              onCyclePriority={() => setPriority(column.id, card.id, nextPriority(card.priority))}
              categories={categories}
              allColumns={allColumns}
              currentCategoryId={column.categoryId ?? GENERAL_CATEGORY_ID}
              onMoveCard={(toColId) => onMoveCardToColumn(card.id, toColId)}
            />
          ))}
        </SortableContext>
      </div>

      {/* ── Add card ── */}
      <div style={{ padding: "6px 10px 10px", flexShrink: 0 }}>
        {adding ? (
          <AddCardForm
            accentColor={cc}
            onAdd={(d) => { addCard(column.id, d); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <AddCardBtn color={cc} onClick={() => setAdding(true)} />
        )}
      </div>
    </div>
  );
}
