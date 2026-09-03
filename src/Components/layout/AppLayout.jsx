import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";
import { useThemeStore } from "../../stores/ThemeStore";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const initTheme = useThemeStore((s) => s.initTheme);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (isInput) return;
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "g") {
          e.preventDefault();
          navigate("/calendar");
        } else if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          navigate("/tasks");
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        navigate("/notes");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  return (
    <div className="h-full flex bg-background text-foreground">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${collapsed ? "lg:ml-[68px]" : "lg:ml-60"}`}>
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}