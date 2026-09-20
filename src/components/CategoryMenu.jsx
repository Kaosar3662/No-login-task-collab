import { useState, useEffect, useRef } from "react";
import { useT, PALETTE } from "../theme";
import { colColor, GENERAL_CATEGORY_ID } from "../constants";

export default function CategoryMenu({
  categories, selectedCategoryId, onSelect, onCreate, onDelete, categoryColumnCounts,
}) {
  const { C } = useT();
  const [open,   setOpen]   = useState(false);
  const [adding, setAdding] = useState(false);
  const [name,   setName]   = useState("");
  const ref = useRef();

  useEffect(() => {
    const onDocDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setAdding(false); }
    };
    const onKey = (e) => {
      if (e.key === "Escape") { setOpen(false); setAdding(false); }
    };
    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const current = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];

  const submitNew = () => {
    const trimmed = name.trim();
    if (trimmed) onCreate(trimmed);
    setName("");
    setAdding(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display:      "flex", alignItems: "center", gap: 6,
          background:   C.isLight ? "#f0eeff" : "#28284a",
          border:       `1px solid ${C.border}`,
          borderRadius: 8,
          padding:      "5px 12px",
          color:        C.text,
          fontSize:     12.5,
          fontWeight:   700,
          cursor:       "pointer",
        }}
      >
        📁 {current?.name ?? "General"} <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position:      "absolute",
            top:           "100%",
            left:          0,
            marginTop:     6,
            width:         220,
            maxHeight:     320,
            overflowY:     "auto",
            background:    C.cardBg,
            border:        `1px solid ${C.border}`,
            borderRadius:  10,
            boxShadow:     "0 12px 32px rgba(0,0,0,0.35)",
            padding:       6,
            display:       "flex",
            flexDirection: "column",
            gap:           3,
            zIndex:        500,
          }}
        >
          {categories.map((cat) => {
            const cc         = colColor(cat.id);
            const isGeneral  = cat.id === GENERAL_CATEGORY_ID;
            const inUse      = (categoryColumnCounts?.[cat.id] ?? 0) > 0;
            const blocked    = isGeneral || inUse;
            const isSelected = cat.id === selectedCategoryId;
            return (
              <div
                key={cat.id}
                style={{
                  display:      "flex", alignItems: "center", gap: 4,
                  borderRadius: 6,
                  background:   isSelected ? cc + "1c" : "transparent",
                }}
              >
                <button
                  onClick={() => { onSelect(cat.id); setOpen(false); }}
                  style={{
                    flex: 1, textAlign: "left", background: "transparent", border: "none",
                    borderLeft: `3px solid ${cc}`, borderRadius: 6, padding: "6px 8px",
                    color: C.text, fontSize: 12.5, fontWeight: isSelected ? 700 : 600, cursor: "pointer",
                  }}
                >
                  {cat.name}
                </button>
                <button
                  title={
                    isGeneral ? "General can't be deleted"
                      : inUse ? "Move or remove its lists first"
                      : "Delete category"
                  }
                  disabled={blocked}
                  onClick={() => !blocked && onDelete(cat.id)}
                  style={{
                    background: "none", border: "none",
                    color:      blocked ? C.muted : PALETTE.coral,
                    opacity:    blocked ? 0.35 : 1,
                    cursor:     blocked ? "default" : "pointer",
                    fontSize:   12, padding: "4px 7px",
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}

          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 4, paddingTop: 6 }}>
            {adding ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={submitNew}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  submitNew();
                  if (e.key === "Escape") { setName(""); setAdding(false); }
                }}
                placeholder="Category name…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "transparent", border: `1.5px solid ${PALETTE.teal}`,
                  borderRadius: 6, color: C.text, padding: "6px 8px", fontSize: 12.5, outline: "none",
                }}
              />
            ) : (
              <button
                onClick={() => setAdding(true)}
                style={{
                  width: "100%", textAlign: "left", background: "transparent",
                  border: `1px dashed ${C.border}`, borderRadius: 6, padding: "6px 8px",
                  color: C.muted, fontSize: 12, cursor: "pointer",
                }}
              >
                + New category
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
