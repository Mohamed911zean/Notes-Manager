# Tracify Feature Implementation Plan

## Features: 2 (Pomodoro Deep Work Mode), 3 (Recurring Tasks), 4 (Smarter Analytics), 6 (Calendar Improvements)

## Architecture Overview

All data is stored in Zustand + Firebase (Firestore). No new dependencies needed — `date-fns`, `recharts`, `@dnd-kit/*`, and `framer-motion` are all already installed.

---

## Feature 2 — Pomodoro Deep Work Mode

**Goal:** Link tasks to Pomodoro sessions, show what you're working on, track time per task, browser notifications.

### Changes:

#### [MODIFY] `stores/TimeManagerStore.jsx`
- Add `activeTaskId: null` — the task linked to the current session
- Add `pomodoroLog: []` — completed pomodoro entries: `{ taskId, taskTitle, duration, completedAt, date }`
- Add `setActiveTask(taskId)` action
- Modify `addTimer()` to accept `taskId` + `taskTitle` in timer object
- Modify timer complete flow: auto-log completed session to `pomodoroLog` with task reference

#### [MODIFY] `stores/useTasksStore.jsx`
- Add `trackedMinutes: 0` field to task shape
- Add `addPomodoroTime(taskId, minutes)` action — increments task's `trackedMinutes`

#### [MODIFY] `Components/TimeManager.jsx`
- Add a **Task Picker** section: dropdown/list of today's tasks to link to session
- Show selected task name inside the active timer display (below countdown)
- On timer complete: call `addPomodoroTime(taskId, minutes)` to log time to task
- Show **browser notification** when timer ends (via `Notification API`)
- Show tracked time per task in the stats area ("You spent 50m on 'Study Chapter 3'")

#### [NEW] `Components/tasks/TaskPomodoroBar.jsx`
- Small inline badge on `SortableTaskCard` showing `⏱ {trackedMinutes}m` if > 0
- "Focus on this" button → navigates to `/pomodoro` with that task pre-selected (via URL param or store)

---

## Feature 3 — Recurring Tasks & Smart Due Dates

**Goal:** Tasks that repeat daily/weekly/monthly. Snooze/defer. Better date UX.

### Changes:

#### [MODIFY] `stores/useTasksStore.jsx`
- Add to task shape:
  - `recurrence: null | { type: 'daily'|'weekly'|'monthly', endDate?: string }`
  - `snoozedUntil: null | string (ISO date)`
  - `originalDate: null | string` (for recurring originals)
- Add `snoozeTask(id, days)` action — sets `snoozedUntil` to today+N days
- Add `generateRecurringInstances()` utility — called on mount, generates task copies for the next 30 days based on recurrence rules (stored as virtual tasks or actual tasks with `isRecurringInstance: true` flag)
- Add `deferTask(id, dateISO)` action — changes `dateISO` without removing recurrence

#### [MODIFY] `Components/tasks/TaskBoard.jsx`
- Add **Recurrence picker** to New Task modal: None / Daily / Weekly / Monthly
- Add **Snooze** button (moon icon) in `SortableTaskCard` — shows "+1d / +3d / Pick date"
- Add **Defer** quick action in task card
- Show recurring badge 🔁 on recurring tasks
- Add "Snoozed" filter tab — shows tasks where `snoozedUntil > today`
- Overdue tasks: show red date badge, special "Overdue" column or visual indicator

#### [MODIFY] `lib/dateUtils.js`
- Add `getNextRecurrenceDate(dateISO, recurrenceType)` helper
- Add `parseNaturalDate(text)` — parses "next Monday", "in 3 days" → ISO date (lightweight, no external lib)

---

## Feature 4 — Smarter Analytics Dashboard

**Goal:** Productivity Score, contribution heatmap, best hours chart, time-per-task breakdown.

### Changes:

#### [MODIFY] `stores/AnaliticsStore.jsx`
- Add `getProductivityScore(tasks, sessions)` — computed metric 0–100 based on: completion rate (40%), focus time (30%), streak (20%), consistency (10%)
- Add `getBestHours(sessions)` — groups sessions by hour-of-day → returns hour distribution
- Add `getTaskTimeBreakdown(tasks)` — aggregates `trackedMinutes` by category
- Add `getHeatmapData(days=90)` — returns array of `{ date, score }` for last 90 days

#### [MODIFY] `Components/AnalyticsManager.jsx`
- **Productivity Score card** — large circular gauge/score (0-100) with color coding (red < 40, yellow 40-70, green > 70), explanation of how it's calculated
- **Activity Heatmap** — GitHub-style contribution grid showing daily task completions for last 90 days (built with divs, no extra lib needed)
- **Best Productivity Hours** — horizontal bar chart (recharts BarChart, rotated) showing which hours you complete most tasks/sessions
- **Time per Task Category** — pie chart using `trackedMinutes` from tasks (requires Feature 2 data, shows empty state gracefully if no data yet)
- **Weekly report card** — collapsible section: "This week: X tasks done, Yh focus time, Z% completion rate"

---

## Feature 6 — Calendar Improvements

**Goal:** Tasks with due dates appear on calendar, time blocking UI, recurring plan display, drag-to-reschedule.

### Changes:

#### [MODIFY] `stores/CalenderStore.jsx`
- Fix `getPlansByDate()` to also return **recurring plan instances** for that date (plans where `recurrence` is set, computed on-the-fly from `recurrence` field)
- Add `movePlan(id, newDateISO)` action — changes plan's `dateISO` (for drag-and-drop reschedule)

#### [MODIFY] `Components/calendar/MonthView.jsx`
- Show **tasks with due dates** (from `useTasksStore`) alongside plans as small chips on each day cell
- Color-code: plans in primary accent, tasks in muted/secondary color
- Day cells with many items: "show +N more" overflow
- Highlight today strongly

#### [MODIFY] `Components/calendar/WeekView.jsx`
- Add **time-blocking lane** — 24h timeline column per day
- Plans with `time` field shown as positioned blocks on the timeline
- Tasks shown as all-day items at the top
- Drag-to-reschedule: drag a plan block to a new day (using `@dnd-kit/core` already installed)
- "Dead time" visualization — grey blocks for hours with no events

#### [MODIFY] `Components/calendar/DayDetailPanel.jsx`
- Show both **plans** AND **tasks due today** in the panel
- Add quick "Start Pomodoro on this task" button
- Show recurring plans with 🔁 indicator

#### [MODIFY] `Components/calendar/PlanForm.jsx`
- Recurrence UI already exists (select dropdown) — improve with visual preview: "Next occurrence: Tuesday Sep 9"
- Add time block preview: show the event as a visual block while typing time

---

## Implementation Order

1. **Feature 3** — Store changes to tasks (recurrence, snooze) + UI in TaskBoard  ← no deps
2. **Feature 2** — Pomodoro task linking + timer tracking (depends on task shape from #3)
3. **Feature 6** — Calendar shows tasks + time blocking (depends on task/plan data from #3)
4. **Feature 4** — Analytics heatmap + productivity score (uses data from #2 + #3)

---

## Verification Plan

- Dev server already running at http://localhost:5174/
- After each feature: visually verify in browser
- Test recurring tasks: add daily task, advance date mentally via devtools
- Test Pomodoro linking: select task → start 1min timer → verify task gets `trackedMinutes` updated
- Test analytics: check heatmap renders for last 90 days, score changes as tasks are completed
