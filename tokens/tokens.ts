// GENERIERT aus tokens/tokens.json — NICHT bearbeiten (INV-H2).
//
// Konsum in Klasse B (Modeler/Viewer): Renderer beziehen Farben und Metriken
// ausschließlich hierüber bzw. über die CSS-Variablen (INV-H2).

export const light = {
  "color-bg": "#ffffff",
  "color-surface": "#f5f6f8",
  "color-fg": "#1a1d21",
  "color-muted": "#5a6169",
  "color-border": "#d5d9de",
  "color-accent": "#2f6feb",
  "space-1": "4px",
  "space-2": "8px",
  "space-3": "12px",
  "space-4": "16px",
  "space-6": "24px",
  "space-8": "32px",
  "radius-sm": "4px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "font-family-sans": "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  "font-family-mono": "ui-monospace, SFMono-Regular, Menlo, monospace",
  "font-size-sm": "13px",
  "font-size-md": "14px",
  "font-size-lg": "16px",
} as const;

export const dark = {
  "color-bg": "#0e1116",
  "color-surface": "#161b22",
  "color-fg": "#e6e8eb",
  "color-muted": "#9aa4af",
  "color-border": "#2a313a",
  "color-accent": "#5b8cff",
  "space-1": "4px",
  "space-2": "8px",
  "space-3": "12px",
  "space-4": "16px",
  "space-6": "24px",
  "space-8": "32px",
  "radius-sm": "4px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "font-family-sans": "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  "font-family-mono": "ui-monospace, SFMono-Regular, Menlo, monospace",
  "font-size-sm": "13px",
  "font-size-md": "14px",
  "font-size-lg": "16px",
} as const;

export type TokenKey = keyof typeof light;
export type Theme = typeof light;

/** CSS-Variablenreferenz zu einem Token, z. B. cssVar('color-accent') === 'var(--color-accent)'. */
export const cssVar = (key: TokenKey): string => `var(--${key})`;

/** Default-Theme (hell). Rohwerte; für Theming bevorzugt cssVar() nutzen. */
export const tokens = light;
