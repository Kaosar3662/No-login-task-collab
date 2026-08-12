import { useState, useRef, useEffect } from "react";
import { useT, PALETTE } from "../theme";
import { inputStyle } from "../utils";

export default function AddListForm({ onAdd, onCancel }) {
  const { C } = useT();
  const [val, setVal] = useState("");
  const ref = useRef();

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => { if (val.trim()) onAdd(val.trim()); };

  return (
    <div style={{
      background:   C.isLight ? "#ffffff" : C.colBg,
      border:       `1.5px solid ${PALETTE.teal}`,
      borderRadius: 12,
      borderTop:    `3px solid ${PALETTE.teal}`,
      padding:      12,
      width:        220,
      boxShadow:    C.colShadow,
    }}>
      <input
        ref={ref}
        placeholder="List name…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter")  submit();
          if (e.key === "Escape") onCancel();
        }}
        style={{ ...inputStyle(C), borderColor: PALETTE.teal }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
        <button
          onClick={submit}
          style={{
            background:   PALETTE.teal,
            color:        "#1a1838",
            border:       "none",
            borderRadius: 6,
            padding:      "5px 14px",
            fontSize:     12,
            fontWeight:   700,
            cursor:       "pointer",
            boxShadow:    `0 2px 8px ${PALETTE.teal}55`,
          }}
        >
          Add list
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
