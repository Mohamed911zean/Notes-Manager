import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import SignUp from './Components/auth/Signup-form.jsx';
import Login from './Components/auth/Login-form.jsx'
import TimeManager from "./Components/TimeManager.jsx";
import Home from "./Components/Home.jsx"
import Calender from "./Components/CalenderModal.jsx";
import AnalyticsPage from "./Components/AnalyticsManager.jsx";

const App = () => {
  return (
   <>
              <Toaster position="top-center" reverseOrder={false} />
    <Routes>
     <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/home" element={<Home/>} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/calendar" element={<Calender />} />
      <Route path="/pomodoro" element={<TimeManager/>} />
      <Route path="/analytics" element={<AnalyticsPage/>} />

    </Routes>
      
    </>
  )
}

export default App