import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  ChevronLeft,
  FolderOpen,
} from "lucide-react";
import { useTodoStore } from "./NotestMangerStore";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-xl border ${
        type === "success"
          ? "bg-emerald-500/90 border-emerald-400/50"
          : "bg-rose-500/90 border-rose-400/50"
      } text-white font-medium animate-in slide-in-from-top`}
    >
      <span className="text-xl">{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </div>
  );
};

// Format Date Function
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getPreviewText = (text) => {
  return text.length > 60 ? text.substring(0, 60) + "..." : text;
};

export default function NoteApp() {
  const { notes, addNote, removeNote, updateNote } = useTodoStore();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const filteredNotes = notes
    .filter((note) =>
      note.text.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.id - a.id);

  const handleAdd = () => {
    if (!input.trim()) return;
    addNote(input.trim());
    setInput("");
    showToast("Note created successfully", "success");
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
    setSelectedNote(note);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateNote(editingId, editText.trim());
    setEditingId(null);
    setSelectedNote(null);
    showToast("Note updated successfully", "success");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setSelectedNote(null);
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditingId(null);
  };

  const handleBack = () => {
    setSelectedNote(null);
    setEditingId(null);
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Container */}
      <div className="h-screen bg-black text-white flex flex-col">
      
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List View */}
          <div
            className={`${
              selectedNote || editingId ? "hidden md:flex" : "flex"
            } flex-col w-full bg-black`}
          >
            {/* Header with icons */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h1 className="text-3xl font-bold">Notes</h1>
              <div className="flex gap-4">
                <button className="p-2">
                  <FolderOpen size={24} className="text-white" />
                </button>
                <button className="p-2">
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search notes"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Add Note Input */}
            <div className="px-4 pb-4">
              <input
                type="text"
                placeholder="Write a note..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full px-4 py-3 rounded-xl bg-zinc-800 text-white outline-none placeholder-gray-500"
              />
            </div>

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto px-4">
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                  <p className="text-sm">
                    {search ? "No notes found" : "Start by adding your first note!"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pb-4">
                  {filteredNotes.map((note) => {
                    const lines = note.text.split('\n').filter(line => line.trim());
                    const title = lines[0] || "No title";
                    const subject = lines.slice(1).join('\n') || "No text";
                    
                    return (
                      <button
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        className="bg-zinc-900 rounded-2xl p-4 text-left hover:bg-zinc-800 transition h-40 flex flex-col"
                      >
                        <h3 className="font-semibold text-base mb-2 line-clamp-1">
                          {title}
                        </h3>
                        <p className="text-sm text-gray-400 flex-1 line-clamp-3 mb-2">
                          {subject}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(note.id)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="bg-black border-t border-zinc-800 px-6 py-3 flex items-center justify-around">
              <button className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-5 h-6 border-2 border-yellow-500 rounded-sm"></div>
                </div>
                <span className="text-xs text-yellow-500">Notes</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-zinc-500">
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-zinc-500 rounded-sm relative">
                    <div className="absolute inset-1 border-t-2 border-zinc-500"></div>
                  </div>
                </div>
                <span className="text-xs">Tasks</span>
              </button>
            </div>
          </div>

          {/* Detail/Edit View */}
          <div
            className={`${
              selectedNote || editingId ? "flex" : "hidden"
            } flex-col flex-1 bg-black`}
          >
            {selectedNote || editingId ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-yellow-500 hover:text-yellow-400"
                  >
                    <ChevronLeft size={24} />
                    <span className="text-lg">Notes</span>
                  </button>
                  <div className="flex gap-2">
                    {editingId ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm"
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 hover:bg-gray-700 text-sm"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(selectedNote)}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-yellow-500"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button
                          onClick={() => {
                            removeNote(selectedNote.id);
                            showToast("Note deleted", "error");
                            handleBack();
                          }}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-red-500"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto p-6">
                    {editingId ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-transparent text-base leading-relaxed outline-none resize-none min-h-[500px]"
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="text-xs text-zinc-500 mb-6">
                          {formatDate(selectedNote.id)}
                        </p>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          {selectedNote.text}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={handleAdd}
          className="fixed bottom-24 right-6 w-14 h-14 bg-yellow-500 rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-400 transition z-50"
        >
          <Plus size={28} className="text-black" />
        </button>

        {/* Add Note Input - Fixed at top when not viewing note */}
        
        
      </div>
    </>
  );
}