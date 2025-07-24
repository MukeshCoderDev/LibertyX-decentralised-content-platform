import React from 'react';
import LibertyIcon from '../icons/LibertyIcon';

const Confetti: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {Array.from({ length: 20 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute text-primary animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${1 + Math.random()}s`,
                        transform: `scale(${0.5 + Math.random()})`
                    }}
                >
                    <LibertyIcon className="w-5 h-5" />
                </div>
            ))}
        </div>
    );
};

export default Confetti;
