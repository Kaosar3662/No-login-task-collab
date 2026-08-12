import { createContext, useContext } from "react";

export const PALETTE = {
  coral:  "#F38181",
  yellow: "#FCE38A",
  mint:   "#EAFFD0",
  teal:   "#95E1D3",
};

export const LIGHT = {
  pageBg: `linear-gradient(135deg,
    #fff0f0e1 0%,
    #fffceee2 28%,
    #f4fff8e8 58%,
    #edfcfbe8 100%)`,
  headerBg:     "rgba(255,255,255,0.82)",
  headerBlur:   "blur(16px)",
  headerBorder: "rgba(239, 239, 239, 0.55)",
  colBg:        "#ffffff",
  colHdr:       "#f9f8fe",
  colShadow:    "0 4px 24px rgba(255, 255, 255, 0.09)",
  cardBg:       "#ffffff",
  cardHover:    "#f3f4ff",
  cardShadow:   "0 1px 4px rgba(60,40,140,0.07)",
  cardShadowHover: "0 3px 12px rgba(60,40,140,0.12)",
  border:       "#e6e4f8",
  borderLit:    "#c0b8f0",
  text:         "#1a1838",
  muted:        "#9592b8",
  accent:       "#5dcfc0",
  tag:          "#eeeeff",
  isLight:      true,
};

export const DARK = {
  pageBg: `linear-gradient(135deg,
    #130f1f 0%,
    #0f1422 40%,
    #0c1a1e 100%)`,
  headerBg:     "rgba(18,18,40,0.88)",
  headerBlur:   "blur(16px)",
  headerBorder: "rgba(60,60,120,0.6)",
  colBg:        "#1c1c3a",
  colHdr:       "#17172f",
  colShadow:    "0 4px 24px rgba(0,0,0,0.35)",
  cardBg:       "#242448",
  cardHover:    "#2c2c58",
  cardShadow:   "none",
  cardShadowHover: "0 0 0 1px rgba(149,225,211,0.2)",
  border:       "#2a2a52",
  borderLit:    "#4a4a8a",
  text:         "#eaeaff",
  muted:        "#6868a0",
  accent:       "#95E1D3",
  tag:          "#14142e",
  isLight:      false,
};

export const THEME_RING    = [PALETTE.coral, PALETTE.yellow, PALETTE.mint, PALETTE.teal];
export const CURSOR_COLORS = [
  "#F38181", "#FCE38A", "#95E1D3", "#EAFFD0",
  "#a78bfa", "#60a5fa", "#f472b6", "#34d399",
];

export const ThemeCtx = createContext({});
export const useT     = () => useContext(ThemeCtx);
