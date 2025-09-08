import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DebugWallet = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      // Test Dashboard API
      const dashRes = await axios.get('/api/v1/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(dashRes.data);
      
      // Test Wallet Balances API
      const walletRes = await axios.get('/api/v1/wallet/balances', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletData(walletRes.data);
      
    } catch (err) {
      console.error('Debug API Error:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Wallet APIs</h1>
      
      <div style={{ marginBottom: '20px', background: '#e8f4f8', padding: '10px' }}>
        <h3>Authentication Status</h3>
        <p>Token exists: {token ? 'Yes' : 'No'}</p>
        <p>Token length: {token?.length || 0}</p>
        <p>User data: {user ? 'Yes' : 'No'}</p>
        {user && (
          <pre style={{ fontSize: '12px' }}>
            {JSON.stringify(JSON.parse(user), null, 2)}
          </pre>
        )}
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Dashboard API (/api/v1/dashboard)</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(dashboardData, null, 2)}
        </pre>
      </div>
      
      <div>
        <h2>Wallet Balances API (/api/v1/wallet/balances)</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {JSON.stringify(walletData, null, 2)}
        </pre>
      </div>
      
      <button onClick={fetchData} style={{ marginTop: '20px', padding: '10px' }}>
        Refresh Data
      </button>
    </div>
  );
};

export default DebugWallet;