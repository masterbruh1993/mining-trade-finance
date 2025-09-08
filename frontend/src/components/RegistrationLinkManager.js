import React, { useState } from 'react';
import { useRegistrationLink } from '../context/RegistrationLinkContext';
import './RegistrationLinkManager.css';

const RegistrationLinkManager = () => {
  const {
    mainRegistrationLink,
    linkStats,
    loading,
    error,
    generateRegistrationLink,
    resetRegistrationLink,
    copyLinkToClipboard,
    clearError,
    formatDate,
    getConversionRate
  } = useRegistrationLink();

  const [copySuccess, setCopySuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleGenerateLink = () => {
    const newLink = generateRegistrationLink();
    if (newLink) {
      setCopySuccess(false);
    }
  };

  const handleCopyLink = async () => {
    if (mainRegistrationLink) {
      const success = await copyLinkToClipboard(mainRegistrationLink);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } else {
        alert('Failed to copy link to clipboard');
      }
    }
  };

  const handleResetLink = () => {
    resetRegistrationLink();
    setShowConfirmReset(false);
    setCopySuccess(false);
  };

  const getLinkStatus = () => {
    if (!mainRegistrationLink) return 'inactive';
    if (linkStats.totalClicks === 0) return 'unused';
    return 'active';
  };

  return (
    <div className="registration-link-manager">
      <div className="link-header">
        <div className="header-info">
          <div className="link-icon">
            <i className="fas fa-link"></i>
          </div>
          <div className="header-text">
            <h3>Main Registration Link</h3>
            <p>Generate and manage the primary registration link for new users</p>
          </div>
        </div>
        <div className={`link-status ${getLinkStatus()}`}>
          <span className="status-indicator"></span>
          {getLinkStatus().charAt(0).toUpperCase() + getLinkStatus().slice(1)}
        </div>
      </div>

      {error && (
        <div className="link-error">
          <span>{error}</span>
          <button onClick={clearError} className="btn-close-error">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {!mainRegistrationLink ? (
        <div className="no-link-state">
          <div className="no-link-icon">
            <i className="fas fa-plus-circle"></i>
          </div>
          <h4>No Registration Link Generated</h4>
          <p>Create a main registration link that new users can use to sign up without a referrer.</p>
          <button 
            className="btn-generate"
            onClick={handleGenerateLink}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i>
                Generate Registration Link
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="link-active-state">
          <div className="link-display">
            <div className="link-url">
              <input 
                type="text" 
                value={mainRegistrationLink} 
                readOnly 
                className="link-input"
              />
              <div className="link-actions">
                <button 
                  className={`btn-copy ${copySuccess ? 'success' : ''}`}
                  onClick={handleCopyLink}
                  title="Copy to clipboard"
                >
                  {copySuccess ? (
                    <>
                      <i className="fas fa-check"></i>
                      Copied!
                    </>
                  ) : (
                    <>
                      <i className="fas fa-copy"></i>
                      Copy
                    </>
                  )}
                </button>
                <button 
                  className="btn-reset"
                  onClick={() => setShowConfirmReset(true)}
                  title="Reset link"
                >
                  <i className="fas fa-redo"></i>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="link-statistics">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-mouse-pointer"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{linkStats.totalClicks}</div>
                  <div className="stat-label">Total Clicks</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-user-plus"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{linkStats.totalRegistrations}</div>
                  <div className="stat-label">Registrations</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{getConversionRate()}%</div>
                  <div className="stat-label">Conversion Rate</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{formatDate(linkStats.createdAt)}</div>
                  <div className="stat-label">Created</div>
                </div>
              </div>
            </div>
            
            <div className="last-used">
              <i className="fas fa-clock"></i>
              <span>Last used: {formatDate(linkStats.lastUsed)}</span>
            </div>
          </div>
        </div>
      )}

      {showConfirmReset && (
        <div className="confirm-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Reset Registration Link</h4>
              <button 
                className="btn-close-modal"
                onClick={() => setShowConfirmReset(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to reset the registration link?</p>
              <p className="warning-text">
                <i className="fas fa-exclamation-triangle"></i>
                This will invalidate the current link and reset all statistics.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-confirm-reset"
                onClick={handleResetLink}
              >
                <i className="fas fa-trash"></i>
                Reset Link
              </button>
              <button 
                className="btn-cancel-reset"
                onClick={() => setShowConfirmReset(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationLinkManager;