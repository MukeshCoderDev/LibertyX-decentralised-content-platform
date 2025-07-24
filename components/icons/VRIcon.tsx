import React from 'react';

const VRIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.59 6.21C20.21 5.79 19.67 5.5 19.06 5.5H4.94c-.61 0-1.15.29-1.53.71L1 12l2.41 6.29c.38.42.92.71 1.53.71h14.12c.61 0 1.15-.29 1.53-.71L23 12l-2.41-5.79zM11 15H9.5v-2H8V9h3v6zm5-1.5c0 .83-.67 1.5-1.5 1.5h-1.5V9H15c.83 0 1.5.67 1.5 1.5v3z"></path><path d="M15 10.5h-1.5v3H15v-3z"></path>
    </svg>
);

export default VRIcon;
