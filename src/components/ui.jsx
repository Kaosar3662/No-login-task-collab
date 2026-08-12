import { useState } from "react";
import { PALETTE } from "../theme";
import { useT } from "../theme";
import { darken } from "../utils";
import { NAMES_INDEX } from "../../node_modules/@jridgewell/trace-mapping/src/sourcemap-segment";

export function UndoRedoBtn({ label, title, enabled, onClick }) {
  const { C } = useT();
  const [h, setH] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      disabled={!enabled}
      style={{
        background:   h && enabled
          ? (C.isLight ? PALETTE.teal + "30" : PALETTE.teal + "25")
          : "transparent",
        border:       "none",
        borderRadius: 5,
        color:        enabled
          ? (h ? (C.isLight ? darken(PALETTE.teal) : PALETTE.teal) : C.text)
          : C.muted,
        cursor:       enabled ? "pointer" : "default",
        padding:      "3px 8px",
        fontSize:     15,
        lineHeight:   1,
        opacity:      enabled ? 1 : 0.35,
        transition:   "all 0.12s",
      }}
    >
      {label}
    </button>
  );
}

export function AddCardBtn({ color, onClick }) {
  const { C } = useT();
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width:        "100%",
        background:   h ? color + (C.isLight ? "18" : "14") : "transparent",
        border:       `1px dashed ${h ? color : C.border}`,
        borderRadius: 6,
        color:        h ? (C.isLight ? darken(color) : color) : C.muted,
        padding:      "6px 10px",
        cursor:       "pointer",
        fontSize:     12,
        textAlign:    "left",
        transition:   "all 0.15s",
      }}
    >
      + Add a card
    </button>
  );
}

export function AddListBtn({ onClick }) {
  const { C } = useT();
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background:   h
          ? (C.isLight ? "#ffffff" : "rgba(255,255,255,0.07)")
          : (C.isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.04)"),
        border:       `1.5px dashed ${h ? PALETTE.teal : C.border}`,
        borderRadius: 12,
        color:        h ? (C.isLight ? darken(PALETTE.teal) : PALETTE.teal) : C.muted,
        padding:      "14px 22px",
        cursor:       "pointer",
        fontSize:     13,
        whiteSpace:   "nowrap",
        transition:   "all 0.15s",
        width:        200,
        boxShadow:    h ? (C.isLight ? `0 4px 16px ${PALETTE.teal}30` : "none") : "none",
      }}
    >
      + Add list
    </button>
  );
}

export function SmallBtn({ title, color, onClick, children }) {
  const { C } = useT();
  const [h, setH] = useState(false);
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background:   h ? color + "22" : "none",
        border:       "none",
        color:        h ? color : C.muted,
        cursor:       "pointer",
        padding:      "1px 4px",
        borderRadius: 4,
        fontSize:     11,
        lineHeight:   1,
        transition:   "all 0.1s",
      }}
    >
      {children}
    </button>
  );
}

export function IconBtn({ label, title, color, light, onClick }) {
  const { C } = useT();
  const [h, setH] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background:   h ? color + "25" : "none",
        border:       "none",
        color:        h ? (light ? darken(color) : color) : C.muted,
        cursor:       "pointer",
        padding:      "2px 5px",
        borderRadius: 4,
        fontSize:     12,
        lineHeight:   1,
        transition:   "all 0.1s",
      }}
    >
      {label}
    </button>
  );
}

export function Chip({ children, color, bg }) {
  return (
    <span style={{
      background:   bg || color + "18",
      color,
      borderRadius: 12,
      padding:      "3px 10px",
      fontSize:     12,
      border:       `1px solid ${color}33`,
    }}>
      {children}
    </span>
  );
}

export function WeboceanLogo({ size }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: "-0.5px", lineHeight: 1 }}>
      <span style={{ color: PALETTE.coral }}>Your Brand Name</span>
    </span>
  );
}
