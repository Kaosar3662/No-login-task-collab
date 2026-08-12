import { useState, useEffect, useRef } from "react";
import { useT, PALETTE } from "../theme";
import { colColor } from "../constants";
import { uploadToCloudinary } from "../cloudinary";

export default function PasteImageOverlay({ columns, imageFile, onAdd, onClose }) {
  const { C } = useT();
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const [preview,   setPreview]   = useState(null);
  const objectUrlRef = useRef(null);

  // Build a local preview URL
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    objectUrlRef.current = url;
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSelect = async (colId) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadToCloudinary(imageFile);
      onAdd(colId, url);
    } catch {
      setError("Upload failed — try again.");
      setUploading(false);
    }
  };

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
          background:   C.cardBg,
          border:       `1px solid ${C.border}`,
          borderRadius: 16,
          padding:      "22px 22px 18px",
          width:        340,
          maxHeight:    "80vh",
          display:      "flex",
          flexDirection:"column",
          gap:          14,
          boxShadow:    "0 24px 64px rgba(0,0,0,0.45)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
              Paste image to…
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Choose a column
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

        {/* Image preview */}
        {preview && (
          <div style={{
            borderRadius: 10, overflow: "hidden",
            border:       `1px solid ${C.border}`,
            lineHeight:   0, flexShrink: 0,
          }}>
            <img
              src={preview}
              alt="paste preview"
              style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        {/* Column list or uploading state */}
        {uploading ? (
          <div style={{
            display:        "flex", flexDirection: "column",
            alignItems:     "center", justifyContent: "center",
            padding:        "20px 0", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: `3px solid ${C.border}`,
              borderTop: `3px solid ${PALETTE.teal}`,
              animation: "spin 0.8s linear infinite",
            }} />
            <span style={{ color: PALETTE.teal, fontSize: 13, fontWeight: 600 }}>
              Uploading…
            </span>
          </div>
        ) : (
          <div style={{
            overflowY:  "auto",
            display:    "flex",
            flexDirection: "column",
            gap:        5,
          }}>
            {columns.map((col) => {
              const cc = colColor(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => handleSelect(col.id)}
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
                    e.currentTarget.style.background    = cc + "18";
                    e.currentTarget.style.borderColor   = cc;
                    e.currentTarget.style.borderLeftColor = cc;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#00000030';
                    e.currentTarget.style.borderColor   = C.border;
                    e.currentTarget.style.borderLeftColor = cc;
                  }}
                >
                  {col.title}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{ color: PALETTE.coral, fontSize: 11, textAlign: "center" }}>
            {error}
          </div>
        )}
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
