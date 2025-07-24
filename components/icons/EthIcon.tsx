import React from 'react';

const EthIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 1.75l-6.25 10.5L12 22.25l6.25-10L12 1.75zM12 4.2l4.13 7.3-4.13 2.48L12 4.2zM7.87 11.5L12 13.98l4.13-2.48L12 4.2 7.87 11.5zM12 19.53l-4.13-7.3L12 14.7l4.13-2.48L12 19.53z"/>
  </svg>
);

export default EthIcon;
