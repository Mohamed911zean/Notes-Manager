import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../stores/AuthStore";
import {
  Home,
  CalendarDays,
  CheckSquare,
  FileText,
  Timer,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { useThemeStore, COLOR_TEMPLATES } from "../../stores/ThemeStore";
import AppearanceModal from "./AppearanceModal";

const ACCENTS = COLOR_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  gradient: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`,
  primary: t.primary,
}));

const navItems = [
  { text: "Home", icon: Home, path: "/home" },
  { text: "Calendar", icon: CalendarDays, path: "/calendar" },
  { text: "Tasks", icon: CheckSquare, path: "/tasks" },
  { text: "Notes", icon: FileText, path: "/notes" },
  { text: "Timer", icon: Timer, path: "/pomodoro" },
  { text: "Analytics", icon: BarChart3, path: "/analytics" },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, colorTemplate, setColorTemplate } = useThemeStore();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center h-16 px-4 border-b border-border ${collapsed && !isMobile ? "justify-center" : "gap-3"}`}>
        {!collapsed || isMobile ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--brand-gradient)" }}>
                Tracify
              </span>
            </span>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-sm">T</span>
          </div>
        )}
      </div>

      <nav className={`flex-1 p-3 space-y-1 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                title={collapsed && !isMobile ? item.text : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={18} className="flex-shrink-0" />
                {(!collapsed || isMobile) && <span>{item.text}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={`p-3 border-t border-border space-y-2 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all ${
            collapsed && !isMobile ? "justify-center px-2" : ""
          }`}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {(!collapsed || isMobile) && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </button>

        {collapsed && !isMobile && (
          <button
            onClick={() => setAppearanceOpen(true)}
            className="flex items-center justify-center w-full px-2 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            title="Customize appearance"
          >
            <Palette size={18} />
          </button>
        )}

        {/* Color system picker */}
        {(!collapsed || isMobile) && (
          <div className="px-3 py-2 rounded-xl hover:bg-accent/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Theme</span>
              </div>
              <button
                onClick={() => setAppearanceOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <SlidersHorizontal size={11} />
                Customize
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {ACCENTS.slice(0, 8).map((a) => {
                const active = colorTemplate === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setColorTemplate(a.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      active ? "ring-2 ring-offset-1 ring-offset-card scale-105 bg-accent" : "hover:scale-110 bg-accent/40"
                    }`}
                    title={a.name}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                      style={{ background: a.gradient, boxShadow: active ? `0 0 6px ${a.primary}` : undefined }}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1.5">
              Full editor: backgrounds, surfaces & more.
            </p>
          </div>
        )}

        {!collapsed || isMobile ? (
          <div className="flex items-center justify-between gap-2 bg-accent/50 p-2 rounded-xl">
            <div className="overflow-hidden min-w-0">
              <p className="text-[10px] text-muted-foreground">Account</p>
              <p className="text-xs font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex items-center justify-center w-full p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-[280px] bg-card border-r border-border z-50 lg:hidden"
          >
            <SidebarContent isMobile />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-card border-r border-border z-30 flex-col transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <AppearanceModal open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </>
  );
}
