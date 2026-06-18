import React from 'react';

const AuthenForm = ({ title, children, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center' }}>{title}</h3>
      {children}
    </form>
  );
};

export default AuthenForm;
