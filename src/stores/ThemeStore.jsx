import { create } from "zustand";
import { persist } from "zustand/middleware";

export const COLOR_TEMPLATES = [
  {
    id: "golden",
    name: "Golden",
    primary: "#e6a905",
    hover: "#f5b91b",
    stronger: "#d49a04",
    rgb: "230,169,5",
    foreground: "#1a1605",
    gradient: ["#e6a905", "#f5b91b"],
    gradientStrong: ["#d49a04", "#f5b91b"],
    glowLight: "rgba(230,169,5,0.10)",
    glowDark: "rgba(230,169,5,0.10)",
    charts: ["#e6a905", "#f5b91b", "#f97316", "#10b981", "#3b82f6"],
  },
  {
    id: "ocean",
    name: "Ocean",
    primary: "#3b82f6",
    hover: "#60a5fa",
    stronger: "#2563eb",
    rgb: "59,130,246",
    foreground: "#ffffff",
    gradient: ["#3b82f6", "#22d3ee"],
    gradientStrong: ["#2563eb", "#0891b2"],
    glowLight: "rgba(59,130,246,0.10)",
    glowDark: "rgba(59,130,246,0.12)",
    charts: ["#3b82f6", "#22d3ee", "#818cf8", "#10b981", "#f59e0b"],
  },
  {
    id: "emerald",
    name: "Emerald",
    primary: "#10b981",
    hover: "#34d399",
    stronger: "#059669",
    rgb: "16,185,129",
    foreground: "#ffffff",
    gradient: ["#10b981", "#2dd4bf"],
    gradientStrong: ["#059669", "#0d9488"],
    glowLight: "rgba(16,185,129,0.10)",
    glowDark: "rgba(16,185,129,0.12)",
    charts: ["#10b981", "#2dd4bf", "#14b8a6", "#3b82f6", "#f59e0b"],
  },
  {
    id: "violet",
    name: "Violet",
    primary: "#8b5cf6",
    hover: "#a78bfa",
    stronger: "#7c3aed",
    rgb: "139,92,246",
    foreground: "#ffffff",
    gradient: ["#8b5cf6", "#d946ef"],
    gradientStrong: ["#7c3aed", "#c026d3"],
    glowLight: "rgba(139,92,246,0.10)",
    glowDark: "rgba(139,92,246,0.13)",
    charts: ["#8b5cf6", "#a78bfa", "#d946ef", "#f472b6", "#60a5fa"],
  },
  {
    id: "rose",
    name: "Rose",
    primary: "#f43f5e",
    hover: "#fb7185",
    stronger: "#e11d48",
    rgb: "244,63,94",
    foreground: "#ffffff",
    gradient: ["#f43f5e", "#fb923c"],
    gradientStrong: ["#e11d48", "#ea580c"],
    glowLight: "rgba(244,63,94,0.10)",
    glowDark: "rgba(244,63,94,0.12)",
    charts: ["#f43f5e", "#fb7185", "#fb923c", "#f59e0b", "#8b5cf6"],
  },
  {
    id: "sunset",
    name: "Sunset",
    primary: "#f97316",
    hover: "#fb923c",
    stronger: "#ea580c",
    rgb: "249,115,22",
    foreground: "#ffffff",
    gradient: ["#f97316", "#f43f5e"],
    gradientStrong: ["#ea580c", "#e11d48"],
    glowLight: "rgba(249,115,22,0.10)",
    glowDark: "rgba(249,115,22,0.12)",
    charts: ["#f97316", "#fb923c", "#f43f5e", "#8b5cf6", "#22c55e"],
  },
  {
    id: "neon",
    name: "Neon",
    primary: "#06b6d4",
    hover: "#22d3ee",
    stronger: "#0891b2",
    rgb: "6,182,212",
    foreground: "#073042",
    gradient: ["#06b6d4", "#3b82f6"],
    gradientStrong: ["#0891b2", "#2563eb"],
    glowLight: "rgba(6,182,212,0.10)",
    glowDark: "rgba(6,182,212,0.12)",
    charts: ["#06b6d4", "#22d3ee", "#3b82f6", "#10b981", "#a855f7"],
  },
  {
    id: "graphite",
    name: "Graphite",
    primary: "#64748b",
    hover: "#94a3b8",
    stronger: "#475569",
    rgb: "100,116,139",
    foreground: "#ffffff",
    gradient: ["#64748b", "#94a3b8"],
    gradientStrong: ["#475569", "#64748b"],
    glowLight: "rgba(100,116,139,0.08)",
    glowDark: "rgba(148,163,184,0.08)",
    charts: ["#94a3b8", "#64748b", "#475569", "#10b981", "#3b82f6"],
  },
];

export const templateMap = Object.fromEntries(COLOR_TEMPLATES.map((t) => [t.id, t]));

export const BACKGROUND_PRESETS = [
  {
    id: "neutral",
    name: "Neutral",
    light: {
      background: "#ffffff",
      foreground: "#0f172a",
      card: "#ffffff",
      "card-foreground": "#0f172a",
      popover: "#ffffff",
      "popover-foreground": "#0f172a",
      secondary: "#f1f5f9",
      "secondary-foreground": "#0f172a",
      muted: "#f1f5f9",
      "muted-foreground": "#64748b",
      accent: "#f1f5f9",
      "accent-foreground": "#0f172a",
      border: "#e2e8f0",
      input: "#e2e8f0",
    },
    dark: {
      background: "#0d1117",
      foreground: "#e6edf3",
      card: "#151b23",
      "card-foreground": "#e6edf3",
      popover: "#151b23",
      "popover-foreground": "#e6edf3",
      secondary: "#1c2430",
      "secondary-foreground": "#e6edf3",
      muted: "#1c2430",
      "muted-foreground": "#8b98a8",
      accent: "#1c2430",
      "accent-foreground": "#e6edf3",
      border: "#ffffff1f",
      input: "#ffffff21",
    },
  },
  {
    id: "warm",
    name: "Warm",
    light: {
      background: "#f9f6f1",
      foreground: "#292524",
      card: "#fefcf9",
      "card-foreground": "#292524",
      popover: "#fefcf9",
      "popover-foreground": "#292524",
      secondary: "#f1eae0",
      "secondary-foreground": "#1c1917",
      muted: "#f1eae0",
      "muted-foreground": "#79716a",
      accent: "#f1eae0",
      "accent-foreground": "#1c1917",
      border: "#e7ded0",
      input: "#e7ded0",
    },
    dark: {
      background: "#161310",
      foreground: "#e7e2dc",
      card: "#1e1a16",
      "card-foreground": "#e7e2dc",
      popover: "#1e1a16",
      "popover-foreground": "#e7e2dc",
      secondary: "#282219",
      "secondary-foreground": "#e7e2dc",
      muted: "#282219",
      "muted-foreground": "#a29a90",
      accent: "#282219",
      "accent-foreground": "#e7e2dc",
      border: "#ffffff1a",
      input: "#ffffff1d",
    },
  },
  {
    id: "cool",
    name: "Cool",
    light: {
      background: "#f3f6fa",
      foreground: "#0f172a",
      card: "#ffffff",
      "card-foreground": "#0f172a",
      popover: "#ffffff",
      "popover-foreground": "#0f172a",
      secondary: "#e9eff6",
      "secondary-foreground": "#0f172a",
      muted: "#e9eff6",
      "muted-foreground": "#64748b",
      accent: "#e9eff6",
      "accent-foreground": "#0f172a",
      border: "#dde5ee",
      input: "#dde5ee",
    },
    dark: {
      background: "#0c111c",
      foreground: "#e3e9f2",
      card: "#141a27",
      "card-foreground": "#e3e9f2",
      popover: "#141a27",
      "popover-foreground": "#e3e9f2",
      secondary: "#1d2436",
      "secondary-foreground": "#e3e9f2",
      muted: "#1d2436",
      "muted-foreground": "#94a3b8",
      accent: "#1d2436",
      "accent-foreground": "#e3e9f2",
      border: "#ffffff1c",
      input: "#ffffff20",
    },
  },
  {
    id: "earthy",
    name: "Earthy",
    light: {
      background: "#f5f7f2",
      foreground: "#1c1917",
      card: "#fdfdfb",
      "card-foreground": "#1c1917",
      popover: "#fdfdfb",
      "popover-foreground": "#1c1917",
      secondary: "#eaf0e5",
      "secondary-foreground": "#1c1917",
      muted: "#eaf0e5",
      "muted-foreground": "#6f7a6d",
      accent: "#eaf0e5",
      "accent-foreground": "#1c1917",
      border: "#dde5d6",
      input: "#dde5d6",
    },
    dark: {
      background: "#0f130f",
      foreground: "#e2e8e0",
      card: "#171d16",
      "card-foreground": "#e2e8e0",
      popover: "#171d16",
      "popover-foreground": "#e2e8e0",
      secondary: "#20281d",
      "secondary-foreground": "#e2e8e0",
      muted: "#20281d",
      "muted-foreground": "#9aa89a",
      accent: "#20281d",
      "accent-foreground": "#e2e8e0",
      border: "#ffffff18",
      input: "#ffffff1c",
    },
  },
  {
    id: "rose",
    name: "Rose",
    light: {
      background: "#fbf4f6",
      foreground: "#311822",
      card: "#fefcfd",
      "card-foreground": "#311822",
      popover: "#fefcfd",
      "popover-foreground": "#311822",
      secondary: "#f5e6ec",
      "secondary-foreground": "#2a1018",
      muted: "#f5e6ec",
      "muted-foreground": "#8c5f6e",
      accent: "#f5e6ec",
      "accent-foreground": "#2a1018",
      border: "#e9d3dc",
      input: "#e9d3dc",
    },
    dark: {
      background: "#150e13",
      foreground: "#f0e2e8",
      card: "#1e151b",
      "card-foreground": "#f0e2e8",
      popover: "#1e151b",
      "popover-foreground": "#f0e2e8",
      secondary: "#291b22",
      "secondary-foreground": "#f0e2e8",
      muted: "#291b22",
      "muted-foreground": "#b1899a",
      accent: "#291b22",
      "accent-foreground": "#f0e2e8",
      border: "#ffffff1a",
      input: "#ffffff1e",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    light: {
      background: "#f6f5fb",
      foreground: "#241d38",
      card: "#ffffff",
      "card-foreground": "#241d38",
      popover: "#ffffff",
      "popover-foreground": "#241d38",
      secondary: "#eeebf8",
      "secondary-foreground": "#221a37",
      muted: "#eeebf8",
      "muted-foreground": "#6f6794",
      accent: "#eeebf8",
      "accent-foreground": "#221a37",
      border: "#dfdcf0",
      input: "#dfdcf0",
    },
    dark: {
      background: "#100e1a",
      foreground: "#e7e4f3",
      card: "#181527",
      "card-foreground": "#e7e4f3",
      popover: "#181527",
      "popover-foreground": "#e7e4f3",
      secondary: "#241f38",
      "secondary-foreground": "#e7e4f3",
      muted: "#241f38",
      "muted-foreground": "#9992bd",
      accent: "#241f38",
      "accent-foreground": "#e7e4f3",
      border: "#ffffff1d",
      input: "#ffffff21",
    },
  },
];

export const backgroundPresetMap = Object.fromEntries(BACKGROUND_PRESETS.map((p) => [p.id, p]));

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark",
      colorTemplate: "golden",
      backgroundPreset: "neutral",
      customBackgrounds: null, // { light: {..tokens..}, dark: {..tokens..} }

      setTheme: (theme) => {
        set({ theme });
        applyTheme(get());
      },

      toggleTheme: () => {
        set({ theme: get().theme === "dark" ? "light" : "dark" });
        applyTheme(get());
      },

      setColorTemplate: (id) => {
        set({ colorTemplate: id });
        applyTheme(get());
      },

      setBackgroundPreset: (id) => {
        set({ backgroundPreset: id });
        applyTheme(get());
      },

      setCustomBackgrounds: (updates) => {
        const theme = get().theme;
        const prev = get().customBackgrounds || {};
        const next = {
          ...prev,
          [theme]: { ...(prev[theme] || {}), ...updates },
        };
        set({ customBackgrounds: next, backgroundPreset: "custom" });
        applyTheme(get());
      },

      resetCustomBackgrounds: () => {
        const theme = get().theme;
        const prev = get().customBackgrounds || {};
        const next = { ...prev };
        delete next[theme];
        set({ customBackgrounds: Object.keys(next).length ? next : null });
        applyTheme(get());
      },

      initTheme: () => {
        applyTheme(get());
      },
    }),
    {
      name: "theme-storage",
      partialize: (state) => ({
        theme: state.theme,
        colorTemplate: state.colorTemplate,
        backgroundPreset: state.backgroundPreset,
        customBackgrounds: state.customBackgrounds,
      }),
    }
  )
);

function applyTheme({ theme, colorTemplate, backgroundPreset, customBackgrounds }) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);

  const t = templateMap[colorTemplate] || templateMap.golden;

  // 1. Apply brand accent / color template variables
  root.style.setProperty("--accent-primary", t.primary);
  root.style.setProperty("--accent-hover", t.hover);
  root.style.setProperty("--accent-stronger", t.stronger);
  root.style.setProperty("--accent-rgb", t.rgb);
  root.style.setProperty("--brand-gradient", `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`);
  root.style.setProperty("--brand-gradient-strong", `linear-gradient(135deg, ${t.gradientStrong[0]}, ${t.gradientStrong[1]})`);
  root.style.setProperty("--app-glow", theme === "dark" ? t.glowDark : t.glowLight);

  t.charts.forEach((c, i) => root.style.setProperty(`--chart-${i + 1}`, c));

  // 2. Apply background preset tokens (background, card, muted, foreground, border, etc.)
  const preset = backgroundPresetMap[backgroundPreset] || backgroundPresetMap.neutral;
  let tokens = { ...preset[theme] };
  if (backgroundPreset === "custom") {
    const custom = customBackgrounds?.[theme] || {};
    tokens = { ...tokens, ...custom };
  }
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // 3. Re-apply primary/ring AFTER preset so color template always wins
  root.style.setProperty("--primary", t.primary);
  root.style.setProperty("--primary-foreground", t.foreground);
  root.style.setProperty("--ring", t.primary);

  // 4. Derive sidebar variables from background tokens (fixes transparent sidebar)
  const bg = tokens.background || (theme === "dark" ? "#0d1117" : "#ffffff");
  const card = tokens.card || (theme === "dark" ? "#151b23" : "#ffffff");
  const fg = tokens.foreground || (theme === "dark" ? "#e6edf3" : "#0f172a");
  const mutedFg = tokens["muted-foreground"] || (theme === "dark" ? "#8b98a8" : "#64748b");
  const muted = tokens.muted || (theme === "dark" ? "#1c2430" : "#f1f5f9");
  const border = tokens.border || (theme === "dark" ? "rgba(255,255,255,0.12)" : "#e2e8f0");

  root.style.setProperty("--sidebar", card);
  root.style.setProperty("--sidebar-foreground", fg);
  root.style.setProperty("--sidebar-primary", t.primary);
  root.style.setProperty("--sidebar-primary-foreground", t.foreground);
  root.style.setProperty("--sidebar-accent", muted);
  root.style.setProperty("--sidebar-accent-foreground", fg);
  root.style.setProperty("--sidebar-border", border);
  root.style.setProperty("--sidebar-ring", t.primary);
  root.style.setProperty("--sidebar-muted-foreground", mutedFg);
}


/** Get a flat list of the css color tokens (used by the appearance editor). */
export function getBackgroundTokens(state) {
  const { theme, backgroundPreset, customBackgrounds } = state;
  const preset = backgroundPresetMap[backgroundPreset] || backgroundPresetMap.neutral;
  let tokens = { ...preset[theme] };
  if (backgroundPreset === "custom") {
    const custom = customBackgrounds?.[theme] || {};
    tokens = { ...tokens, ...custom };
  }
  return tokens;
}