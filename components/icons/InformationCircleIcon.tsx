import React from 'react';

interface InformationCircleIconProps {
  className?: string;
}

const InformationCircleIcon: React.FC<InformationCircleIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

export default InformationCircleIcon;