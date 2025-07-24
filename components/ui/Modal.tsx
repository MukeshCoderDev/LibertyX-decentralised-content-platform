import React from 'react';
import CloseIcon from '../icons/CloseIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-6 md:p-8 w-full max-w-md m-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-satoshi font-bold">{title}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white">
                <CloseIcon />
            </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
