import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useSessionTimeout from '../hooks/useSessionTimeout';
import DashboardCharts from '../components/DashboardCharts';
import AdminWalletDisplay from '../components/AdminWalletDisplay';
import RegistrationLinkManager from '../components/RegistrationLinkManager';
import { useAdminWallet } from '../context/AdminWalletContext';
import { useRegistrationLink } from '../context/RegistrationLinkContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const { deductFunds, formatCurrency } = useAdminWallet();
  const registrationLinkContext = useRegistrationLink();
  
  // Initialize session timeout (30 minutes)
  useSessionTimeout(30);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentApprovalSubTab, setPaymentApprovalSubTab] = useState('pending');
  const [payoutSubTab, setPayoutSubTab] = useState('passive');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('Pending');

  // Real dashboard data from API
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInvestments: 0,
    totalInvested: 0,
    pendingPayouts: 0,
    pendingApprovals: 0,
    totalEarnings: 0
  });

  const [dashboardData, setDashboardData] = useState({
    depositsVsWithdrawals: {
      deposits: 0,
      withdrawals: 0,
      netFlow: 0,
      depositsCount: 0,
      withdrawalsCount: 0,
      timeframe: 'all'
    },
    investmentPerformance: {
      totalInvestments: 0,
      totalReturns: 0,
      roi: 0,
      activeInvestments: 0
    },
    recentActivity: {
      pendingTransactions: 0,
      payoutRequests: 0
    },
    dailySalesLogs: [],
    memberEngagement: {
      activeUsers: 0,
      inactiveUsers: 0,
      engagementRate: 0,
      totalMembers: 0
    }
  });

  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  
  // Encashment settings state
  const [encashmentSettings, setEncashmentSettings] = useState({
    passiveWallet: {
      startTime: '11:00',
      endTime: '15:00',
      isEnabled: true,
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      overrideActive: false,
      overrideExpiry: null
    },
    // directBonusWallet removed,
    lastUpdated: null,
    updatedBy: null
  });
  const [overrideDuration, setOverrideDuration] = useState(30);
  const [overrideUnit, setOverrideUnit] = useState('minutes');
  const [encashmentLoading, setEncashmentLoading] = useState(false);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPagination, setLogsPagination] = useState({});
  const [logsFilter, setLogsFilter] = useState({
    action: '',
    adminId: '',
    days: 7
  });

  // Deposits/Withdrawals filtering state
  const [depositsWithdrawalsFilter, setDepositsWithdrawalsFilter] = useState('all');
  const [depositsWithdrawalsLoading, setDepositsWithdrawalsLoading] = useState(false);

  // Fetch deposits/withdrawals data with time filtering
  const fetchDepositsWithdrawalsData = async (timeframe = 'all') => {
    try {
      setDepositsWithdrawalsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`http://localhost:5000/api/v1/deposits-withdrawals/summary?timeframe=${timeframe}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setDashboardData(prevData => ({
          ...prevData,
          depositsVsWithdrawals: {
            deposits: data.deposits,
            withdrawals: data.withdrawals,
            netFlow: data.netFlow,
            depositsCount: data.depositsCount,
            withdrawalsCount: data.withdrawalsCount,
            timeframe: data.timeframe
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching deposits/withdrawals data:', error);
    } finally {
      setDepositsWithdrawalsLoading(false);
    }
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Fetch main dashboard data
      const dashboardResponse = await axios.get('http://localhost:5000/api/v1/dashboard/admin', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (dashboardResponse.data.success) {
        const data = dashboardResponse.data.data;
        
        // Update stats
        setStats({
          totalUsers: data.overview.totalUsers,
          activeInvestments: data.overview.activeInvestments,
          totalInvested: data.overview.totalInvested,
          pendingPayouts: data.overview.pendingPayouts,
          pendingApprovals: data.overview.pendingApprovals,
          totalEarnings: data.overview.totalEarnings
        });
        
        // Update dashboard data
        setDashboardData({
          depositsVsWithdrawals: data.depositsVsWithdrawals,
          investmentPerformance: data.investmentPerformance,
          recentActivity: data.recentActivity,
          dailySalesLogs: data.dailySalesLogs,
          memberEngagement: data.memberEngagement
        });
      }
      
      // Fetch users data
      const usersResponse = await axios.get('http://localhost:5000/api/v1/dashboard/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchInvestments();
    fetchDepositsWithdrawalsData(depositsWithdrawalsFilter);
  }, []);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchDepositsWithdrawalsData(depositsWithdrawalsFilter);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [depositsWithdrawalsFilter]);

  // Handle deposits/withdrawals timeframe change
  const handleDepositsWithdrawalsFilterChange = (newTimeframe) => {
    setDepositsWithdrawalsFilter(newTimeframe);
    fetchDepositsWithdrawalsData(newTimeframe);
  };

  const [investments, setInvestments] = useState([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(true);
  const [investmentsError, setInvestmentsError] = useState(null);

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      user: 'John Doe',
      walletSource: 'Passive',
      amount: 2500,
      date: '2024-01-20',
      status: 'Completed'
    },
    {
      id: 2,
      user: 'Jane Smith',
      walletSource: 'Bonus',
      amount: 1250,
      date: '2024-01-19',
      status: 'Pending'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      walletSource: 'Passive',
      amount: 3750,
      date: '2024-01-18',
      status: 'Completed'
    }
  ]);

  const [payoutRequests, setPayoutRequests] = useState([]);

  const [paymentApprovals, setPaymentApprovals] = useState([]);



  // Fetch data on component mount
  useEffect(() => {
    fetchPaymentDeposits();
    fetchPayoutRequests();
  }, []);

  // Fetch payout requests from API
  const fetchPayoutRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/v1/withdrawals/admin', {
         headers: { Authorization: `Bearer ${token}` }
       });
      
      if (res.data.success) {
        // Transform API data to match frontend format
        const transformedData = res.data.data.map(withdrawal => ({
          id: withdrawal._id,
          user: withdrawal.user?.fullName || withdrawal.user?.email || 'Unknown User',
          sourceWallet: 'Passive Wallet', // Only passive wallet available
          amount: withdrawal.amount,
          method: withdrawal.paymentMethod === 'gcash' ? 'GCash' : 
                 withdrawal.paymentMethod === 'paymaya' ? 'Maya' : 
                 withdrawal.paymentMethod === 'gotyme' ? 'GoTyme' : withdrawal.paymentMethod,
          date: new Date(withdrawal.createdAt).toISOString().split('T')[0],
          status: withdrawal.status.toUpperCase() === 'PENDING' ? 'Pending' : 
                  withdrawal.status.toUpperCase() === 'COMPLETED' ? 'Completed' : 
                  withdrawal.status.toUpperCase() === 'CANCELLED' ? 'Cancelled' : 
                  withdrawal.status.toUpperCase() === 'REJECTED' ? 'Rejected' : withdrawal.status,
          accountDetails: withdrawal.paymentDetails?.accountNumber || '',
          accountName: withdrawal.paymentDetails?.accountName || '',
          processedAt: withdrawal.processedAt,
          processedBy: withdrawal.processedBy?.fullName || '',
          remarks: withdrawal.remarks || '',
          walletType: withdrawal.walletType
        }));
        setPayoutRequests(transformedData);
      }
    } catch (error) {
      console.error('Failed to fetch payout requests:', error);
      setError('Failed to fetch payout requests');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH');
  };

  const handleSearch = (data, searchFields) => {
    if (!searchTerm) return data;
    return data.filter(item =>
      searchFields.some(field =>
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const handlePagination = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const handleSelectAll = (data) => {
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUserAction = (action, userId) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        switch (action) {
          case 'activate':
            return { ...user, status: 'Active' };
          case 'deactivate':
            return { ...user, status: 'Inactive' };
          case 'resetPassword':
            alert(`Password reset email sent to ${user.email}`);
            return user;
          default:
            return user;
        }
      }
      return user;
    }));
  };

  const handleResetUserRequests = async (userId, scope = 'today') => {
    const user = users.find(u => u._id === userId);
    const confirmMessage = `Are you sure you want to reset ${scope === 'all' ? 'all' : "today's"} withdrawal records for ${user?.fullName || 'this user'}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/v1/admin/reset-user-requests',
        { userId, scope },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`✅ Deleted ${response.data.deletedCount} withdrawal record(s) for ${user?.fullName || 'user'}.\nBalances and contracts remain unaffected.`);
      }
    } catch (error) {
      console.error('Error resetting user requests:', error);
      alert('❌ Failed to reset user withdrawal records. Please try again.');
    }
  };

  const fetchInvestments = async () => {
    try {
      setInvestmentsLoading(true);
      setInvestmentsError(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/v1/admin/investments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setInvestments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
      setInvestmentsError('Failed to load investments data');
    } finally {
      setInvestmentsLoading(false);
    }
  };

  const handleInvestmentAction = async (action, investmentId) => {
    if (action === 'void') {
      const reason = prompt('Please provide a reason for voiding this investment (optional):');
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.put(
          `http://localhost:5000/api/v1/admin/investments/${investmentId}/void`,
          { reason },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          alert('Investment voided successfully');
          // Refresh investments data
          fetchInvestments();
        }
      } catch (error) {
        console.error('Error voiding investment:', error);
        alert('Failed to void investment. Please try again.');
      }
    }
  };

  const handleTransactionAction = (action, transactionId) => {
    setTransactions(prev => prev.map(transaction => {
      if (transaction.id === transactionId) {
        return { ...transaction, status: action === 'approve' ? 'Completed' : 'Rejected' };
      }
      return transaction;
    }));
  };

  const handlePayoutAction = async (action, payoutId) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'setAsPaid' ? `/api/v1/withdrawals/${payoutId}/set-paid` : `/api/v1/withdrawals/${payoutId}/cancel`;
      
      const res = await axios.put(`http://localhost:5000${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        // Update local state
        setPayoutRequests(prev => prev.map(payout => {
          if (payout.id === payoutId) {
            if (action === 'setAsPaid') {
              return { ...payout, status: 'Completed' };
            } else if (action === 'cancelRequest') {
              return { ...payout, status: 'Cancelled' };
            }
          }
          return payout;
        }));
        
        alert(`Payout ${action === 'setAsPaid' ? 'marked as paid' : 'cancelled'} successfully`);
        
        // Refresh data to get updated information
        fetchPayoutRequests();
      }
    } catch (error) {
      console.error(`Failed to ${action} payout:`, error);
      alert(`Failed to ${action === 'setAsPaid' ? 'mark payout as paid' : 'cancel payout'}`);
    }
  };

  const handleBulkPayoutAction = (action) => {
    let status;
    if (action === 'setPayAll') {
      status = 'Completed';
    } else if (action === 'cancelAll') {
      status = 'Cancelled';
    }
    
    setPayoutRequests(prev => prev.map(payout => 
      selectedItems.includes(payout.id) ? { ...payout, status } : payout
    ));
    setSelectedItems([]);
  };

  const exportToPDF = (data, filename) => {
    // For now, we'll use a simple alert. In a real implementation,
    // you would use a library like jsPDF or html2pdf
    alert(`PDF export functionality would be implemented here for ${filename}`);
  };

  const fetchPaymentDeposits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/v1/payments/deposits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const deposits = response.data.data.map(deposit => ({
        id: deposit._id,
        user: deposit.userId?.name || deposit.userId?.email || 'Unknown User',
        userId: deposit.userId?._id,
        amount: deposit.amount,
        receiptImage: `http://localhost:5000${deposit.receipt}`,
        date: deposit.createdAt,
        status: deposit.status
      }));
      
      setPaymentApprovals(deposits);
    } catch (error) {
      console.error('Error fetching payment deposits:', error);
    }
  };

  const handlePaymentApprovalAction = async (action, approvalId) => {
    console.log('🔥 FRONTEND: Payment approval action triggered!');
    console.log('Action:', action);
    console.log('Approval ID:', approvalId);
    
    try {
      const token = localStorage.getItem('token');
      const approval = paymentApprovals.find(p => p.id === approvalId);
      console.log('Found approval:', approval);
      console.log('Token exists:', !!token);
      
      if (action === 'approve') {
        console.log('Making API call to approve payment...');
        // Call API to approve payment
        const response = await axios.post('http://localhost:5000/api/v1/payments/approve', 
          { paymentId: approvalId }, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log('API Response:', response.data);
        
        // Update admin master wallet balance
        const approvedAmount = approval.amount;
        const userName = approval.user?.username || 'Unknown User';
        deductFunds(approvedAmount, approval.user?._id, userName, `Payment approval for deposit #${approvalId}`);
        
        // Show success message as specified in requirements
        alert('✅ Payment approved, funds credited to user.');
        
        // Update UI - move to approved tab
        setPaymentApprovals(prev => prev.filter(p => p.id !== approvalId));
        
        // Refresh the deposits list and user wallet balances
        fetchPaymentDeposits();
        fetchDashboardData(); // Refresh user wallet balances
      } else {
        // Call API to reject deposit
        const reason = prompt('Enter rejection reason (optional):');
        await axios.put(`http://localhost:5000/api/v1/payments/deposits/${approvalId}/reject`, 
          { reason }, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        alert('Payment request rejected successfully');
      }
      
      // Refresh the deposits list
       fetchPaymentDeposits();
     } catch (error) {
       console.error('🚨 FRONTEND ERROR: Payment approval failed!');
       console.error('Error details:', error);
       console.error('Error response:', error.response?.data);
       console.error('Error status:', error.response?.status);
       alert('❌ Error processing payment approval. Please try again.');
     }
   };

  const renderOverviewTab = () => (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Active Investments</h3>
          <p className="stat-number">{stats.activeInvestments.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Total Invested</h3>
          <p className="stat-number">{formatCurrency(stats.totalInvested)}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Payouts</h3>
          <p className="stat-number">{stats.pendingPayouts}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Approvals</h3>
          <p className="stat-number">{stats.pendingApprovals}</p>
        </div>
        <div className="stat-card">
          <h3>Total Earnings</h3>
          <p className="stat-number">{formatCurrency(stats.totalEarnings)}</p>
        </div>
      </div>
      
      {/* Admin Referral Section */}
      {user && user.referralCode && (
        <div className="referral-section">
          <h3>Your Referral Code</h3>
          <div className="referral-card">
            <div className="referral-info">
              <label>Referral Code:</label>
              <div className="referral-code-display">
                <span className="referral-code">{user.referralCode}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(user.referralCode)}
                  className="copy-btn"
                  title="Copy referral code"
                >
                  📋
                </button>
              </div>
            </div>
            <div className="referral-info">
              <label>Referral Link:</label>
              <div className="referral-link-display">
                <span className="referral-link">
                  {window.location.origin}/register?ref={user.referralCode}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user.referralCode}`)}
                  className="copy-btn"
                  title="Copy referral link"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Charts */}
      <DashboardCharts 
        stats={stats} 
        dashboardData={dashboardData}
        depositsVsWithdrawals={dashboardData.depositsVsWithdrawals}
        investmentPerformance={dashboardData.investmentPerformance}
        recentActivity={dashboardData.recentActivity}
        memberEngagement={dashboardData.memberEngagement}
        dailySalesLogs={dashboardData.dailySalesLogs}
        depositsWithdrawalsFilter={depositsWithdrawalsFilter}
        onDepositsWithdrawalsFilterChange={handleDepositsWithdrawalsFilterChange}
        depositsWithdrawalsLoading={depositsWithdrawalsLoading}
      />
    </div>
  );

  const renderUsersTab = () => {
    const filteredUsers = handleSearch(users, ['fullName', 'email', 'status', 'username']);
    const paginatedUsers = handlePagination(filteredUsers);

    if (loading) {
      return (
        <div className="users-tab">
          <div className="loading-message">Loading users...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="users-tab">
          <div className="error-message">{error}</div>
          <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
        </div>
      );
    }

    return (
      <div className="users-tab">
        <div className="tab-header">
          <div className="search-export">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              onClick={() => exportToCSV(filteredUsers, 'users')}
              className="export-btn"
            >
              Export CSV
            </button>
            <button
              onClick={fetchDashboardData}
              className="refresh-btn"
            >
              Refresh
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Mobile Number</th>
                <th>Status</th>
                <th>Wallet Balance</th>
                <th>Role</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.mobileNumber}</td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatCurrency(user.walletBalance || 0)}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleUserAction('resetPassword', user._id)}
                        className="action-btn reset"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleUserAction(
                          user.status === 'Active' ? 'deactivate' : 'activate',
                          user._id
                        )}
                        className={`action-btn ${user.status === 'Active' ? 'deactivate' : 'activate'}`}
                      >
                        {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleResetUserRequests(user._id, 'today')}
                        className="action-btn reset-requests"
                        title="Reset today's withdrawal records"
                      >
                        Reset Requests
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage)}</span>
          <button
            onClick={() => setCurrentPage(prev => 
              Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage))
            )}
            disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderInvestmentsTab = () => {
    if (investmentsLoading) {
      return (
        <div className="investments-tab">
          <div className="loading-state">
            <p>Loading investments data...</p>
          </div>
        </div>
      );
    }

    if (investmentsError) {
      return (
        <div className="investments-tab">
          <div className="error-state">
            <p>{investmentsError}</p>
            <button onClick={fetchInvestments} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      );
    }

    const filteredInvestments = handleSearch(investments, ['user', 'userEmail']);
    const paginatedInvestments = handlePagination(filteredInvestments);

    return (
      <div className="investments-tab">
        <div className="tab-header">
          <div className="search-export">
            <input
              type="text"
              placeholder="Search investments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              onClick={() => exportToCSV(filteredInvestments, 'investments')}
              className="export-btn"
            >
              Export CSV
            </button>
            <button
              onClick={fetchInvestments}
              className="refresh-btn"
            >
              Refresh
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount Invested</th>
                <th>Start Date</th>
                <th>Maturity Date</th>
                <th>Cycle Progress</th>
                <th>Total Returns</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvestments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No investments found
                  </td>
                </tr>
              ) : (
                paginatedInvestments.map(investment => (
                  <tr key={investment.id}>
                    <td>
                      <div>
                        <div>{investment.user}</div>
                        <small style={{ color: '#888' }}>{investment.userEmail}</small>
                      </div>
                    </td>
                    <td>{formatCurrency(investment.amount)}</td>
                    <td>{formatDate(investment.startDate)}</td>
                    <td>{formatDate(investment.maturityDate)}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${investment.cycleProgress}%` }}
                        ></div>
                        <span className="progress-text">{investment.cycleProgress}%</span>
                      </div>
                    </td>
                    <td>{formatCurrency(investment.totalReturns)}</td>
                    <td>
                      <span className={`status-badge ${investment.status}`}>
                        {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {investment.status === 'active' ? (
                        <button
                          onClick={() => handleInvestmentAction('void', investment.id)}
                          className="action-btn void"
                        >
                          Void Investment
                        </button>
                      ) : (
                        <span className="disabled-action">No actions available</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(filteredInvestments.length / itemsPerPage)}</span>
          <button
            onClick={() => setCurrentPage(prev => 
              Math.min(prev + 1, Math.ceil(filteredInvestments.length / itemsPerPage))
            )}
            disabled={currentPage === Math.ceil(filteredInvestments.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderTransactionsTab = () => {
    const filteredTransactions = handleSearch(transactions, ['user', 'walletSource', 'status']);
    const paginatedTransactions = handlePagination(filteredTransactions);

    return (
      <div className="transactions-tab">
        <div className="tab-header">
          <div className="search-export">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              onClick={() => exportToCSV(filteredTransactions, 'transactions')}
              className="export-btn"
            >
              Export CSV
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Wallet Source</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{transaction.user}</td>
                  <td>{transaction.walletSource}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    {transaction.status === 'Pending' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handleTransactionAction('approve', transaction.id)}
                          className="action-btn approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleTransactionAction('reject', transaction.id)}
                          className="action-btn reject"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(filteredTransactions.length / itemsPerPage)}</span>
          <button
            onClick={() => setCurrentPage(prev => 
              Math.min(prev + 1, Math.ceil(filteredTransactions.length / itemsPerPage))
            )}
            disabled={currentPage === Math.ceil(filteredTransactions.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderPayoutRequestsTab = () => {
    // Filter payouts by wallet type and status
    const passivePayouts = payoutRequests.filter(p => p.sourceWallet === 'Passive Wallet' && p.status === payoutStatusFilter);
    // bonusPayouts removed - no bonus wallet
    
    const currentPayouts = passivePayouts; // Only passive payouts available
    const filteredPayouts = handleSearch(currentPayouts, ['user', 'method', 'status']);
    const paginatedPayouts = handlePagination(filteredPayouts);
    
    // Calculate totals for current tab and status
        const totalRequested = currentPayouts.reduce((sum, p) => sum + p.amount, 0);
        const totalDeductions = currentPayouts.reduce((sum, p) => sum + (p.deductions || 0), 0);
        const totalNetPayout = totalRequested - totalDeductions;

    return (
      <div className="payout-requests-tab">
        <div className="sub-tabs">
          <button
            className={`sub-tab ${payoutSubTab === 'passive' ? 'active' : ''}`}
            onClick={() => setPayoutSubTab('passive')}
          >
            Manage Payouts (Passive Income) ({payoutRequests.filter(p => p.sourceWallet === 'Passive Wallet' && p.status === 'Pending').length})
          </button>
          {/* Bonus payout tab removed */}
        </div>
        
        <div className="status-tabs">
          <button
            className={`status-tab ${payoutStatusFilter === 'Pending' ? 'active' : ''}`}
            onClick={() => setPayoutStatusFilter('Pending')}
          >
            Pending
          </button>
          <button
            className={`status-tab ${payoutStatusFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setPayoutStatusFilter('Completed')}
          >
            Completed
          </button>
          <button
            className={`status-tab ${payoutStatusFilter === 'Cancelled' ? 'active' : ''}`}
            onClick={() => setPayoutStatusFilter('Cancelled')}
          >
            Cancelled
          </button>
          <button
            className={`status-tab ${payoutStatusFilter === 'Rejected' ? 'active' : ''}`}
            onClick={() => setPayoutStatusFilter('Rejected')}
          >
            Rejected
          </button>
        </div>
        
        <div className="tab-header">
          <div className="search-export">
            <input
              type="text"
              placeholder={`Search ${payoutSubTab} payout requests...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <div className="bulk-actions">
              <button
                onClick={() => handleSelectAll(filteredPayouts)}
                className="bulk-btn"
              >
                {selectedItems.length === filteredPayouts.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.length > 0 && payoutStatusFilter === 'Pending' && (
                <>
                  <button
                    onClick={() => handleBulkPayoutAction('setPayAll')}
                    className="bulk-btn approve"
                  >
                    Set Pay All
                  </button>
                  <button
                    onClick={() => handleBulkPayoutAction('cancelAll')}
                    className="bulk-btn reject"
                  >
                    Cancel All
                  </button>
                </>
              )}
            </div>
            <div className="export-buttons">
              <button
                onClick={() => exportToCSV(filteredPayouts, `${payoutSubTab}-${payoutStatusFilter.toLowerCase()}-payouts`)}
                className="export-btn"
              >
                Export CSV
              </button>
              <button
                onClick={() => exportToPDF(filteredPayouts, `${payoutSubTab}-${payoutStatusFilter.toLowerCase()}-payouts`)}
                className="export-btn"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
        
        {/* Totals Row */}
        <div className="totals-row">
          <div className="totals-container">
            <div className="total-item">
              <span className="total-label">Total Requested:</span>
              <span className="total-value">{formatCurrency(totalRequested)}</span>
            </div>
            <div className="total-item">
              <span className="total-label">Total Deductions:</span>
              <span className="total-value">{formatCurrency(totalDeductions)}</span>
            </div>
            <div className="total-item">
              <span className="total-label">Net Payout:</span>
              <span className="total-value total-net">{formatCurrency(totalNetPayout)}</span>
            </div>
          </div>
        </div>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredPayouts.length && filteredPayouts.length > 0}
                    onChange={() => handleSelectAll(filteredPayouts)}
                  />
                </th>
                <th>Date</th>
                <th>User Info</th>
                <th>Requested</th>
                <th>Deduction</th>
                <th>Net Payout</th>
                <th>MOP</th>
                <th>Account Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayouts.map(payout => {
                const deduction = payout.deductions || 0;
                const netPayout = payout.amount - deduction;
                return (
                  <tr key={payout.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(payout.id)}
                        onChange={() => handleSelectItem(payout.id)}
                      />
                    </td>
                    <td>{formatDate(payout.date)}</td>
                    <td>{payout.user}</td>
                    <td>{formatCurrency(payout.amount)}</td>
                    <td>{formatCurrency(deduction)}</td>
                    <td>{formatCurrency(netPayout)}</td>
                    <td>{payout.method}</td>
                    <td>{payout.accountDetails || 'N/A'}</td>
                    <td>
                      {payout.status === 'Pending' && (
                        <div className="action-buttons">
                          <button
                            onClick={() => handlePayoutAction('setAsPaid', payout.id)}
                            className="action-btn approve"
                          >
                            Set as Paid
                          </button>
                          <button
                            onClick={() => handlePayoutAction('cancelRequest', payout.id)}
                            className="action-btn reject"
                          >
                            Cancel Request
                          </button>
                        </div>
                      )}
                      {payout.status !== 'Pending' && (
                        <span className={`status-badge ${payout.status.toLowerCase()}`}>
                          {payout.status}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(filteredPayouts.length / itemsPerPage)}</span>
          <button
            onClick={() => setCurrentPage(prev => 
              Math.min(prev + 1, Math.ceil(filteredPayouts.length / itemsPerPage))
            )}
            disabled={currentPage === Math.ceil(filteredPayouts.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const renderPaymentApprovalsTab = () => {
    const filteredApprovals = paymentApprovals.filter(approval => {
      if (paymentApprovalSubTab === 'pending') return approval.status === 'Pending';
      if (paymentApprovalSubTab === 'approved') return approval.status === 'Approved';
      if (paymentApprovalSubTab === 'rejected') return approval.status === 'Rejected';
      return true;
    });
    
    const searchedApprovals = handleSearch(filteredApprovals, ['user']);
    const paginatedApprovals = handlePagination(searchedApprovals);

    return (
      <div className="payment-approvals-tab">
        <div className="sub-tabs">
          <button
            className={`sub-tab ${paymentApprovalSubTab === 'pending' ? 'active' : ''}`}
            onClick={() => setPaymentApprovalSubTab('pending')}
          >
            For Approval ({paymentApprovals.filter(p => p.status === 'Pending').length})
          </button>
          <button
            className={`sub-tab ${paymentApprovalSubTab === 'approved' ? 'active' : ''}`}
            onClick={() => setPaymentApprovalSubTab('approved')}
          >
            Approved Payins ({paymentApprovals.filter(p => p.status === 'Approved').length})
          </button>
          <button
            className={`sub-tab ${paymentApprovalSubTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setPaymentApprovalSubTab('rejected')}
          >
            Rejected Payins ({paymentApprovals.filter(p => p.status === 'Rejected').length})
          </button>
        </div>
        
        <div className="tab-header">
          <div className="search-export">
            <input
              type="text"
              placeholder="Search payment approvals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Receipt Image</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApprovals.map(approval => (
                <tr key={approval.id}>
                  <td>{approval.user}</td>
                  <td>{formatCurrency(approval.amount)}</td>
                  <td>
                    <button
                      onClick={() => window.open(approval.receiptImage, '_blank')}
                      className="view-receipt-btn"
                    >
                      View Receipt
                    </button>
                  </td>
                  <td>{formatDate(approval.date)}</td>
                  <td>
                    <span className={`status-badge ${approval.status.toLowerCase()}`}>
                      {approval.status}
                    </span>
                  </td>
                  <td>
                    {approval.status === 'Pending' && (
                      <div className="action-buttons">
                        <button
                          onClick={() => handlePaymentApprovalAction('approve', approval.id)}
                          className="action-btn approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePaymentApprovalAction('reject', approval.id)}
                          className="action-btn reject"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {Math.ceil(searchedApprovals.length / itemsPerPage)}</span>
          <button
            onClick={() => setCurrentPage(prev => 
              Math.min(prev + 1, Math.ceil(searchedApprovals.length / itemsPerPage))
            )}
            disabled={currentPage === Math.ceil(searchedApprovals.length / itemsPerPage)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Encashment Settings Functions
  const fetchEncashmentSettings = async () => {
    try {
      setEncashmentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/v1/admin/encashment-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data.data;
      setEncashmentSettings({
        passiveWallet: {
          ...data.passiveWallet,
          allowedDays: data.passiveWallet?.allowedDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        // directBonusWallet removed,
        lastUpdated: data.lastUpdated,
        updatedBy: data.updatedBy
      });
    } catch (error) {
      console.error('Error fetching encashment settings:', error);
      setError('Failed to fetch encashment settings');
    } finally {
      setEncashmentLoading(false);
    }
  };

  const updateWalletEncashmentSettings = async (walletType, newSettings) => {
    try {
      setEncashmentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:5000/api/v1/admin/encashment-settings/${walletType}`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the specific wallet settings in state
      setEncashmentSettings(prev => ({
        ...prev,
        passiveWallet: response.data.data.config, // Only passive wallet available
        lastUpdated: response.data.data.lastUpdated,
        updatedBy: response.data.data.updatedBy
      }));
      
      const walletName = walletType === 'passive' ? 'Passive' : 'Direct Bonus';
      alert(`${walletName} wallet encashment settings updated successfully!`);
    } catch (error) {
      console.error('Error updating wallet encashment settings:', error);
      alert('Failed to update wallet encashment settings');
    } finally {
      setEncashmentLoading(false);
    }
  };

  const updateEncashmentSettings = async (newSettings) => {
    try {
      setEncashmentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/v1/admin/encashment-settings', newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEncashmentSettings(response.data.data);
      alert('Encashment settings updated successfully!');
    } catch (error) {
      console.error('Error updating encashment settings:', error);
      alert('Failed to update encashment settings');
    } finally {
      setEncashmentLoading(false);
    }
  };

  const activateEncashmentOverride = async () => {
    try {
      setEncashmentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/v1/admin/encashment-override', {
        duration: overrideDuration,
        unit: overrideUnit
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEncashmentSettings(); // Refresh settings
      alert(`Encashment override activated for ${overrideDuration} ${overrideUnit}!`);
    } catch (error) {
      console.error('Error activating encashment override:', error);
      alert('Failed to activate encashment override');
    } finally {
      setEncashmentLoading(false);
    }
  };

  const deactivateEncashmentOverride = async () => {
    try {
      setEncashmentLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/v1/admin/encashment-override/deactivate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEncashmentSettings(); // Refresh settings
      alert('Encashment override deactivated!');
    } catch (error) {
      console.error('Error deactivating encashment override:', error);
      alert('Failed to deactivate encashment override');
    } finally {
      setEncashmentLoading(false);
    }
  };

  const renderWalletSettingsCard = (walletType, walletConfig, title) => {
    const isOverrideActive = walletConfig.overrideActive && 
      walletConfig.overrideExpiry && 
      new Date(walletConfig.overrideExpiry) > new Date();
    
    const timeRemaining = isOverrideActive ? 
      Math.ceil((new Date(walletConfig.overrideExpiry) - new Date()) / (1000 * 60)) : 0;

    return (
      <div className="wallet-settings-section">
        <div className="wallet-header">
          <h3>{title}</h3>
          <div className={`status-indicator ${walletConfig.isEnabled ? 'enabled' : 'disabled'}`}>
            {walletConfig.isEnabled ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>

        {walletConfig.isEnabled && (
          <div className="schedule-info">
            <p><strong>Time:</strong> {walletConfig.startTime} - {walletConfig.endTime}</p>
            <p><strong>Days:</strong> {(walletConfig.allowedDays || []).map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')}</p>
          </div>
        )}

        {isOverrideActive && (
          <div className="override-status">
            <span className="override-badge">Override Active</span>
            <p>Time remaining: {timeRemaining} minutes</p>
          </div>
        )}

        <div className="wallet-settings-form">
          <div className="form-group">
            <label>Start Time:</label>
            <input
              type="time"
              value={walletConfig.startTime}
              onChange={(e) => setEncashmentSettings(prev => ({
                ...prev,
                [walletType]: { ...prev[walletType], startTime: e.target.value }
              }))}
              disabled={encashmentLoading}
            />
          </div>
          
          <div className="form-group">
            <label>End Time:</label>
            <input
              type="time"
              value={walletConfig.endTime}
              onChange={(e) => setEncashmentSettings(prev => ({
                ...prev,
                [walletType]: { ...prev[walletType], endTime: e.target.value }
              }))}
              disabled={encashmentLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Allowed Days:</label>
            <div className="days-selector">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <label key={day} className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={(walletConfig.allowedDays || []).includes(day)}
                    onChange={(e) => {
                      const currentDays = walletConfig.allowedDays || [];
                      const updatedDays = e.target.checked
                        ? [...currentDays, day]
                        : currentDays.filter(d => d !== day);
                      setEncashmentSettings(prev => ({
                        ...prev,
                        [walletType]: { ...prev[walletType], allowedDays: updatedDays }
                      }));
                    }}
                    disabled={encashmentLoading}
                  />
                  <span className="day-label">{day.charAt(0).toUpperCase() + day.slice(1, 3)}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={walletConfig.isEnabled}
                onChange={(e) => setEncashmentSettings(prev => ({
                  ...prev,
                  [walletType]: { ...prev[walletType], isEnabled: e.target.checked }
                }))}
                disabled={encashmentLoading}
              />
              Enable Encashment
            </label>
          </div>
          
          <button
            onClick={() => updateWalletEncashmentSettings(
              walletType === 'passiveWallet' ? 'passive' : 'directBonus',
              {
                startTime: walletConfig.startTime,
                endTime: walletConfig.endTime,
                isEnabled: walletConfig.isEnabled,
                allowedDays: walletConfig.allowedDays
              }
            )}
            disabled={encashmentLoading}
            className="btn btn-primary"
          >
            {encashmentLoading ? 'Updating...' : `Update ${title} Settings`}
          </button>
        </div>
      </div>
    );
  };

  const renderEncashmentSettingsTab = () => {
    return (
      <div className="encashment-settings-tab">
        <div className="tab-header">
          <h2>Encashment Settings</h2>
          <p>Control when users can submit withdrawal requests for each wallet type</p>
          {encashmentSettings.lastUpdated && (
            <p className="last-updated">
              Last updated: {new Date(encashmentSettings.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>

        <div className="wallet-settings-grid">
          {/* Passive Wallet Settings */}
          {renderWalletSettingsCard('passiveWallet', encashmentSettings.passiveWallet, 'Passive Wallet Encashment')}
          
          {/* Direct Bonus Wallet Settings removed */}
        </div>

        {/* Override Controls - Global */}
        <div className="settings-card override-controls">
          <h3>Global Override Controls</h3>
          <p>Temporarily open encashment for both wallets outside scheduled hours</p>
          
          <div className="form-group">
            <label>Duration:</label>
            <div className="duration-input">
              <input
                type="number"
                min="1"
                max="24"
                value={overrideDuration}
                onChange={(e) => setOverrideDuration(parseInt(e.target.value))}
                disabled={encashmentLoading}
              />
              <select
                value={overrideUnit}
                onChange={(e) => setOverrideUnit(e.target.value)}
                disabled={encashmentLoading}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>
          
          <div className="override-buttons">
            <button
              onClick={activateEncashmentOverride}
              disabled={encashmentLoading}
              className="btn btn-warning"
            >
              {encashmentLoading ? 'Activating...' : 'Open All Encashment Now'}
            </button>
            
            <button
              onClick={deactivateEncashmentOverride}
              disabled={encashmentLoading}
              className="btn btn-danger"
            >
              {encashmentLoading ? 'Deactivating...' : 'Deactivate All Overrides'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Load encashment settings when tab is active
  useEffect(() => {
    if (activeTab === 'encashment-settings') {
      fetchEncashmentSettings();
    }
  }, [activeTab]);

  // Activity logs functions
  const fetchActivityLogs = async () => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: logsPage,
        limit: 20,
        ...(logsFilter.action && { action: logsFilter.action }),
        ...(logsFilter.adminId && { adminId: logsFilter.adminId })
      });

      const response = await axios.get(`http://localhost:5000/api/v1/admin/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setActivityLogs(response.data.data);
        setLogsPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setError('Failed to fetch activity logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const renderActivityLogsTab = () => {
    return (
      <div className="activity-logs-tab">
        <div className="tab-header">
          <h2>Admin Activity Logs</h2>
          <div className="logs-filters">
            <select
              value={logsFilter.action}
              onChange={(e) => setLogsFilter({...logsFilter, action: e.target.value})}
              className="filter-select"
            >
              <option value="">All Actions</option>
              <option value="encashment_settings_update">Encashment Settings Update</option>
              <option value="encashment_override_enable">Override Enable</option>
              <option value="encashment_override_disable">Override Disable</option>
              <option value="user_activate">User Activate</option>
              <option value="user_deactivate">User Deactivate</option>
              <option value="user_password_reset">Password Reset</option>
            </select>
            
            <select
              value={logsFilter.days}
              onChange={(e) => setLogsFilter({...logsFilter, days: parseInt(e.target.value)})}
              className="filter-select"
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            
            <button
              onClick={fetchActivityLogs}
              disabled={logsLoading}
              className="btn btn-primary"
            >
              {logsLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="logs-content">
          {logsLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading activity logs...</p>
            </div>
          ) : (
            <>
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Description</th>
                      <th>Target</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <tr key={log._id}>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                          <td>
                            {log.adminId ? (
                              <div>
                                <div className="admin-name">{log.adminId.username}</div>
                                <div className="admin-email">{log.adminId.email}</div>
                              </div>
                            ) : (
                              'System'
                            )}
                          </td>
                          <td>
                            <span className={`action-badge action-${log.action.replace('_', '-')}`}>
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </td>
                          <td>{log.description}</td>
                          <td>
                            {log.targetUserId && (
                              <div>
                                <div>{log.targetUserId.username}</div>
                                <div className="target-email">{log.targetUserId.email}</div>
                              </div>
                            )}
                            {log.walletType && (
                              <span className="wallet-type">{log.walletType} wallet</span>
                            )}
                          </td>
                          <td>
                            {(log.oldValues || log.newValues) && (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => {
                                  alert(`Old Values: ${JSON.stringify(log.oldValues, null, 2)}\n\nNew Values: ${JSON.stringify(log.newValues, null, 2)}`);
                                }}
                              >
                                View Changes
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-data">
                          No activity logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {logsPagination.total > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setLogsPage(logsPage - 1)}
                    disabled={logsPage <= 1}
                    className="btn btn-outline"
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {logsPagination.current} of {logsPagination.total}
                  </span>
                  <button
                    onClick={() => setLogsPage(logsPage + 1)}
                    disabled={logsPage >= logsPagination.total}
                    className="btn btn-outline"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Load activity logs when tab is active
  useEffect(() => {
    if (activeTab === 'activity-logs') {
      fetchActivityLogs();
    }
  }, [activeTab, logsPage, logsFilter]);

  // Refresh logs when filters change
  useEffect(() => {
    if (activeTab === 'activity-logs') {
      setLogsPage(1);
      fetchActivityLogs();
    }
  }, [logsFilter]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'investments':
        return renderInvestmentsTab();
      case 'transactions':
        return renderTransactionsTab();
      case 'payout-requests':
        return renderPayoutRequestsTab();
      case 'payment-approvals':
        return renderPaymentApprovalsTab();
      case 'registration-links':
        return <RegistrationLinkManager />;
      case 'encashment-settings':
        return renderEncashmentSettingsTab();
      case 'activity-logs':
        return renderActivityLogsTab();
      default:
        return renderOverviewTab();
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
    setSelectedItems([]);
  }, [activeTab]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Mining Trade Finance Admin Dashboard</h1>
        <div className="admin-info">
          <span>Welcome, Administrator</span>
          <button className="logout-btn">Logout</button>
        </div>
      </div>

      <AdminWalletDisplay />

      <nav className="admin-nav">
        <button
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`nav-tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          Investments
        </button>
        <button
          className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`nav-tab ${activeTab === 'payout-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('payout-requests')}
        >
          Payout Requests
        </button>
        <button
          className={`nav-tab ${activeTab === 'payment-approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment-approvals')}
        >
          Payment Approvals
        </button>
        <button
          className={`nav-tab ${activeTab === 'registration-links' ? 'active' : ''}`}
          onClick={() => setActiveTab('registration-links')}
        >
          Registration Links
        </button>
        <button
          className={`nav-tab ${activeTab === 'encashment-settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('encashment-settings')}
        >
          Encashment Settings
        </button>
        <button
          className={`nav-tab ${activeTab === 'activity-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity-logs')}
        >
          Activity Logs
        </button>
      </nav>

      <main className="admin-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;