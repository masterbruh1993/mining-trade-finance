import React from 'react';
import './DashboardCharts.css';

const DashboardCharts = ({ 
  stats, 
  dashboardData, 
  depositsVsWithdrawals, 
  investmentPerformance, 
  recentActivity, 
  memberEngagement, 
  dailySalesLogs,
  depositsWithdrawalsFilter,
  onDepositsWithdrawalsFilterChange,
  depositsWithdrawalsLoading
}) => {
  // Use real data from props
  const depositsData = depositsVsWithdrawals || {
    deposits: 0,
    withdrawals: 0,
    netFlow: 0,
    depositsCount: 0,
    withdrawalsCount: 0,
    timeframe: 'all'
  };

  const activeVsInactive = memberEngagement || {
    activeUsers: 0,
    inactiveUsers: 0,
    engagementRate: 0,
    totalMembers: 0
  };

  // Calculate percentages for visual representation
  const totalTransactions = depositsData.deposits + depositsData.withdrawals;
  const depositPercentage = totalTransactions > 0 ? (depositsData.deposits / totalTransactions) * 100 : 0;
  const withdrawalPercentage = totalTransactions > 0 ? (depositsData.withdrawals / totalTransactions) * 100 : 0;

  const totalUsers = activeVsInactive.activeUsers + activeVsInactive.inactiveUsers;
  const activePercentage = totalUsers > 0 ? (activeVsInactive.activeUsers / totalUsers) * 100 : 0;
  const inactivePercentage = totalUsers > 0 ? (activeVsInactive.inactiveUsers / totalUsers) * 100 : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        {/* Deposits vs Withdrawals Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Deposits vs Withdrawals</h3>
            <p>Financial flow comparison</p>
            <div className="chart-controls">
              <select 
                value={depositsWithdrawalsFilter} 
                onChange={(e) => onDepositsWithdrawalsFilterChange(e.target.value)}
                className="timeframe-select"
                disabled={depositsWithdrawalsLoading}
              >
                <option value="all">All Time</option>
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              {depositsWithdrawalsLoading && <span className="loading-indicator">Loading...</span>}
            </div>
          </div>
          <div className="chart-content">
            <div className="bar-chart">
              <div className="bar-container">
                <div className="bar-label">Deposits</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar deposits-bar" 
                    style={{ width: `${depositPercentage}%` }}
                  ></div>
                  <span className="bar-value">{formatCurrency(depositsData.deposits)}</span>
                </div>
              </div>
              <div className="bar-container">
                <div className="bar-label">Withdrawals</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar withdrawals-bar" 
                    style={{ width: `${withdrawalPercentage}%` }}
                  ></div>
                  <span className="bar-value">{formatCurrency(depositsData.withdrawals)}</span>
                </div>
              </div>
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Net Flow:</span>
                <span className={`summary-value ${depositsData.netFlow >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(depositsData.netFlow)}
                </span>
              </div>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Deposits:</span>
                  <span className="stat-value">{depositsData.depositsCount} transactions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Withdrawals:</span>
                  <span className="stat-value">{depositsData.withdrawalsCount} transactions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active vs Inactive Members Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Active vs Inactive Members</h3>
            <p>User engagement overview</p>
          </div>
          <div className="chart-content">
            <div className="donut-chart">
              <div className="donut-container">
                <svg viewBox="0 0 100 100" className="donut-svg">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255, 71, 87, 0.3)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#00ff88"
                    strokeWidth="10"
                    strokeDasharray={`${(activePercentage / 100) * 251.2} 251.2`}
                    strokeDashoffset="62.8"
                    transform="rotate(-90 50 50)"
                    className="donut-active"
                  />
                </svg>
                <div className="donut-center">
                  <div className="donut-percentage">{Math.round(activePercentage)}%</div>
                  <div className="donut-label">Active</div>
                </div>
              </div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color active-color"></div>
                <span className="legend-text">Active Users: {activeVsInactive.activeUsers}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color inactive-color"></div>
                <span className="legend-text">Inactive Users: {activeVsInactive.inactiveUsers}</span>
              </div>
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Total Members:</span>
                <span className="summary-value">{totalUsers}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Engagement Rate:</span>
                <span className={`summary-value ${activePercentage >= 70 ? 'positive' : activePercentage >= 50 ? 'neutral' : 'negative'}`}>
                  {Math.round(activePercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Performance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Investment Performance</h3>
            <p>Returns and growth metrics</p>
          </div>
          <div className="chart-content">
            <div className="metric-grid">
              <div className="metric-item">
                <div className="metric-value">{formatCurrency(investmentPerformance?.totalInvestments || 0)}</div>
                <div className="metric-label">Total Investments</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{formatCurrency(investmentPerformance?.totalReturns || 0)}</div>
                <div className="metric-label">Total Returns</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">
                  {investmentPerformance?.roi ? `${investmentPerformance.roi.toFixed(1)}%` : '0%'}
                </div>
                <div className="metric-label">ROI</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{investmentPerformance?.activeInvestments || 0}</div>
                <div className="metric-label">Active Investments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Recent Activity</h3>
            <p>Platform usage trends</p>
          </div>
          <div className="chart-content">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon pending">⏳</div>
                <div className="activity-details">
                  <div className="activity-title">Pending Transactions</div>
                  <div className="activity-count">{recentActivity?.pendingTransactions || 0}</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon payout">💰</div>
                <div className="activity-details">
                  <div className="activity-title">Payout Requests</div>
                  <div className="activity-count">{recentActivity?.payoutRequests || 0}</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon approval">✅</div>
                <div className="activity-details">
                  <div className="activity-title">Payment Approvals</div>
                  <div className="activity-count">{stats.pendingApprovals || 0}</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon users">👥</div>
                <div className="activity-details">
                  <div className="activity-title">New Users Today</div>
                  <div className="activity-count">{recentActivity?.newUsersToday || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;