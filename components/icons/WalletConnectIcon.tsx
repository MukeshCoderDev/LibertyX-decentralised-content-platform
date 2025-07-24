import React from 'react';

const WalletConnectIcon: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#1A1A1D"/>
        <path d="M5.25 12.6875L8.4375 9.5L10.5 11.5625L13.125 9L15.25 10.9375L18.75 7.5" stroke="#3399FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 8V16C5 16.5523 5.44772 17 6 17H18C18.5523 17 19 16.5523 19 16V8C19 7.44772 18.5523 7 18 7H6C5.44772 7 5 7.44772 5 8Z" stroke="#3399FF" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
);

export default WalletConnectIcon;
