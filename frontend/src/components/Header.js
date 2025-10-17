import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <h1 className="brand-title">
            <span className="brand-icon">🚀</span>
            Amazon Optimizer
          </h1>
          <p className="brand-subtitle">AI-Powered Product Listing Enhancement</p>
        </div>
        
        <nav className="header-nav">
          <Link to="/" className={isActive('/')}>
            <span className="nav-icon">🔍</span>
            Optimizer
          </Link>
          <Link to="/history" className={isActive('/history')}>
            <span className="nav-icon">📊</span>
            History
          </Link>
          <Link to="/dashboard" className={isActive('/dashboard')}>
            <span className="nav-icon">📈</span>
            Analytics
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;