import { useState, useRef } from "react";
import { useT, PALETTE } from "../theme";
import { uploadToCloudinary } from "../cloudinary";

export default function ImageUpload({ value, onChange }) {
  const { C } = useT();
  const [uploading, setUploading] = useState(false);
  const [err,       setErr]       = useState(null);
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    setErr(null);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch {
      setErr("Upload failed, try again.");
    }
    setUploading(false);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {value ? (
        <div style={{ position: "relative", borderRadius: 6, overflow: "hidden" }}>
          <img
            src={value}
            alt=""
            style={{ width: "100%", maxHeight: 130, objectFit: "cover", display: "block" }}
          />
          <button
            onClick={() => onChange("")}
            title="Remove image"
            style={{
              position:     "absolute",
              top:          5,
              right:        5,
              background:   "rgba(0,0,0,0.55)",
              color:        "#fff",
              border:       "none",
              borderRadius: "50%",
              width:        22,
              height:       22,
              cursor:       "pointer",
              fontSize:     12,
              lineHeight:   "22px",
              textAlign:    "center",
              padding:      0,
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width:        "100%",
            background:   "transparent",
            border:       `1.5px dashed ${C.border}`,
            borderRadius: 6,
            color:        uploading ? C.accent : C.muted,
            padding:      "7px 10px",
            fontSize:     11.5,
            cursor:       uploading ? "default" : "pointer",
            transition:   "all 0.15s",
          }}
        >
          {uploading ? "⏳ Uploading…" : "🖼 Add image"}
        </button>
      )}

      {err && (
        <div style={{ color: PALETTE.coral, fontSize: 11, marginTop: 4 }}>{err}</div>
      )}
    </div>
  );
}
