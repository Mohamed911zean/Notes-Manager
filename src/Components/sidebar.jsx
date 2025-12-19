import { Home, Calendar, Timer, TrendingUp, Menu, X, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/AuthStore";

export default function SideBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, logout, loading } = useAuthStore();

  const items = [
    { text: "Home", icon: <Home size={20} />, path: "/home" },
    { text: "Calendar", icon: <Calendar size={20} />, path: "/calendar" },
    { text: "Pomodoro", icon: <Timer size={20} />, path: "/pomodoro" },
    { text: "Analytics", icon: <TrendingUp size={20} />, path: "/analytics" },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed top-4 left-6 z-50 p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all backdrop-blur-sm"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 z-40 w-72 flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="flex items-center h-20 px-6 pl-20 border-b border-zinc-800/50">
          <h1 className="font-semibold text-zinc-100 text-xl tracking-tight">
            Tracify
          </h1>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1 flex-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all
                  ${
                    isActive
                      ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  {item.icon}
                  {item.text}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          {!loading && user && (
            <div className="flex items-center justify-between gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
              <div className="overflow-hidden">
                <p className="text-xs text-zinc-500">Account</p>
                <p className="text-sm font-medium text-white truncate w-40">
                  {user.email}
                </p>
              </div>

              <button
                onClick={logout}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
