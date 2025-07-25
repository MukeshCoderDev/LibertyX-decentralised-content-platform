import React from 'react';

interface CheckCircleIconProps {
  className?: string;
}

const CheckCircleIcon: React.FC<CheckCircleIconProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

export default CheckCircleIcon;