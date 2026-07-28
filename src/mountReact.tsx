import React from 'react';
import { createRoot } from 'react-dom/client';
import { AboutCreatorModal } from './AboutCreatorModal.tsx';

let root: any = null;

export function mountModal() {
  let container = document.getElementById('react-modal-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'react-modal-root';
    document.body.appendChild(container);
  }

  if (!root) {
    root = createRoot(container);
  }

  const handleClose = () => {
    root.render(<AboutCreatorModal isOpen={false} onClose={handleClose} />);
  };

  root.render(<AboutCreatorModal isOpen={true} onClose={handleClose} />);
}

// Make it available globally so inline scripts can trigger it easily
(window as any).showAboutCreator = mountModal;
