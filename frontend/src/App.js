import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminWalletProvider } from './context/AdminWalletContext';
import { RegistrationLinkProvider } from './context/RegistrationLinkContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Wallet from './pages/Wallet';
import Withdrawal from './pages/Withdrawal';
import Transactions from './pages/Transactions';
import ActiveContracts from './pages/ActiveContracts';
import AdminDashboard from './pages/AdminDashboard';
import DebugWallet from './pages/DebugWallet';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import './App.css';
import './styles/LuxuryTheme.css';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AdminWalletProvider>
          <RegistrationLinkProvider>
            <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/debug" element={<DebugWallet />} />
              <Route 
                path="/dashboard" 
                element={
                  <UserRoute>
                    <Dashboard />
                  </UserRoute>
                } 
              />

              <Route 
                path="/wallet" 
                element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/withdrawal" 
                element={
                  <ProtectedRoute>
                    <Withdrawal />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transactions" 
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/active-contracts" 
                element={
                  <ProtectedRoute>
                    <ActiveContracts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
            </Routes>
          </main>
          </div>
             </Router>
           </RegistrationLinkProvider>
         </AdminWalletProvider>
       </AuthProvider>
    </NotificationProvider>
  );
}

export default App;