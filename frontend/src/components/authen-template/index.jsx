import React from 'react';

const AuthenTemplate = ({ children }) => {
  return (
    <div className="auth-template-container" style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' }}>
      <div className="auth-card" style={{ padding: '2rem', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1890ff' }}>P2P Rental Platform</h2>
        {children}
      </div>
    </div>
  );
};

export default AuthenTemplate;
