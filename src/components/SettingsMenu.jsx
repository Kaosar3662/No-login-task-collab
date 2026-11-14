import { useState, useEffect, useRef } from "react";
import { useT, PALETTE, THEME_RING, CURSOR_COLORS } from "../theme";
import Icon from "./Icon";

const FIELDS = [
  { key: "page",   label: "Background", from: (C) => C.pageBg },
  { key: "column", label: "Lists",      from: (C) => C.colBg },
  { key: "card",   label: "Cards",      from: (C) => C.cardBg },
  { key: "text",   label: "Text",       from: (C) => C.text },
  { key: "accent", label: "Brand",      from: (C) => C.accent },
];

const PRIORITY_FIELDS = [
  { key: "low",      label: "Low",      from: () => PALETTE.low },
  { key: "medium",   label: "Medium",   from: () => PALETTE.mint },
  { key: "high",     label: "High",     from: () => PALETTE.yellow },
  { key: "critical", label: "Critical", from: () => PALETTE.coral },
];

const LIST_FIELDS   = THEME_RING.map((_, i) => ({ key: "list" + i, from: () => THEME_RING[i] }));
const CURSOR_FIELDS = CURSOR_COLORS.map((_, i) => ({ key: "cur" + i, from: () => CURSOR_COLORS[i] }));

export default function SettingsMenu() {
  const { C, mode, setColor, resetColors, customized } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey  = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Custom colors"
        style={{
          background:   C.isLight ? "#ececec" : "#262626",
          border:       `1px solid ${C.border}`,
          borderRadius: 20,
          cursor:       "pointer",
          padding:      "4px 10px",
          fontSize:     14,
          lineHeight:   1,
          color:        C.text,
        }}
      >
        <Icon name="settings" size={16} />
      </button>

      {open && (
        <div
          style={{
            position:     "absolute",
            right:        0,
            top:          "calc(100% + 8px)",
            width:        250,
            maxHeight:    "70vh",
            overflowY:    "auto",
            background:   C.colBg,
            border:       `1px solid ${C.border}`,
            borderRadius: 12,
            padding:      14,
            boxShadow:    "0 8px 28px rgba(0,0,0,0.3)",
            zIndex:       400,
            color:        C.text,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>Custom colors</div>
          <div style={{ fontSize: 11, color: C.muted, margin: "2px 0 10px" }}>
            Saved in this browser for {mode} mode.
          </div>

          <Section title="Surfaces">
            {FIELDS.map((f) => <Row key={f.key} f={f} C={C} setColor={setColor} />)}
          </Section>

          <Section title="Priority">
            {PRIORITY_FIELDS.map((f) => <Row key={f.key} f={f} C={C} setColor={setColor} />)}
          </Section>

          <Section title="List bar colors">
            <Swatches fields={LIST_FIELDS} C={C} setColor={setColor} />
          </Section>

          <Section title="Cursor colors">
            <Swatches fields={CURSOR_FIELDS} C={C} setColor={setColor} />
          </Section>

          <button
            onClick={resetColors}
            disabled={!customized}
            style={{
              marginTop: 10,
              width:        "100%",
              background:   "none",
              border:       `1px solid ${C.border}`,
              borderRadius: 6,
              color:        customized ? C.text : C.muted,
              padding:      "5px 10px",
              fontSize:     12,
              cursor:       customized ? "pointer" : "default",
              opacity:      customized ? 1 : 0.5,
            }}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle = (C) => ({
  padding: 0, border: `1px solid ${C.border}`, borderRadius: 6, background: "none", cursor: "pointer",
});

function Section({ title, children }) {
  const { C } = useT();
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ f, C, setColor }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
      {f.label}
      <input
        type="color"
        value={f.from(C)}
        onChange={(e) => setColor(f.key, e.target.value)}
        style={{ ...inputStyle(C), width: 34, height: 24 }}
      />
    </label>
  );
}

function Swatches({ fields, C, setColor }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 6 }}>
      {fields.map((f) => (
        <input
          key={f.key}
          type="color"
          value={f.from(C)}
          onChange={(e) => setColor(f.key, e.target.value)}
          style={{ ...inputStyle(C), width: "100%", height: 26 }}
        />
      ))}
    </div>
  );
}
