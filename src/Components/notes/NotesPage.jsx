import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, X, Trash2, Pin, PinOff, Search, Palette } from "lucide-react";
import { useNotesStore } from "../../stores/useNotesStore";
import { getTodayISO, formatTimeAgo } from "../../lib/dateUtils";

const NOTE_COLORS = [
  { id: "", label: "Default", bg: "" },
  { id: "blue", label: "Blue", color: "bg-blue-500/10 border-blue-500/20" },
  { id: "green", label: "Green", color: "bg-green-500/10 border-green-500/20" },
  { id: "red", label: "Red", color: "bg-red-500/10 border-red-500/20" },
  { id: "purple", label: "Purple", color: "bg-purple-500/10 border-purple-500/20" },
  { id: "yellow", label: "Yellow", color: "bg-yellow-500/10 border-yellow-500/20" },
];

export default function NotesPage() {
  const notes = useNotesStore((s) => s.notes);
  const addNote = useNotesStore((s) => s.addNote);
  const removeNote = useNotesStore((s) => s.removeNote);
  const togglePin = useNotesStore((s) => s.togglePin);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [newText, setNewText] = useState("");
  const [search, setSearch] = useState("");
  const [filterColor, setFilterColor] = useState("all");

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || b.id || 0) - (a.updatedAt || a.id || 0);
    });
    return sorted.filter((n) => {
      if (filterColor !== "all" && n.color !== filterColor) return false;
      if (search && !(n.text || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [notes, search, filterColor]);

  const handleCreate = async () => {
    const text = editorOpen ? editingNote?.text || newText : newText;
    if (!text.trim()) return;
    if (editingNote) {
      await updateNote(editingNote.id, { text: text.trim(), title: text.trim().split("\n")[0] });
    } else {
      await addNote(text.trim(), getTodayISO());
    }
    setNewText("");
    setEditingNote(null);
    setEditorOpen(false);
  };

  const handleOpenEditor = (note) => {
    setEditingNote(note);
    setNewText(note?.text || "");
    setEditorOpen(true);
  };

  const handleAddColor = async (note, colorId) => {
    await updateNote(note.id, { color: colorId });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl lg:text-3xl font-medium tracking-tight flex items-center gap-3">
            <FileText size={28} className="text-primary" />
            Notes
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-sm mt-1">
            {notes.length} notes · pin important ones
          </motion.p>
        </div>

        <button
          onClick={() => handleOpenEditor(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Note
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 rounded-lg bg-accent border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-48"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterColor("all")}
            className={`w-6 h-6 rounded-full border transition-all ${filterColor === "all" ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
            title="All colors"
          />
          {NOTE_COLORS.filter((c) => c.id).map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterColor(c.id)}
              className={`w-6 h-6 rounded-full border transition-all ${c.color} ${filterColor === c.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 text-muted-foreground">
          <FileText size={48} className="opacity-20" />
          <p className="text-sm mt-3">{search || filterColor !== "all" ? "No notes match your filters" : "No notes yet"}</p>
          <p className="text-xs">{search ? "" : "Capture your thoughts, ideas, and reminders"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNotes.map((note) => {
            const lines = (note.text || "").split("\n").filter((l) => l.trim());
            const colorMeta = NOTE_COLORS.find((c) => c.id === note.color);
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group p-4 rounded-xl border transition-all hover:shadow-lg ${colorMeta?.color || "bg-accent border-border"} cursor-pointer relative`}
                onClick={() => handleOpenEditor(note)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground">
                    {note.dateISO ? new Date(note.dateISO + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : formatTimeAgo(note.id)}
                  </span>
                  <div className="flex items-center gap-1">
                    {note.pinned && <Pin size={12} className="text-primary" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                      title={note.pinned ? "Unpin" : "Pin"}
                    >
                      {note.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNote(note.id); }}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h3 className="font-medium text-sm mb-1 line-clamp-1">{lines[0] || "Untitled"}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{lines.slice(1).join("\n") || ""}</p>

                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-all">
                  <Palette size={10} className="text-muted-foreground" />
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={(e) => { e.stopPropagation(); handleAddColor(note, c.id); }}
                      className={`w-3.5 h-3.5 rounded-full border border-border ${c.color} ${note.color === c.id ? "ring-2 ring-primary/40" : ""}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => { setEditorOpen(false); setEditingNote(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card rounded-2xl p-6 border border-border shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{editingNote ? "Edit Note" : "New Note"}</h3>
                <button onClick={() => { setEditorOpen(false); setEditingNote(null); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <textarea
                autoFocus
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && handleCreate()}
                placeholder="Write your note here... (first line becomes the title)"
                className="w-full h-64 px-4 py-3 rounded-xl bg-accent text-foreground outline-none placeholder-muted-foreground border border-border focus:border-primary transition-all resize-none text-sm"
              />

              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-muted-foreground">
                  Ctrl + Enter to save
                </p>
                <button
                  onClick={handleCreate}
                  disabled={!newText.trim()}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {editingNote ? "Save Changes" : "Save Note"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}