import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Plus, X, Trash2, Clock, Flag, Calendar, Circle, CheckCircle2, Repeat, Moon, AlertTriangle } from "lucide-react";
import { useTasksStore } from "../../stores/useTasksStore";
import { getTodayISO, isToday } from "../../lib/dateUtils";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { useTimeManagerStore } from "../../stores/TimeManagerStore";

const PRIORITY_META = {
  low: { label: "Low", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", dot: "bg-blue-500" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", dot: "bg-yellow-500" },
  high: { label: "High", color: "bg-red-500/10 text-red-500 border-red-500/20", dot: "bg-red-500" },
  urgent: { label: "Urgent", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", dot: "bg-purple-500" },
};

const CATEGORIES = ["work", "personal", "health", "study", "social"];
const RECURRENCE_OPTIONS = [
  { value: null, label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const COLUMNS = [
  { id: "todo", title: "To Do", accent: "bg-zinc-400" },
  { id: "doing", title: "In Progress", accent: "bg-blue-500" },
  { id: "done", title: "Done", accent: "bg-green-500" },
];

export default function TaskBoard() {
  const tasks = useTasksStore((s) => s.tasks);
  const addTask = useTasksStore((s) => s.addTask);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const removeTask = useTasksStore((s) => s.removeTask);
  const snoozeTask = useTasksStore((s) => s.snoozeTask);
  const today = getTodayISO();
  const navigate = useNavigate();

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("work");
  const [newDueDate, setNewDueDate] = useState(today);
  const [newRecurrence, setNewRecurrence] = useState(null);
  const [status, setStatus] = useState("todo");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTab, setFilterTab] = useState("all");
  const [search, setSearch] = useState("");
  const [snoozeMenu, setSnoozeMenu] = useState(null);

  useEffect(() => {
    useTasksStore.getState().generateRecurringInstances();
  }, []);

  const statusOf = (t) => {
    if (t.status) return t.status;
    if (t.done) return "done";
    if (t.inProgress) return "doing";
    return "todo";
  };

  const isSnoozed = (t) => t.snoozedUntil && t.snoozedUntil > today;
  const isOverdue = (t) => !t.done && t.dateISO < today && !isSnoozed(t);

  const filteredTasks = tasks.filter((t) => {
    if (isSnoozed(t) && filterTab !== "snoozed") return false;
    if (filterTab === "snoozed" && !isSnoozed(t)) return false;
    if (filterTab === "overdue" && !isOverdue(t)) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find((t) => String(t.id) === String(active.id));
    if (!activeTask) return;
    const overColumnId = over.id;
    if (COLUMNS.some((c) => c.id === overColumnId)) {
      updateStatus(activeTask, overColumnId);
      return;
    }
    const overTask = tasks.find((t) => String(t.id) === String(over.id));
    if (overTask) updateStatus(activeTask, statusOf(overTask));
  };

  const updateStatus = async (task, newStatus) => {
    if (newStatus === "done") { const t = tasks.find((x) => x.id === task.id); if (t && !t.done) await toggleTask(task.id); }
    else if (newStatus === "doing") { await useTasksStore.getState().updateTaskStatus(task.id, true); }
    else if (newStatus === "todo") { await useTasksStore.getState().updateTaskStatus(task.id, false); }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await addTask({
      title: newTitle.trim(),
      dateISO: newDueDate,
      priority: newPriority,
      category: newCategory,
      status,
      recurrence: newRecurrence ? { type: newRecurrence } : null,
    });
    setNewTitle("");
    setNewRecurrence(null);
    setNewTaskOpen(false);
  };

  const handleSnooze = async (id, days) => {
    await snoozeTask(id, days);
    setSnoozeMenu(null);
  };

  const handleFocusOnTask = (task) => {
    useTimeManagerStore.getState().setActiveTask(task.id, task.title);
    navigate("/pomodoro");
  };

  const columnTasks = (colId) => filteredTasks.filter((t) => statusOf(t) === colId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl lg:text-3xl font-medium tracking-tight flex items-center gap-3">
            <CheckSquare size={28} className="text-primary" />
            Tasks Board
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-sm mt-1">
            {tasks.length} total tasks · {tasks.filter((t) => t.done).length} completed
          </motion.p>
        </div>
        <button
          onClick={() => setNewTaskOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Task
        </button>
      </header>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "overdue", "snoozed"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filterTab === tab ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="h-4 w-px bg-border mx-1" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-accent border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary w-40"
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-2 py-1.5 rounded-lg bg-accent border border-border text-xs text-foreground focus:outline-none focus:border-primary">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (<option key={c} value={c} className="capitalize">{c}</option>))}
        </select>
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTasks = columnTasks(col.id);
            return (
              <div key={col.id} className="rounded-2xl border border-border bg-card p-3 min-h-[300px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                  <h3 className="text-sm font-medium">{col.title}</h3>
                  <span className="text-xs text-muted-foreground ml-auto bg-accent px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <SortableContext items={colTasks.map((t) => String(t.id))} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {colTasks.length === 0 && (
                      <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-border text-xs text-muted-foreground">Drop tasks here</div>
                    )}
                    {colTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTask(task.id)}
                        onRemove={() => removeTask(task.id)}
                        onSnooze={() => setSnoozeMenu(snoozeMenu === task.id ? null : task.id)}
                        onFocus={() => handleFocusOnTask(task)}
                        snoozeOpen={snoozeMenu === task.id}
                        onSnoozeSelect={(days) => handleSnooze(task.id, days)}
                        isOverdue={isOverdue(task)}
                        isSnoozed={isSnoozed(task)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <button
                  onClick={() => { setNewTaskOpen(true); setStatus(col.id); }}
                  className="mt-2 w-full py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={12} /> Add task
                </button>
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* New task modal */}
      <AnimatePresence>
        {newTaskOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setNewTaskOpen(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-2xl p-6 border border-border shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">New Task</h3>
                <button onClick={() => setNewTaskOpen(false)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><X size={18} /></button>
              </div>
              <input type="text" placeholder="What needs to be done?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus className="w-full bg-accent border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Flag size={10} /> Priority</label>
                  <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="w-full bg-accent border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                    {Object.entries(PRIORITY_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CheckSquare size={10} /> Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-accent border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary capitalize">
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar size={10} /> Date</label>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full bg-accent border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Repeat size={10} /> Repeat</label>
                  <select value={newRecurrence || ""} onChange={(e) => setNewRecurrence(e.target.value || null)} className="w-full bg-accent border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                    {RECURRENCE_OPTIONS.map((r) => (<option key={r.value || "none"} value={r.value || ""}>{r.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock size={10} /> Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-accent border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary">
                    {COLUMNS.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
                  </select>
                </div>
              </div>
              <button onClick={handleAdd} disabled={!newTitle.trim()} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50">Add Task</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableTaskCard({ task, onToggle, onRemove, onSnooze, onFocus, snoozeOpen, onSnoozeSelect, isOverdue, isSnoozed }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(task.id) });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 10 : undefined };
  const meta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

  return (
    <motion.div ref={setNodeRef} style={style} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`group p-3 rounded-xl border bg-card transition-all cursor-grab active:cursor-grabbing ${
        isOverdue ? "border-red-500/50 bg-red-500/5" : isSnoozed ? "border-yellow-500/30 bg-yellow-500/5" : "border-border hover:border-primary/30"
      }`}
      {...attributes} {...listeners}
    >
      <div className="flex items-start gap-2.5">
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`mt-0.5 flex-shrink-0 ${task.done ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}>
          {task.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${meta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />{meta.label}
            </span>
            {task.category && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 capitalize">{task.category}</span>}
            {task.recurrence && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-0.5"><Repeat size={8} />{task.recurrence.type}</span>}
            {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 flex items-center gap-0.5"><AlertTriangle size={8} />Overdue</span>}
            {isSnoozed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center gap-0.5"><Moon size={8} />Snoozed</span>}
            {task.trackedMinutes > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">⏱ {task.trackedMinutes}m</span>}
            {task.dateISO && (
              <span className={`text-[10px] flex items-center gap-0.5 ${isToday(task.dateISO) ? "text-primary" : "text-muted-foreground"}`}>
                <Calendar size={9} />
                {new Date(task.dateISO + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!task.done && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onFocus(); }} className="p-1 text-muted-foreground hover:text-primary rounded-md" title="Focus on this">
                <Clock size={13} />
              </button>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); onSnooze(); }} className="p-1 text-muted-foreground hover:text-yellow-500 rounded-md" title="Snooze">
                  <Moon size={13} />
                </button>
                {snoozeOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 py-1 min-w-[100px]">
                    {[1, 3, 7].map((d) => (
                      <button key={d} onClick={(e) => { e.stopPropagation(); onSnoozeSelect(d); }} className="w-full px-3 py-1.5 text-xs text-left hover:bg-accent text-foreground">
                        +{d} day{d > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-muted-foreground hover:text-destructive rounded-md">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}