import React from 'react';
import './AnimatedCircularFrame.css';
import '../styles/PlasmaAura.css';
import performanceDetector from '../utils/performanceDetection';

const AnimatedCircularFrame = ({ children, isLoading = false, className = '' }) => {
  const shouldUseFallback = performanceDetector.shouldUseFallback();
  
  if (shouldUseFallback) {
    return (
      <div className={`circular-frame large-frame fallback ${className}`}>
        {/* Static Plasma Aura for low-performance devices */}
        <div className="plasma-aura fallback">
          {/* Simple static glow effect for low-performance devices */}
          <div className="energy-particles">
            <div className="energy-particle small green" style={{opacity: 0.6}}></div>
            <div className="energy-particle medium cyan" style={{opacity: 0.8}}></div>
            <div className="energy-particle small cyan" style={{opacity: 0.5}}></div>
            <div className="energy-particle large green" style={{opacity: 0.7}}></div>
            <div className="energy-particle small green" style={{opacity: 0.6}}></div>
          </div>
        </div>
        <div className="frame-content">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`circular-frame large-frame animated ${className} ${isLoading ? 'loading' : ''}`}>
      {/* Plasma Aura Effect */}
      <div className="plasma-aura">
        <div className="plasma-ring"></div>
        <div className="plasma-ring-secondary"></div>
        <div className="energy-ring-rotating"></div>
        <div className="electric-flicker"></div>
        <div className="plasma-glow"></div>
        <div className="energy-particles">
            <div className="energy-particle small green"></div>
            <div className="energy-particle medium cyan"></div>
            <div className="energy-particle small cyan"></div>
            <div className="energy-particle large green"></div>
            <div className="energy-particle twinkle cyan"></div>
            <div className="energy-particle small green"></div>
            <div className="energy-particle medium green"></div>
            <div className="energy-particle twinkle green"></div>
            <div className="energy-particle small cyan"></div>
            <div className="energy-particle large cyan"></div>
          </div>
      </div>
      
      {/* Running lights around the circle */}
      <div className="running-lights"></div>
      
      {/* Main circle border */}
      <div className="main-circle-border"></div>
      
      {/* Scanning lines effect */}
      <div className="scan-lines">
        <div className="scan-line scan-line-1"></div>
        <div className="scan-line scan-line-2"></div>
        <div className="scan-line scan-line-3"></div>
      </div>
      
      {/* Particle effects */}
      <div className="particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
      </div>
      
      {/* Loading effect */}
      <div className="loading-effect">
        <div className="loading-ring">
          <div className="loading-segment segment-1"></div>
          <div className="loading-segment segment-2"></div>
          <div className="loading-segment segment-3"></div>
          <div className="loading-segment segment-4"></div>
          <div className="loading-segment segment-5"></div>
          <div className="loading-segment segment-6"></div>
        </div>
        <div className="loading-dots">
          <div className="loading-dot dot-1"></div>
          <div className="loading-dot dot-2"></div>
          <div className="loading-dot dot-3"></div>
          <div className="loading-dot dot-4"></div>
        </div>
        <div className="loading-progress">
          <div className="progress-bar"></div>
        </div>
      </div>
      
      <div className="frame-content">
        {children}
      </div>
    </div>
  );
};

export default AnimatedCircularFrame;