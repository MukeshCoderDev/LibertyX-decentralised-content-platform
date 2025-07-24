import React from 'react';

const ShareIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.583 15.318a2.25 2.25 0 0 1-3.366 0 2.25 2.25 0 0 1 3.366 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.833 7.818a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.25 8.625-3.375 1.95m-.375 3.375 3.375 1.95M14.25 15.375l-3.375-1.95" />
  </svg>
);

export default ShareIcon;
