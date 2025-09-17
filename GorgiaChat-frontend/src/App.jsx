import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatWindow from './components/ChatWindow';
import MeetWindow from './components/pages/meet/MeetWindow';
import Login from './components/pages/authentication/Login';
import Registration from './components/pages/authentication/Registration';
import Calendar from './components/pages/calendar/CalendarWindow';
import Activity from './components/pages/activity/ActivityWindow';
import ProtectedRoute from './components/ProtectedRoute';
import CallModal from './components/call/CallModal';
import IncomingCallModal from './components/call/IncomingCallModal';
import RejectionModal from './components/call/RejectionModal';
import Group from './components/pages/group/GroupWindow';
import Layout from './components/Layout'; // new import
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/chat" element={<ChatWindow />} />
          <Route path="/group" element={<Group />} />
          <Route path="meet" element={<MeetWindow />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="activity" element={<Activity />} />
        </Route>
      </Routes>
      <CallModal />
      <IncomingCallModal />
      <RejectionModal />
    </Router>
  );
}

export default App;