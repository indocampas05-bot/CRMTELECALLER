import React from 'react';
import './StatsCard.css';

const StatsCard = ({ icon, label, value, color }) => {
  return (
    <div className="stats-card" style={{ borderTop: `3px solid ${color || 'var(--primary)'}` }}>
      <div className="stats-icon" style={{ color: color || 'var(--primary)' }}>{icon}</div>
      <div className="stats-body">
        <div className="stats-value">{value}</div>
        <div className="stats-label">{label}</div>
      </div>
    </div>
  );
};

export default StatsCard;
