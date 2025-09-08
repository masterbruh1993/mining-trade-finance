import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({ isOpen, onClose, title, message, details }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="success-icon">✓</div>
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="success-message">{message}</p>
          
          {details && (
            <div className="success-details">
              <h3>Contract Details:</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Amount:</span>
                  <span className="value">₱{details.amount?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">15 days</span>
                </div>
                <div className="detail-item">
                  <span className="label">Payout:</span>
                  <span className="value">30% every 3 days</span>
                </div>
                <div className="detail-item">
                  <span className="label">Total ROI:</span>
                  <span className="value">150%</span>
                </div>
                <div className="detail-item">
                  <span className="label">Expected Return:</span>
                  <span className="value">₱{(details.amount * 1.5)?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Updated Balance:</span>
                  <span className="value">₱{details.updatedBalance?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="confirm-btn" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;