import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  Moon,
  Sun,
  Sparkles,
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
      <span className="text-xl">{type === "success" ? "Check" : "Cross"}</span>
      <span>{message}</span>
    </div>
  );
};

// Format Date Function
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  const month = months[date.getMonth()];
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}, ${hours}:${minutes}`;
};

export default function NoteApp() {
  const { notes, addNote, removeNote, updateNote } = useTodoStore();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [toast, setToast] = useState(null);

  // Load dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) setDarkMode(saved === "true");
  }, []);

  // Save dark mode & apply to HTML
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateNote(editingId, editText.trim());
    setEditingId(null);
    showToast("Note updated successfully", "success");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
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
      <div
        className={`min-h-screen transition-colors duration-500 ${
          darkMode ? "bg-slate-950" : "bg-gray-50"
        }`}
      >
        {/* Animated Background Blobs (Only Once!) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-0 -left-4 w-96 h-96 rounded-full blur-3xl opacity-20 ${
              darkMode ? "bg-blue-500" : "bg-blue-300"
            } animate-pulse`}
          ></div>

          <div
            className={`absolute top-1/3 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 ${
              darkMode ? "bg-purple-500" : "bg-purple-300"
            } animate-pulse delay-1000`}
          ></div>

          <div
            className={`absolute bottom-0 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-20 ${
              darkMode ? "bg-pink-500" : "bg-pink-300"
            } animate-pulse delay-2000`}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">

          {/* Premium Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl shadow-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-blue-500 to-purple-600"
                    : "bg-gradient-to-br from-blue-400 to-purple-500"
                }`}
              >
                <Sparkles className="text-white" size={28} />
              </div>
              <div>
                <h1
                  className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  NoteFlow
                </h1>
                <p
                  className={`text-sm md:text-base mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Professional note-taking reimagined
                </p>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-xl shadow-lg bg-white/10 backdrop-blur-xl border border-white/20 hover:scale-110 duration-300"
            >
              {darkMode ? (
                <Sun className="text-yellow-300" size={26} />
              ) : (
                <Moon className="text-indigo-600" size={26} />
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-xl ${
                darkMode
                  ? "bg-white/5 border-white/10 text-gray-200"
                  : "bg-white border-gray-200 text-gray-700"
              }`}
            >
              <Search className="opacity-60" />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-lg"
              />
            </div>
          </div>

          {/* Add Note Input */}
          <div className="flex gap-3 mb-10">
            <input
              type="text"
              placeholder="Write a note..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className={`flex-1 px-5 py-3 rounded-2xl shadow-xl border text-lg backdrop-blur-xl ${
                darkMode
                  ? "bg-white/5 border-white/10 text-gray-200 placeholder-gray-500"
                  : "bg-white border-gray-300 text-gray-700 placeholder-gray-400"
              }`}
            />

            <button
              onClick={handleAdd}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 hover:scale-105 duration-300 flex items-center gap-2"
            >
              <Plus size={20} /> Add
            </button>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filteredNotes.length === 0 ? (
              <div
                className={`col-span-full text-center py-16 text-lg ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {search ? "No notes found." : "Start by adding your first note!"}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 sm:p-5 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] ${
                    darkMode
                      ? "bg-white/5 border-white/10 text-gray-200"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
                >
                  {editingId === note.id ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`w-full h-28 sm:h-32 bg-transparent border rounded-xl p-3 outline-none resize-none text-sm sm:text-base ${
                          darkMode
                            ? "border-white/20 text-gray-200"
                            : "border-gray-300 text-gray-800"
                        }`}
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700 text-xs sm:text-sm transition"
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 bg-gray-500 text-white rounded-xl flex items-center gap-2 hover:bg-gray-600 text-xs sm:text-sm transition"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="leading-relaxed text-sm sm:text-base break-words">
                        {note.text}
                      </p>

                      <p className="mt-2 text-xs opacity-60">
                        {formatDate(note.id)}
                      </p>

                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => startEdit(note)}
                          className="p-2 rounded-xl bg-yellow-500/80 text-white hover:bg-yellow-600 transition text-xs sm:text-sm"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            removeNote(note.id);
                            showToast("Note deleted", "error");
                          }}
                          className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-xs sm:text-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className={`text-center mt-16 pb-8 ${
              darkMode ? "text-gray-600" : "text-gray-400"
            }`}
          >
            <p className="text-sm font-medium">Powered by NoteFlow Enterprise</p>
          </div>
        </div>
      </div>
    </>
  );
}