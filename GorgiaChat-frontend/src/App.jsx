import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatWindow from './assets/components/ChatWindow';
import MeetWindow from './assets/components/pages/meet/MeetWindow';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChatWindow />} />
        <Route path="/meet" element={<MeetWindow />} />
        <Route path="calendar" element={<div>Calendar Page</div>} />
        <Route path="activity" element={<div>Activity Page</div>} />
      </Routes>
    </Router>
  );
}

export default App;
