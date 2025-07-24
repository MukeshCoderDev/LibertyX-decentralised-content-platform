import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
    <div className={`font-satoshi font-bold text-3xl tracking-tighter ${className}`}>
        <span className="text-white">Liberty</span>
        <span className="text-primary">X</span>
    </div>
);

export default Logo;
