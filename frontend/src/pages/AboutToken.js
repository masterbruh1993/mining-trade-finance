import React from 'react';
import './AboutToken.css';

const AboutToken = () => {
  return (
    <div className="about-token-container">
      <div className="about-token-header">
        <h1>About Mining Trade Finance Token</h1>
        <p>Discover the future of decentralized trading and investment</p>
      </div>

      <div className="about-token-content">
        <section className="token-overview">
          <h2>Project Overview</h2>
          <p>
            Mining Trade Finance is a revolutionary decentralized trading platform that combines 
            cutting-edge blockchain technology with traditional investment strategies. 
            Our token represents a new era of financial freedom and democratized access 
            to global markets.
          </p>
        </section>

        <section className="key-features">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>High Performance</h3>
              <p>Lightning-fast transactions with minimal fees on our optimized blockchain infrastructure.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Transparent</h3>
              <p>Military-grade security protocols ensure your investments are protected at all times.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Profitable Returns</h3>
              <p>Competitive ROI with multiple investment tiers to suit different risk appetites.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Global Access</h3>
              <p>Trade and invest from anywhere in the world with our decentralized platform.</p>
            </div>
          </div>
        </section>

        <section className="token-utility">
          <h2>Token Utility</h2>
          <div className="utility-list">
            <div className="utility-item">
              <h4>Investment Activation</h4>
              <p>Use tokens to activate investment contracts and start earning returns</p>
            </div>
            <div className="utility-item">
              <h4>Platform Governance</h4>
              <p>Participate in platform decisions and vote on important proposals</p>
            </div>
            <div className="utility-item">
              <h4>Staking Rewards</h4>
              <p>Stake your tokens to earn additional rewards and platform benefits</p>
            </div>
            <div className="utility-item">
              <h4>Trading Fees</h4>
              <p>Reduced trading fees for token holders on our exchange platform</p>
            </div>
          </div>
        </section>

        <section className="technology">
          <h2>Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <h4>Blockchain</h4>
              <p>Built on Ethereum with Layer 2 scaling solutions</p>
            </div>
            <div className="tech-item">
              <h4>Smart Contracts</h4>
              <p>Audited smart contracts ensuring transparency and security</p>
            </div>
            <div className="tech-item">
              <h4>DeFi Integration</h4>
              <p>Seamless integration with major DeFi protocols</p>
            </div>
            <div className="tech-item">
              <h4>Cross-Chain</h4>
              <p>Multi-chain compatibility for maximum accessibility</p>
            </div>
          </div>
        </section>

        <section className="team-vision">
          <h2>Our Vision</h2>
          <p>
            We envision a world where financial opportunities are accessible to everyone, 
            regardless of their geographical location or economic background. Mining Trade Finance 
            aims to bridge the gap between traditional finance and decentralized technologies, 
            creating a more inclusive and profitable ecosystem for all participants.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutToken;