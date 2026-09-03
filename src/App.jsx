import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignUp from "./Components/auth/Signup-form.jsx";
import Login from "./Components/auth/Login-form.jsx"
import Home from "./Components/Home.jsx"
import CalendarPage from "./Components/calendar/CalendarPage.jsx";
import TaskBoard from "./Components/tasks/TaskBoard.jsx";
import NotesPage from "./Components/notes/NotesPage.jsx";
import TimeManager from "./Components/TimeManager.jsx";
import AnalyticsPage from "./Components/AnalyticsManager.jsx";
import ProtectedRoute from "./Components/auth/ProtectedRoute.jsx";
import GuestRoute from "./Components/auth/GuestRoute.jsx";
import AppLayout from "./Components/layout/AppLayout.jsx";
import { useEffect } from "react";
import { useThemeStore } from "./stores/ThemeStore";

const App = () => {
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "var(--card)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          },
        }}
      />
      <Routes>
        {/* Public Routes (Guest Only) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/pomodoro" element={<TimeManager />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  )
}

export default App