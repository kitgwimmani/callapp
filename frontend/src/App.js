import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import UsersPage from './pages/UsersPage';
import CallLogsPage from './pages/CallLogsPage';
import CallPage from './pages/CallPage'; // Import the new CallPage component
import LiveCallPage from './pages/LiveCallPage';

export default function App() {
  return (
    <Router>
      <Navbar />
      <div className="container my-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/call-logs" element={<CallLogsPage />} />
          {/* Add new route for the Call Page */}
          <Route path="/call" element={<CallPage />} />
          <Route path="/live-call" element={<LiveCallPage publicKey={process.env.REACT_APP_VAPI_PUBLIC_KEY} />} />
          

        </Routes>
      </div>
    </Router>
  );
}