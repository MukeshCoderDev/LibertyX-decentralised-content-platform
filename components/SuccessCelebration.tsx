import React, { useEffect, useState } from 'react';

interface SuccessCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({ show, onComplete }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate random particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setParticles(newParticles);

      // Auto complete after animation
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Confetti Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 animate-float"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            background: `hsl(${Math.random() * 360}, 70%, 60%)`
          }}
        />
      ))}

      {/* Success Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white bg-opacity-95 rounded-2xl p-8 shadow-2xl animate-uploadSuccess">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Uploaded to Arweave!
            </h2>
            <p className="text-gray-600">
              Your content is now permanent and decentralized
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Forever stored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessCelebration;