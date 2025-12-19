import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import SignUp from './Components/auth/Signup-form.jsx';
import Login from './Components/auth/Login-form.jsx'
import TimeManager from "./Components/TimeManager.jsx";
import Home from "./Components/Home.jsx"
import Calender from "./Components/CalenderModal.jsx";
import AnalyticsPage from "./Components/AnalyticsManager.jsx";
import ProtectedRoute from "./Components/auth/ProtectedRoute.jsx";
import GuestRoute from "./Components/auth/GuestRoute.jsx";

const App = () => {
  return (
   <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public Routes (Guest Only) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home/>} />
          <Route path="/calendar" element={<Calender />} />
          <Route path="/pomodoro" element={<TimeManager/>} />
          <Route path="/analytics" element={<AnalyticsPage/>} />
        </Route>
      </Routes>
    </>
  )
}

export default App