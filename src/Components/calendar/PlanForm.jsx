import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, CheckCircle2, Trash2, Clock, Tag } from "lucide-react";
import { useCalenderStore } from "../../stores/CalenderStore";
import toast from "react-hot-toast";

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-blue-500 bg-blue-500/10" },
  { value: "medium", label: "Medium", color: "text-yellow-500 bg-yellow-500/10" },
  { value: "high", label: "High", color: "text-red-500 bg-red-500/10" },
  { value: "urgent", label: "Urgent", color: "text-purple-500 bg-purple-500/10" },
];

const CATEGORIES = [
  { value: "work", label: "Work", color: "text-blue-500" },
  { value: "personal", label: "Personal", color: "text-green-500" },
  { value: "health", label: "Health", color: "text-red-500" },
  { value: "study", label: "Study", color: "text-purple-500" },
  { value: "social", label: "Social", color: "text-orange-500" },
];

export default function PlanForm({ dateISO, onClose }) {
  const addPlan = useCalenderStore((s) => s.addPlan);
  const syncToFirestore = useCalenderStore((s) => s.syncToFirestore);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [recurrence, setRecurrence] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      await addPlan({
        title: title.trim(),
        description: description.trim(),
        time,
        endTime,
        priority,
        category,
        recurrence: recurrence || null,
        dateISO,
      });
      await syncToFirestore();
      toast.success("Plan added!");
      onClose();
    } catch (error) {
      toast.error("Failed to add plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onSubmit={handleSubmit}
      className="space-y-3 p-4 rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">New Plan</h4>
        <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground">
          <X size={14} />
        </button>
      </div>

      <input
        type="text"
        placeholder="What's the plan?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors placeholder-muted-foreground"
        autoFocus
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none placeholder-muted-foreground"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Clock size={10} /> Start
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-accent border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary text-muted-muted"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Clock size={10} /> End
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-accent border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary text-muted-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Flag size={10} /> Priority
          </label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  priority === p.value ? p.color : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Tag size={10} /> Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-accent border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <select
        value={recurrence}
        onChange={(e) => setRecurrence(e.target.value)}
        className="w-full bg-accent border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
      >
        <option value="">No repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>

      <button
        type="submit"
        disabled={!title.trim() || saving}
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Adding..." : "Add Plan"}
      </button>
    </motion.form>
  );
}
