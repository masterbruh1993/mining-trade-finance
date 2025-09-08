import React, { useState, useEffect } from 'react';
import './Captcha.css';

const Captcha = ({ onVerify, isVerified }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setCorrectAnswer(n1 + n2);
    setUserAnswer('');
    setError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleSubmit = () => {
    const answer = parseInt(userAnswer);
    
    if (answer === correctAnswer) {
      setError('');
      onVerify(true);
    } else {
      setError('Incorrect answer. Please try again.');
      onVerify(false);
      generateCaptcha();
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
    onVerify(false);
  };

  if (isVerified) {
    return (
      <div className="captcha-container verified">
        <div className="captcha-success">
          <span className="checkmark">✓</span>
          <span>Captcha Verified</span>
        </div>
      </div>
    );
  }

  return (
    <div className="captcha-container">
      <div className="captcha-header">
        <span>Security Verification</span>
        <button type="button" onClick={handleRefresh} className="refresh-btn">
          🔄
        </button>
      </div>
      
      <div className="captcha-form">
        <div className="captcha-question">
          <span className="math-expression">
            {num1} + {num2} = ?
          </span>
        </div>
        
        <div className="captcha-input-group">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Enter answer"
            className="captcha-input"
            required
          />
          <button type="button" onClick={handleSubmit} className="captcha-verify-btn">
            Verify
          </button>
        </div>
        
        {error && <div className="captcha-error">{error}</div>}
      </div>
    </div>
  );
};

export default Captcha;