import { useState, useRef, useEffect } from "react";
import { useT, PALETTE } from "../theme";
import { PRIORITIES } from "../constants";
import { inputStyle, darken } from "../utils";
import ImageUpload from "./ImageUpload";

export default function AddCardForm({ accentColor, onAdd, onCancel }) {
  const { C } = useT();
  const [title,    setTitle]    = useState("");
  const [priority, setPriority] = useState("");
  const [date,     setDate]     = useState("");
  const [author,   setAuthor]   = useState("");
  const [image,    setImage]    = useState("");
  const ref = useRef();

  useEffect(() => {
    ref.current?.focus();
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, []);

  const submit = () => {
    if (title.trim() || image) onAdd({ title: title.trim(), priority, date, author, image });
    else onCancel();
  };

  const is = inputStyle(C);

  return (
    <div
      style={{
        background:   C.isLight ? "#ffffff" : C.cardBg,
        border:       `1.5px solid ${accentColor}`,
        borderRadius: 8,
        padding:      11,
        boxShadow:    C.isLight ? `0 4px 16px ${accentColor}30` : "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={ref}
        placeholder="Card title…"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") onCancel();
        }}
        rows={1}
        style={{ ...is, resize: "none", overflow: "hidden", lineHeight: 1.4, fontFamily: "inherit" }}
      />

      {/* Priority picker */}
      <div style={{ marginTop: 9 }}>
        <div style={{
          fontSize: 10, color: C.muted, marginBottom: 5,
          textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600,
        }}>
          Priority
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {PRIORITIES.map((p) => {
            const active = priority === p.value;
            const col    = p.color || C.muted;
            return (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                style={{
                  background:   active ? col + "30" : "transparent",
                  border:       `1.5px solid ${active ? col : C.border}`,
                  borderRadius: 5,
                  color:        C.isLight ? (active ? darken(col) : C.muted) : (active ? col : C.muted),
                  padding:      "2px 8px",
                  fontSize:     11,
                  cursor:       "pointer",
                  fontWeight:   active ? 700 : 400,
                  transition:   "all 0.1s",
                }}
              >
                {p.value ? `● ${p.label}` : "—"}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        placeholder="Details (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        rows={2}
        style={{ ...is, marginTop: 8, resize: "vertical", minWidth: "100%", maxWidth: "100%" }}
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ ...is, marginTop: 6, colorScheme: C.isLight ? "light" : "dark" }}
      />

      <ImageUpload value={image} onChange={setImage} />

      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button
          onClick={submit}
          style={{
            background:   accentColor,
            color:        C.isLight ? "#1a1838" : "#13132a",
            border:       "none",
            borderRadius: 6,
            padding:      "5px 16px",
            fontSize:     12,
            fontWeight:   700,
            cursor:       "pointer",
            boxShadow:    `0 2px 8px ${accentColor}55`,
          }}
        >
          Add
        </button>
        <button
          onClick={onCancel}
          style={{
            background:   "none",
            border:       `1px solid ${C.border}`,
            borderRadius: 6,
            color:        C.muted,
            padding:      "5px 10px",
            fontSize:     12,
            cursor:       "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
