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
import { useTodoStore } from "../stores/NotestMangerStore";
import ClockView from "./TimeManager"
import AnalyticsManager from "./AnailticsManager"
import { auth } from "../lib/firebase.ts";
import { signOut } from "firebase/auth";
import Cookies from "js-cookie";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Simplified Toast Component - No shadow/blur
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl z-50 flex items-center gap-3 border ${
        type === "success"
          ? "bg-emerald-500 border-emerald-400"
          : "bg-rose-500 border-rose-400"
      } text-white font-medium`}
    >
      <span className="text-xl">{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </motion.div>
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

export default function NotesManger() {
  const { notes, addNote, removeNote, updateNote, tasks, addTask, removeTask, toggleTask } = useTodoStore();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [activeTab, setActiveTab] = useState("notes");
  const [showInputModal, setShowInputModal] = useState(false);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Cookies.remove("auth");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const filteredNotes = notes
    .filter((note) => note.text.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const filteredTasks = tasks
    .filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.id - a.id);

  const handleAdd = () => {
    if (!input.trim()) return;
    if (activeTab === "notes") {
      addNote(input.trim());
      showToast("Note created successfully", "success");
    } else if (activeTab === "tasks") {
      addTask({ title: input.trim() });
      showToast("Task created successfully", "success");
    }
    setInput("");
    setShowInputModal(false);
  };

  const handleOpenInputModal = () => {
    setShowInputModal(true);
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

  const handleToggle = (id) => {
    toggleTask(id);
    showToast("Task Completed", "success");
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Input Modal - No shadow/blur */}
      <AnimatePresence>
        {showInputModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowInputModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg glass rounded-3xl p-6 border border-zinc-800/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold gradient-text">
                  {activeTab === "notes" ? "New Note" : "New Task"}
                </h2>
                <button
                  onClick={() => setShowInputModal(false)}
                  className="p-2 hover:bg-zinc-800/70 rounded-lg text-zinc-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <textarea
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleAdd();
                  }
                }}
                placeholder={
                  activeTab === "notes"
                    ? "Write your note here..."
                    : "What do you need to do?"
                }
                className="w-full h-48 px-4 py-3 rounded-xl glass text-white outline-none placeholder-zinc-500 border border-zinc-800/50 focus:border-yellow-500/50 transition-all duration-300 resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-xl text-black font-semibold hover:brightness-110 transition-all duration-300"
                >
                  {activeTab === "notes" ? "Create Note" : "Add Task"}
                </button>
                <button
                  onClick={() => setShowInputModal(false)}
                  className="px-6 py-3 glass rounded-xl text-white border border-zinc-800/50"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-zinc-500 mt-3 text-center">
                Press <kbd className="px-2 py-1 bg-zinc-800 rounded">Ctrl</kbd> +{" "}
                <kbd className="px-2 py-1 bg-zinc-800 rounded">Enter</kbd> to save
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* List View */}
          <div
            className={`${
              selectedNote || editingId ? "hidden md:flex" : "flex"
            } flex-col w-full`}
          >
            {/* Clock View */}
           {activeTab === "clock" ? (
  <>
    <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-black sticky top-0 z-10">
      <h1 className="text-3xl font-bold gradient-text">Clock</h1>
      <div className="flex gap-3">
        <button
          onClick={handleLogout}
          className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:brightness-110 transition-all duration-300"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
    <div className="flex-1 flex flex-col overflow-hidden">
      <ClockView />
    </div>
  </>
) : activeTab === "analytics" ? (
  <>
    <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-black sticky top-0 z-10">
      <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
      <div className="flex gap-3">
        <button
          onClick={handleLogout}
          className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl  "
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
    <div className="flex-1 flex flex-col overflow-hidden">
      <AnalyticsManager />
    </div>
  </>
) : (
  <>
    {/* Header */}
    <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-black sticky top-0 z-10">
      {activeTab === "notes" ? (
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          Notes
        </h1>
      ) : (
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
          Tasks
        </h1>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleLogout}
          className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:brightness-110 transition-all duration-300"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>

                {/* Search */}
                <div className="px-6 pb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder={
                        activeTab === "notes" ? "Search notes" : "Search tasks"
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full glass rounded-xl pl-11 pr-4 py-3 text-sm outline-none text-white placeholder-zinc-500 border border-zinc-800/50 focus:border-yellow-500/50 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Add Note/Task Input - Desktop Only */}
                <div className="px-6 pb-4 hidden md:block">
                  <input
                    type="text"
                    placeholder={
                      activeTab === "notes" ? "Write a note..." : "Write a task..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="w-full px-4 py-3.5 rounded-xl glass text-white outline-none placeholder-zinc-500 border border-zinc-800/50 focus:border-yellow-500/50 transition-all duration-300"
                  />
                </div>

                {/* Notes/Tasks Grid - No shadows */}
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  {activeTab === "notes" ? (
                    // Notes View
                    filteredNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <FolderOpen
                          size={64}
                          className="mb-4 opacity-20"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm">
                          {search
                            ? "No notes found"
                            : "Start by adding your first note!"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {filteredNotes.map((note) => {
                          const lines = note.text
                            .split("\n")
                            .filter((line) => line.trim());
                          const title = lines[0] || "No title";
                          const subject = lines.slice(1).join("\n") || "No text";

                          return (
                            <button
                              key={note.id}
                              onClick={() => handleSelectNote(note)}
                              className="premium-card p-5 text-left h-44 flex flex-col group hover:scale-[1.02] transition-transform duration-200"
                            >
                              <h3 className="font-semibold text-base mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">
                                {title}
                              </h3>
                              <p className="text-sm text-zinc-400 flex-1 line-clamp-3 mb-2">
                                {subject}
                              </p>
                              <p className="text-xs text-zinc-600">
                                {formatDate(note.id)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    // Tasks View
                    filteredTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                        <FolderOpen
                          size={64}
                          className="mb-4 opacity-20"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm">
                          {search
                            ? "No tasks found"
                            : "Start by adding your first task!"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className="premium-card p-4 flex items-center gap-4"
                          >
                            <button
                              onClick={() => handleToggle(task.id)}
                              className="flex-shrink-0"
                            >
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                                  task.completed
                                    ? "bg-yellow-500 border-yellow-500"
                                    : "border-zinc-500 hover:border-yellow-500"
                                }`}
                              >
                                {task.completed && (
                                  <svg
                                    className="w-4 h-4 text-black"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </button>
                            <span
                              className={`flex-1 transition-all duration-300 ${
                                task.completed
                                  ? "line-through text-zinc-500"
                                  : "text-white"
                              }`}
                            >
                              {task.title}
                            </span>
                            <button
                              onClick={() => {
                                removeTask(task.id);
                                showToast("Task deleted", "error");
                              }}
                              className="p-2 hover:bg-zinc-800/70 rounded-lg text-red-500 transition-colors hover:scale-110"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* Bottom Navigation - No blur */}
            <div className="glass border-t border-zinc-800/50 px-6 py-4 flex items-center justify-around fixed bottom-0 w-full md:static">
              <button
                onClick={() => setActiveTab("notes")}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div
                    className={`w-5 h-6 border-2 rounded-sm transition-colors ${
                      activeTab === "notes" ? "border-yellow-500" : "border-zinc-500"
                    }`}
                  ></div>
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    activeTab === "notes"
                      ? "text-yellow-500"
                      : "text-zinc-500 group-hover:text-zinc-400"
                  }`}
                >
                  Notes
                </span>
              </button>

              <button
                onClick={() => setActiveTab("tasks")}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div
                    className={`w-5 h-5 border-2 rounded-sm relative transition-colors ${
                      activeTab === "tasks" ? "border-yellow-500" : "border-zinc-500"
                    }`}
                  >
                    <div
                      className={`absolute inset-1 border-t-2 transition-colors ${
                        activeTab === "tasks" ? "border-yellow-500" : "border-zinc-500"
                      }`}
                    ></div>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    activeTab === "tasks"
                      ? "text-yellow-500"
                      : "text-zinc-500 group-hover:text-zinc-400"
                  }`}
                >
                  Tasks
                </span>
              </button>

              <button
                onClick={() => setActiveTab("clock")}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div
                    className={`w-5 h-5 border-2 rounded-full relative transition-colors ${
                      activeTab === "clock" ? "border-yellow-500" : "border-zinc-500"
                    }`}
                  >
                    <div
                      className={`absolute top-1/2 left-1/2 w-0.5 h-2 -translate-x-1/2 -translate-y-full origin-bottom transition-colors ${
                        activeTab === "clock" ? "bg-yellow-500" : "bg-zinc-500"
                      }`}
                    ></div>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    activeTab === "clock"
                      ? "text-yellow-500"
                      : "text-zinc-500 group-hover:text-zinc-400"
                  }`}
                >
                  Clock
                </span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className="flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <div className="flex items-end gap-1 h-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: activeTab === "analytics" ? `${i * 6}px` : "4px",
                        backgroundColor:
                          activeTab === "analytics" ? "#fbbf24" : "#71717a",
                      }}
                      className="w-1.5 rounded-sm transition-all duration-200"
                    ></div>
                  ))}
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    activeTab === "analytics"
                      ? "text-yellow-500"
                      : "text-zinc-500 group-hover:text-zinc-400"
                  }`}
                >
                  Analytics
                </span>
              </button>
            </div>
          </div>

          {/* Detail/Edit View - No shadows */}
          <AnimatePresence>
            {(selectedNote || editingId) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1 bg-gradient-to-br from-black via-zinc-950 to-zinc-900"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 text-yellow-500 hover:text-yellow-400 transition-colors"
                  >
                    <ChevronLeft size={24} />
                    <span className="text-lg font-medium">Notes</span>
                  </button>
                  <div className="flex gap-2">
                    {editingId ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2.5 bg-green-600 text-white rounded-xl flex items-center gap-2 hover:bg-green-700 text-sm font-medium transition-all"
                        >
                          <Save size={16} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2.5 bg-zinc-700 text-white rounded-xl flex items-center gap-2 hover:bg-zinc-600 text-sm font-medium transition-all"
                        >
                          <X size={16} /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(selectedNote)}
                          className="p-2.5 hover:bg-zinc-800/70 rounded-xl text-yellow-500 transition-all"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button
                          onClick={() => {
                            removeNote(selectedNote.id);
                            showToast("Note deleted", "error");
                            handleBack();
                          }}
                          className="p-2.5 hover:bg-zinc-800/70 rounded-xl text-red-500 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto p-8">
                    {editingId ? (
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-transparent text-base leading-relaxed outline-none resize-none min-h-[500px] text-white placeholder-zinc-600"
                        autoFocus
                        placeholder="Write your note..."
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button - No shadow */}
        <AnimatePresence>
          {activeTab !== "clock" && activeTab !== "analytics" && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleOpenInputModal}
              className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center hover:brightness-110 hover:scale-110 transition-all z-50"
            >
              <Plus size={28} className="text-black" strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}