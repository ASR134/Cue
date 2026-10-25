import React from 'react';
import cueLogo from '../assets/cue-logo.png';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="brand-group">
        <img
          src={cueLogo}
          alt="Cue"
          className="brand-logo-img"
          width="20"
          height="20"
        />
        <span className="brand-wordmark">cue</span>
      </div>
    </header>
  );
};
