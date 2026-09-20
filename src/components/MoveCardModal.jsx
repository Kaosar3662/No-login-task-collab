import { useState, useEffect } from "react";
import { useT, PALETTE } from "../theme";
import { colColor, GENERAL_CATEGORY_ID } from "../constants";

function NewListRow({ categoryId, onCreate }) {
  const { C } = useT();
  const [adding, setAdding] = useState(false);
  const [title,  setTitle]  = useState("");

  const submit = () => {
    const t = title.trim();
    if (t) onCreate(categoryId, t);
    setTitle("");
    setAdding(false);
  };

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        style={{
          background:   "transparent",
          border:       `1px dashed ${C.border}`,
          borderRadius: 8,
          padding:      "8px 12px",
          color:        C.muted,
          fontSize:     12,
          cursor:       "pointer",
          textAlign:    "left",
        }}
      >
        + New list here
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter")  submit();
        if (e.key === "Escape") { setTitle(""); setAdding(false); }
      }}
      placeholder="List name…"
      style={{
        width:        "100%",
        boxSizing:    "border-box",
        background:   "transparent",
        border:       `1.5px solid ${PALETTE.teal}`,
        borderRadius: 8,
        color:        C.text,
        padding:      "8px 12px",
        fontSize:     12.5,
        outline:      "none",
      }}
    />
  );
}

export default function MoveCardModal({ categories, columns, currentCategoryId, onMove, onCreateList, onClose }) {
  const { C } = useT();

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cats = (categories && categories.length ? categories : [{ id: GENERAL_CATEGORY_ID, name: "General" }])
    .filter((cat) => cat.id !== currentCategoryId);

  const groups = cats.map((cat) => ({
    cat,
    cols: (columns ?? []).filter((c) => (c.categoryId ?? GENERAL_CATEGORY_ID) === cat.id),
  }));

  return (
    <div
      onClick={onClose}
      style={{
        position:       "fixed", inset: 0, zIndex: 2000,
        background:     "rgba(0,0,0,0.55)",
        backdropFilter: "blur(5px)",
        display:        "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background:    C.cardBg,
          border:        `1px solid ${C.border}`,
          borderRadius:  16,
          padding:       "22px 22px 18px",
          width:         340,
          maxHeight:     "80vh",
          display:       "flex",
          flexDirection: "column",
          gap:           14,
          boxShadow:     "0 24px 64px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              Move card to…
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Choose a category and list
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background:   "none", border: "none",
              color:        C.muted, fontSize: 17,
              cursor:       "pointer", lineHeight: 1,
              padding:      "2px 4px", borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {groups.length === 0 && (
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "10px 0" }}>
              No other categories yet — create one from the categories menu at the top.
            </div>
          )}
          {groups.map(({ cat, cols }) => (
            <div key={cat.id}>
              <div style={{
                fontSize: 10.5, color: C.muted, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 5,
              }}>
                {cat.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {cols.map((col) => {
                  const cc = colColor(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => onMove(col.id)}
                      style={{
                        background:  "#00000030",
                        border:      `1px solid ${C.border}`,
                        borderLeft:  `3px solid ${cc}`,
                        borderRadius: 8,
                        padding:     "9px 13px",
                        color:       C.text,
                        fontSize:    12.5,
                        fontWeight:  600,
                        cursor:      "pointer",
                        textAlign:   "left",
                        transition:  "background 0.1s, border-color 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background      = cc + "18";
                        e.currentTarget.style.borderColor      = cc;
                        e.currentTarget.style.borderLeftColor  = cc;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background      = '#00000030';
                        e.currentTarget.style.borderColor      = C.border;
                        e.currentTarget.style.borderLeftColor  = cc;
                      }}
                    >
                      {col.title}
                    </button>
                  );
                })}
                <NewListRow categoryId={cat.id} onCreate={onCreateList} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
