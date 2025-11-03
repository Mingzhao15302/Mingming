import React from 'react';

export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="glass-card modal-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="control-button" style={{ borderRadius: '50%' }} onClick={onClose}>
            ✕
          </button>
        </header>
        <div>{children}</div>
        {footer && <footer style={{ marginTop: '1.5rem' }}>{footer}</footer>}
      </div>
    </div>
  );
};

export default Modal;
