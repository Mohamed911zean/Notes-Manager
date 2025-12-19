import React, { useState } from "react";
import { Plus, Trash2, FolderOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotesStore } from "../stores/useNotesStore";

export default function DailyNotesView({ day, className = "" }) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);

  const { notes, addNote, removeNote } = useNotesStore();

  // Filter notes for the specific day
  const dayNotes = notes.filter(note => {
    if (note.dateISO) {
      return note.dateISO === day.dateISO;
    }
    const noteDate = new Date(note.id).toLocaleDateString("en-CA");
    return noteDate === day.dateISO;
  }).sort((a, b) => b.id - a.id);

  const handleAdd = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      await addNote(input.trim(), day.dateISO);
      setInput("");
      setShowInputModal(false);
    } catch (error) {
      console.error("Failed to create note", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await removeNote(id);
    } catch (error) {
      console.error("Failed to delete note", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showInputModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => !isProcessing && setShowInputModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-zinc-100">New Note</h2>
                <button
                  onClick={() => !isProcessing && setShowInputModal(false)}
                  disabled={isProcessing}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey && !isProcessing) {
                    handleAdd();
                  }
                }}
                disabled={isProcessing}
                placeholder="Write your note here..."
                className="w-full h-48 px-4 py-3 rounded-xl bg-zinc-950 text-zinc-100 outline-none placeholder-zinc-600 border border-zinc-800 focus:border-zinc-700 transition-all resize-none mb-4 disabled:opacity-50 text-sm"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={!input.trim() || isProcessing}
                  className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessing ? "Adding..." : "Add Note"}
                </button>
                <button
                  onClick={() => !isProcessing && setShowInputModal(false)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${className} bg-transparent text-zinc-100 flex flex-col`}>
        {/* Quick Add - Desktop */}
        <div className="px-6 py-4">
          <input
            type="text"
            placeholder="Write a note..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isProcessing && handleAdd()}
            disabled={isProcessing}
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/30 text-zinc-200 outline-none placeholder-zinc-600 border border-zinc-800/50 focus:border-zinc-700 transition-all disabled:opacity-50 text-sm"
          />
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          {dayNotes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-40 text-zinc-500"
            >
              <FolderOpen
                size={48}
                className="mb-3 opacity-20"
                strokeWidth={1.5}
              />
              <p className="text-sm mb-2 text-zinc-600">No notes for this day</p>
              <button
                onClick={() => setShowInputModal(true)}
                className="mt-2 px-4 py-1.5 bg-zinc-800 text-zinc-300 rounded-md hover:bg-zinc-700 transition-colors text-xs font-medium md:hidden"
              >
                Add note
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {dayNotes.map((note, index) => {
                  const lines = note.text.split("\n").filter(line => line.trim());
                  const title = lines[0] || "No title";
                  const subject = lines.slice(1).join("\n");

                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      layout
                      className="group p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all flex flex-col relative"
                    >
                      <h3 className="font-medium text-sm mb-1.5 line-clamp-1 text-zinc-200 group-hover:text-zinc-100 transition-colors">
                        {title}
                      </h3>
                      {subject && (
                        <p className="text-xs text-zinc-500 flex-1 line-clamp-3 mb-2 leading-relaxed">
                          {subject}
                        </p>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemove(note.id)}
                        disabled={isProcessing}
                        className="absolute top-3 right-3 p-1.5 hover:bg-zinc-800 rounded-md text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}