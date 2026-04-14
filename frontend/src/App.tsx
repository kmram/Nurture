import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LeadMatrix from './pages/LeadMatrix';
import CommandCenter from './pages/CommandCenter';
import TravelerChat from './pages/TravelerChat';
import Settings from './pages/Settings';
import Ingestion from './pages/Ingestion';

function App() {
  return (
    <Router>
      <Routes>
        {/* Agent/B2B Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<LeadMatrix />} />
          <Route path="profile/:id" element={<CommandCenter />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ingestion" element={<Ingestion />} />
        </Route>

        {/* Traveler/B2C Route */}
        <Route path="/chat" element={<TravelerChat />} />
        <Route path="/chat/:id" element={<TravelerChat />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
