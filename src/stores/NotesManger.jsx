// NoteApp.jsx
import React, { useState, useEffect } from "react";
import { useTodoStore } from "./NotestMangerStore.jsx";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import { Search, Plus, Pin, PinOff, Edit3, Save, X, Trash2, Moon, Sun, Tag } from "lucide-react";

export default function NoteApp() {
  const { notes, addNote, removeNote, updateNote } = useTodoStore();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Dark Mode من localStorage
  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // فلترة النوتات
  const filteredNotes = notes
    .filter((note) =>
      note.text.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.id - a.id); // أحدث فوق

  const handleAdd = () => {
    if (!input.trim()) return;
    addNote(input.trim());
    setInput("");
    toast.success("!Added Successfully");
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (!editText.trim()) return;
    updateNote(editingId, editText.trim());
    setEditingId(null);
    toast.success("!Updated Successfully");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: "inherit" },
          success: { icon: "✔" },
          error: { icon: "✖" },
        }}
      />

      <div
        className={`min-h-screen transition-all duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 via-purple-900 to-slate-900"
            : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
        } p-4 md:p-6`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1
              className={`text-4xl md:text-5xl font-bold tracking-tight ${
                darkMode ? "text-white" : "text-indigo-900"
              }`}
            >
              My Notes
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full shadow-lg transition-all ${
                darkMode
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-white text-indigo-600 hover:bg-gray-100"
              }`}
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>

          {/* Search + Add */}
          <div
            className={`backdrop-blur-md rounded-2xl p-5 shadow-xl mb-6 border ${
              darkMode
                ? "bg-gray-800/70 border-gray-700"
                : "bg-white/80 border-gray-200"
            }`}
          >
            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all ${
                  darkMode
                    ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-purple-500"
                    : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-indigo-500"
                } focus:outline-none focus:ring-2`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Add Input */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Add a new note..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
                className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                  darkMode
                    ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-purple-500"
                    : "bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-indigo-500"
                } focus:outline-none focus:ring-2`}
              />
              <button
                onClick={handleAdd}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Add
              </button>
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.length === 0 ? (
              <div
                className={`col-span-full text-center py-16 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p className="text-xl">
                  {search
                    ? "No search results found"
                    : notes.length === 0
                    ? "!Start by writing your first note"
                    : "There are no notes"}
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`group relative backdrop-blur-sm rounded-2xl p-5 shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 border ${
                    darkMode
                      ? "bg-gray-800/80 border-gray-700"
                      : "bg-white/90 border-gray-200"
                  }`}
                >
                  {editingId === note.id ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`w-full p-3 rounded-lg resize-none transition-all ${
                          darkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-50 text-gray-900"
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        rows="3"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={saveEdit}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p
                        className={`font-medium text-lg leading-relaxed ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {note.text}
                      </p>

                      <small
                        className={`block mt-4 ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {format(new Date(note.id), "dd MMM, HH:mm")}
                      </small>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => startEdit(note)}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 text-sm"
                        >
                          <Edit3 size={14} />
                          Modify
                        </button>
                        <button
                          onClick={() => {
                            removeNote(note.id);
                            toast.error("!Deleted Successfully");
                          }}
                          className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-1 text-sm"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}