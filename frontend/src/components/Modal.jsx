import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white rounded-2xl shadow-2xl relative w-full max-w-md mx-4 flex flex-col items-center p-0">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="w-full px-8 py-8 flex flex-col items-center">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 