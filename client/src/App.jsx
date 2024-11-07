import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import AdminSetup from './components/AdminSetup/AdminSetup';
import OrgChart from './components/OrgChart/OrgChart';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route path="/org-chart" element={<OrgChart />} />
      </Routes>
    </div>
  );
}

export default App;