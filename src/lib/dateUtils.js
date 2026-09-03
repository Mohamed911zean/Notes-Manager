const EGYPT_TZ = "Africa/Cairo";

export function getEgyptDate() {
  const now = new Date();
  const egyptStr = now.toLocaleString("en-US", { timeZone: EGYPT_TZ });
  return new Date(egyptStr);
}

export function getTodayISO() {
  return getEgyptDate().toLocaleDateString("en-CA");
}

export function formatDateISO(date) {
  return date.toLocaleDateString("en-CA");
}

export function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatDisplayDate(dateISO) {
  const date = new Date(dateISO + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(dateISO) {
  const date = new Date(dateISO + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getWeekDates(refDate = new Date()) {
  const egypt = getEgyptDate();
  const day = egypt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(egypt);
  monday.setDate(egypt.getDate() + diff);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDateISO(d));
  }
  return dates;
}

export function getMonthDates(year, month) {
  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(formatDateISO(new Date(year, month, i)));
  }
  return dates;
}

export function isToday(dateISO) {
  return dateISO === getTodayISO();
}

export function isPastDate(dateISO) {
  return dateISO < getTodayISO();
}

export function isSameWeek(date1ISO, date2ISO) {
  const d1 = new Date(date1ISO + "T00:00:00");
  const d2 = new Date(date2ISO + "T00:00:00");
  const getWeekStart = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return formatDateISO(date);
  };
  return getWeekStart(d1) === getWeekStart(d2);
}

export function addDays(dateISO, days) {
  const d = new Date(dateISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export function getDayName(dateISO) {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function getShortDayName(dateISO) {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function getMonthName(monthIndex) {
  return new Date(2024, monthIndex, 1).toLocaleDateString("en-US", { month: "long" });
}

export function getShortMonthName(monthIndex) {
  return new Date(2024, monthIndex, 1).toLocaleDateString("en-US", { month: "short" });
}

export function getNextRecurrenceDate(dateISO, recurrenceType) {
  const d = new Date(dateISO + "T00:00:00");
  if (recurrenceType === "daily") d.setDate(d.getDate() + 1);
  else if (recurrenceType === "weekly") d.setDate(d.getDate() + 7);
  else if (recurrenceType === "monthly") d.setMonth(d.getMonth() + 1);
  return formatDateISO(d);
}

export function parseNaturalDate(text) {
  const lower = text.toLowerCase().trim();
  const today = new Date(getTodayISO() + "T00:00:00");
  let d = null;

  if (lower === "today") d = today;
  else if (lower === "tomorrow") { d = new Date(today); d.setDate(d.getDate() + 1); }
  else if (lower === "next week") { d = new Date(today); d.setDate(d.getDate() + 7); }
  else if (lower === "next month") { d = new Date(today); d.setMonth(d.getMonth() + 1); }
  else {
    const inMatch = lower.match(/in\s+(\d+)\s+day/);
    if (inMatch) { d = new Date(today); d.setDate(d.getDate() + parseInt(inMatch[1])); }
  }
  return d ? formatDateISO(d) : null;
}

export function getWeekdayName(dateISO) {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}
