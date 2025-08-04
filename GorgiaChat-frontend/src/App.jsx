import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatWindow from './components/ChatWindow';
import MeetWindow from './components/pages/meet/MeetWindow';
import Login from './components/pages/authentication/Login';
import Registration from './components/pages/authentication/Registration';
import Calendar from './components/pages/calendar/CalendarWindow'
import Activity from './components/pages/activity/ActivityWindow'
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatWindow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meet"
          element={
            <ProtectedRoute>
              <MeetWindow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
