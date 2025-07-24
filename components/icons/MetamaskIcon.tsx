import React from 'react';

const MetamaskIcon: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
    <svg className={className} viewBox="0 0 118 118" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="59" cy="59" r="59" fill="#1A1A1D"/>
        {/* A simplified representation of the MetaMask fox */}
        <path d="M78.6,35.5l-8.5,8.8l-5.6-3.3l5.4-8C70,33,70,33,78.6,35.5z" fill="#E2761B"/>
        <path d="M43.8,35.5l8.5,8.8l5.6-3.3l-5.4-8C52.4,33,52.4,33,43.8,35.5z" fill="#E4761B"/>
        <path d="M83.4,45.4l-11.2,5.2l-2.6,4.6l7.8,4.1C77.4,59.3,83.4,45.4,83.4,45.4z" fill="#E4761B"/>
        <path d="M39,45.4l11.2,5.2l2.6,4.6l-7.8,4.1C45,59.3,39,45.4,39,45.4z" fill="#E4761B"/>
        <path d="M81.5,61.9L73,68.2l0.2,9.3l12-3.8C85.2,73.7,81.5,61.9,81.5,61.9z" fill="#E4761B"/>
        <path d="M41,61.9L49.5,68.2l-0.2,9.3L37.2,73.7C37.2,73.7,41,61.9,41,61.9z" fill="#E4761B"/>
        <path d="M59.2,77.5l-7.7-4.3l-1.3-4.7l-4.9,2.5l2.6,10.3l10.9,3.4L59.2,77.5z" fill="#D7C1B3"/>
        <path d="M63.2,77.5l7.7-4.3l1.3-4.7l4.9,2.5l-2.6,10.3l-10.9,3.4L63.2,77.5z" fill="#D7C1B3"/>
        <path d="M59.2,51.8l-1.9,1.7l-0.6,3.6l2.5,1.2l2.5-1.2l-0.6-3.6L59.2,51.8z" fill="#233447"/>
        <path d="M51.1,58.7l5.3,2.9v1.9l-5.3-2.6L51.1,58.7z" fill="#E4761B"/>
        <path d="M71.3,58.7L66,61.6v-1.9l5.3,2.6L71.3,58.7z" fill="#E4761B"/>
    </svg>
);

export default MetamaskIcon;
