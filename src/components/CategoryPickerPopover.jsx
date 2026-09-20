import { useEffect, useRef } from "react";
import { useT } from "../theme";
import { colColor } from "../constants";

export default function CategoryPickerPopover({ anchor, categories, onPick, onClose }) {
  const { C } = useT();
  const ref = useRef();

  useEffect(() => {
    const onDocDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey     = (e) => { if (e.key === "Escape") onClose(); };
    const onScroll  = () => onClose();
    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position:      "fixed",
        top:           anchor.top,
        left:          anchor.left,
        minWidth:      170,
        maxHeight:     240,
        overflowY:     "auto",
        background:    C.cardBg,
        border:        `1px solid ${C.border}`,
        borderRadius:  10,
        boxShadow:     "0 12px 32px rgba(0,0,0,0.35)",
        padding:       5,
        display:       "flex",
        flexDirection: "column",
        gap:           3,
        zIndex:        2500,
      }}
    >
      <div style={{
        fontSize: 10.5, color: C.muted, padding: "2px 6px 4px",
        fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px",
      }}>
        Move to category
      </div>
      {categories.length === 0 && (
        <div style={{ fontSize: 11.5, color: C.muted, padding: "4px 6px" }}>
          No other categories yet
        </div>
      )}
      {categories.map((cat) => {
        const cc = colColor(cat.id);
        return (
          <button
            key={cat.id}
            onClick={() => onPick(cat.id)}
            style={{
              background:   "transparent",
              border:       "none",
              borderLeft:   `3px solid ${cc}`,
              borderRadius: 6,
              padding:      "6px 8px",
              color:        C.text,
              fontSize:     12.5,
              fontWeight:   600,
              textAlign:    "left",
              cursor:       "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = cc + "18"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
