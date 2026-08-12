/** Darkens a hex colour for use on light backgrounds */
export function darken(hex) {
  if (!hex) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * 0.55)},${Math.round(g * 0.55)},${Math.round(b * 0.55)})`;
}

/** Shared input / textarea base style */
export const inputStyle = (C) => ({
  width:        "100%",
  background:   C.isLight ? "#f6f4ff" : "#0e0e25",
  border:       `1px solid ${C.border}`,
  borderRadius: 5,
  color:        C.text,
  padding:      "5px 8px",
  fontSize:     12,
  outline:      "none",
  display:      "block",
});
