import { PALETTE, THEME_RING } from "./theme";

export const GENERAL_CATEGORY_ID = "general";

export const COLUMN_NAMES = [
  "Content", "Wireframe", "Design", "Development","Responsiveness", "Animation", "Testing", "Deployment", "A1 Developer",
];

export const PRIORITIES = [
  { value: "",         label: "None",     color: null           },
  { value: "low",      label: "Low",      color: PALETTE.teal   },
  { value: "medium",   label: "Medium",   color: PALETTE.mint   },
  { value: "high",     label: "High",     color: PALETTE.yellow },
  { value: "critical", label: "Critical", color: PALETTE.coral  },
];

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function colColor(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) & 0xffff;
  return THEME_RING[h % 4];
}

export function nextPriority(cur) {
  const idx = PRIORITIES.findIndex((p) => p.value === (cur ?? ""));
  return PRIORITIES[(idx + 1) % PRIORITIES.length].value;
}

export function getPriority(val) {
  return PRIORITIES.find((p) => p.value === (val ?? "")) ?? PRIORITIES[0];
}
