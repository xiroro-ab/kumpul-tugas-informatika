import React from 'react';
import { createRoot } from 'react-dom/client';
import { AboutCreatorModal } from './AboutCreatorModal.tsx';
import MpiModalContainer, { MpiViewerOptions } from './mpi/MpiModalContainer.tsx';
import { curriculumData } from './mpi/data/curriculum.ts';

let aboutRoot: any = null;
let mpiRoot: any = null;

export function mountModal() {
  let container = document.getElementById('react-modal-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'react-modal-root';
    document.body.appendChild(container);
  }

  if (!aboutRoot) {
    aboutRoot = createRoot(container);
  }

  const handleClose = () => {
    aboutRoot.render(<AboutCreatorModal isOpen={false} onClose={handleClose} />);
  };

  aboutRoot.render(<AboutCreatorModal isOpen={true} onClose={handleClose} />);
}

export function openMpiViewer(options?: MpiViewerOptions) {
  let container = document.getElementById('mpi-modal-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'mpi-modal-root';
    document.body.appendChild(container);
  }

  if (!mpiRoot) {
    mpiRoot = createRoot(container);
  }

  const handleClose = () => {
    mpiRoot.render(<MpiModalContainer isOpen={false} onClose={handleClose} />);
  };

  mpiRoot.render(<MpiModalContainer isOpen={true} onClose={handleClose} options={options} />);
}

export function closeMpiViewer() {
  if (mpiRoot) {
    mpiRoot.render(<MpiModalContainer isOpen={false} onClose={() => {}} />);
  }
}

// Make it available globally so inline scripts and vanilla JS can trigger it easily
(window as any).showAboutCreator = mountModal;
(window as any).openMpiViewer = openMpiViewer;
(window as any).closeMpiViewer = closeMpiViewer;
(window as any).getMpiCurriculum = () => curriculumData;
