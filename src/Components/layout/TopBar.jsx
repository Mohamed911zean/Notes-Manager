import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, CalendarDays, CheckSquare, FileText } from "lucide-react";
import { useTasksStore } from "../../stores/useTasksStore";
import { useCalenderStore } from "../../stores/CalenderStore";
import { useNotesStore } from "../../stores/useNotesStore";

export default function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const tasks = useTasksStore((s) => s.tasks);
  const plans = useCalenderStore((s) => s.plans);
  const notes = useNotesStore((s) => s.notes);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const searchResults = query.length > 0 ? [
    ...tasks
      .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((t) => ({ type: "task", title: t.title, path: "/tasks", icon: CheckSquare })),
    ...plans
      .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((p) => ({ type: "plan", title: p.title, path: "/calendar", icon: CalendarDays })),
    ...notes
      .filter((n) => n.text.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((n) => ({ type: "note", title: n.text.split("\n")[0], path: "/notes", icon: FileText })),
  ] : [];

  const handleQuickAdd = async (type) => {
    if (type === "task") {
      navigate("/tasks");
    } else if (type === "plan") {
      navigate("/calendar");
    } else if (type === "note") {
      navigate("/notes");
    }
    setQuickAddOpen(false);
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3 pl-10 lg:pl-0">
          <span className="text-sm text-muted-foreground hidden md:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 text-muted-foreground text-sm hover:bg-accent transition-colors"
          >
            <Search size={14} />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-mono">Ctrl+K</kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
            </button>

            <AnimatePresence>
              {quickAddOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    {[
                      { type: "task", label: "New Task", icon: CheckSquare },
                      { type: "plan", label: "New Plan", icon: CalendarDays },
                      { type: "note", label: "New Note", icon: FileText },
                    ].map((item) => (
                      <button
                        key={item.type}
                        onClick={() => handleQuickAdd(item.type)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <item.icon size={16} className="text-muted-foreground" />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]"
            onClick={() => { setSearchOpen(false); setQuery(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={18} className="text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search tasks, plans, notes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground"
                />
                <button
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-80 overflow-y-auto p-2">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => { navigate(result.path); setSearchOpen(false); setQuery(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-left"
                    >
                      <result.icon size={16} className="text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{result.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{result.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length > 0 && searchResults.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No results found
                </div>
              )}

              {query.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-xs">
                  Start typing to search across all your data
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
