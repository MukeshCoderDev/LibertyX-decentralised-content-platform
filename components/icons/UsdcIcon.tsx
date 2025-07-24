import React from 'react';

const UsdcIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${className} text-[#2775CA]`}>
    <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1.29 5.49a.85.85 0 00-1.53.11.85.85 0 00.77.85 2.5 2.5 0 012.4 2.84 2.5 2.5 0 01-2.4 2.16 2.5 2.5 0 01-2.4-2.16.85.85 0 00-1.63-.3 4.2 4.2 0 004.03 3.66 4.2 4.2 0 004.03-4.86 4.2 4.2 0 00-3.27-2.36z" />
  </svg>
);

export default UsdcIcon;
