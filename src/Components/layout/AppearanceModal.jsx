import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, Sun, Moon, Undo2, Check } from "lucide-react";
import {
  useThemeStore,
  COLOR_TEMPLATES,
  BACKGROUND_PRESETS,
  getBackgroundTokens,
} from "../../stores/ThemeStore";

const CUSTOM_FIELDS = [
  {
    key: "background",
    label: "Background",
    swatch: ["background"],
  },
  {
    key: "card",
    label: "Surfaces (cards)",
    swatch: ["card"],
  },
  {
    key: "muted",
    label: "Soft surface (muted)",
    swatch: ["muted"],
  },
  {
    key: "foreground",
    label: "Text",
    swatch: ["foreground"],
  },
  {
    key: "muted-foreground",
    label: "Soft text",
    swatch: ["muted-foreground"],
  },
  {
    key: "border",
    label: "Borders",
    swatch: ["border"],
  },
];

export default function AppearanceModal({ open, onClose }) {
  const store = useThemeStore();
  const {
    theme,
    toggleTheme,
    colorTemplate,
    setColorTemplate,
    backgroundPreset,
    setBackgroundPreset,
    setCustomBackgrounds,
    resetCustomBackgrounds,
  } = store;

  const [localCustom, setLocalCustom] = useState({});

  const currentTokens = getBackgroundTokens(store);
  const customValues = store.customBackgrounds?.[store.theme] || {};

  useEffect(() => {
    if (open) {
      const tokens = getBackgroundTokens({
        ...store,
        backgroundPreset: "custom",
      });
      setLocalCustom(tokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, store.theme]);

  const handleCustomChange = (key, value) => {
    const next = { ...localCustom, [key]: value };
    setLocalCustom(next);
    setCustomBackgrounds({ [key]: value });
  };

  const bgPresetInfo =
    BACKGROUND_PRESETS.find((p) => p.id === backgroundPreset) || null;
  const customActive = backgroundPreset === "custom";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Palette size={18} className="text-primary" />
                  <h2 className="text-sm font-semibold">Appearance</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Light" : "Dark"}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Color system templates */}
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Color System
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_TEMPLATES.map((t) => {
                      const active = colorTemplate === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setColorTemplate(t.id)}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                            active
                              ? "border-primary/60 bg-primary/10"
                              : "border-border hover:border-border hover:bg-accent"
                          }`}
                        >
                          <span
                            className="w-7 h-7 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`,
                              boxShadow: active ? `0 2px 8px ${t.primary}66` : undefined,
                            }}
                          />
                          <span
                            className={`text-[10px] font-medium truncate w-full text-center ${
                              active ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {t.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Background presets */}
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Background Theme
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BACKGROUND_PRESETS.map((p) => {
                      const active = backgroundPreset === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setBackgroundPreset(p.id)}
                          className={`relative flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            active
                              ? "border-primary/60 bg-primary/10"
                              : "border-border hover:border-border hover:bg-accent"
                          }`}
                        >
                          <span
                            className="w-8 h-8 rounded-lg flex-shrink-0 border border-border/50"
                            style={{
                              background: `linear-gradient(135deg, ${p.light.background} 50%, ${p.dark.background} 50%)`,
                            }}
                          />
                          <span
                            className={`text-[10px] font-medium ${
                              active ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {p.name}
                          </span>
                          {active && (
                            <Check size={12} className="absolute top-1 right-1 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {bgPresetInfo
                      ? `Currently using "${bgPresetInfo.name}" background${customActive ? "" : "."}`
                      : "Custom background active."}
                  </p>
                </section>

                {/* Custom background controls */}
                <section className="rounded-xl border border-dashed border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Custom Colors
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {customActive && (
                        <button
                          onClick={() => {
                            resetCustomBackgrounds();
                            setBackgroundPreset("neutral");
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Undo2 size={12} />
                          Reset
                        </button>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-medium ${
                          customActive
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {customActive ? "Custom applied" : "Using preset"}
                      </span>
                    </div>
                  </div>

                  {!customActive ? (
                    <p className="text-xs text-muted-foreground">
                      Pick a background theme above, or start customizing below.
                    </p>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mt-1">
                    {CUSTOM_FIELDS.map((f) => {
                      const val =
                        customValues[f.key] || localCustom[f.key] || currentTokens[f.key] || "#ffffff";
                      return (
                        <label key={f.key} className="flex items-center gap-2.5">
                          <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : "#ffffff"}
                            onChange={(e) => handleCustomChange(f.key, e.target.value)}
                            className="w-8 h-8 rounded-lg border border-border bg-transparent cursor-pointer flex-shrink-0"
                          />
                          <span className="text-xs text-muted-foreground">{f.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {!customActive && (
                    <button
                      onClick={() => {
                        const tokens = getBackgroundTokens({
                          ...store,
                          backgroundPreset: "custom",
                        });
                        setLocalCustom(tokens);
                        setCustomBackgrounds({
                          background: tokens.background || "#ffffff",
                          card: tokens.card || "#ffffff",
                          muted: tokens.muted || "#f1f5f9",
                          foreground: tokens.foreground || "#0f172a",
                          "muted-foreground": tokens["muted-foreground"] || "#64748b",
                          border: tokens.border || "#e2e8f0",
                        });
                      }}
                      className="mt-3 w-full py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors"
                    >
                      Start from current preset & customize
                    </button>
                  )}
                </section>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}