import React, { useMemo } from 'react';

export interface IdenticonProps {
  address: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  className?: string;
  shape?: 'circle' | 'square' | 'rounded';
  style?: 'geometric' | 'blockies' | 'gradient';
}

/**
 * Identicon component that generates consistent, recognizable patterns from wallet addresses
 * Provides visual representation for users without profile pictures
 */
export const Identicon: React.FC<IdenticonProps> = ({
  address,
  size = 'medium',
  className = '',
  shape = 'circle',
  style = 'geometric',
}) => {
  // Size configurations
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  // Shape configurations
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  // Generate consistent colors from address
  const colors = useMemo(() => {
    if (!address || address.length < 10) {
      return {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#1f2937',
      };
    }

    // Use address to generate consistent colors
    const hash = address.toLowerCase().replace('0x', '');
    
    // Generate primary color from first 6 characters
    const primaryHue = parseInt(hash.substring(0, 2), 16) % 360;
    const primary = `hsl(${primaryHue}, 70%, 60%)`;
    
    // Generate secondary color from middle characters
    const secondaryHue = parseInt(hash.substring(6, 8), 16) % 360;
    const secondary = `hsl(${secondaryHue}, 65%, 55%)`;
    
    // Generate accent color from last characters
    const accentHue = parseInt(hash.substring(hash.length - 2), 16) % 360;
    const accent = `hsl(${accentHue}, 75%, 65%)`;
    
    // Background based on address length and content
    const bgLightness = (parseInt(hash.substring(2, 4), 16) % 30) + 15;
    const background = `hsl(${primaryHue}, 20%, ${bgLightness}%)`;

    return { primary, secondary, accent, background };
  }, [address]);

  // Generate pattern data from address
  const patternData = useMemo(() => {
    if (!address || address.length < 10) {
      return Array(25).fill(0).map((_, i) => i % 3);
    }

    const hash = address.toLowerCase().replace('0x', '');
    const data = [];
    
    // Create 5x5 grid pattern
    for (let i = 0; i < 25; i++) {
      const charIndex = i % hash.length;
      const value = parseInt(hash[charIndex], 16) % 4;
      data.push(value);
    }
    
    return data;
  }, [address]);

  // Render geometric style identicon
  const renderGeometric = () => {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id={`gradient-${address}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.accent} />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="100" height="100" fill={colors.background} />
        
        {/* Pattern grid */}
        {patternData.map((value, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const x = col * 20;
          const y = row * 20;
          
          if (value === 0) return null;
          
          const fillColor = value === 1 ? colors.primary : 
                           value === 2 ? colors.secondary : colors.accent;
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width="20"
              height="20"
              fill={fillColor}
              opacity={0.8}
            />
          );
        })}
        
        {/* Overlay pattern */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke={colors.accent}
          strokeWidth="2"
          opacity={0.6}
        />
      </svg>
    );
  };

  // Render blockies style identicon
  const renderBlockies = () => {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="absolute inset-0"
      >
        {/* Background */}
        <rect width="100" height="100" fill={colors.background} />
        
        {/* Blockies pattern */}
        {patternData.map((value, index) => {
          const row = Math.floor(index / 5);
          const col = index % 5;
          const x = col * 20;
          const y = row * 20;
          
          if (value === 0) return null;
          
          const fillColor = value === 1 ? colors.primary : 
                           value === 2 ? colors.secondary : colors.accent;
          
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width="20"
              height="20"
              fill={fillColor}
            />
          );
        })}
      </svg>
    );
  };

  // Render gradient style identicon
  const renderGradient = () => {
    const initials = address ? address.substring(2, 4).toUpperCase() : '??';
    
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-white font-bold"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
        }}
      >
        <span className={`${
          size === 'small' ? 'text-xs' :
          size === 'medium' ? 'text-sm' :
          size === 'large' ? 'text-lg' : 'text-xl'
        } font-mono`}>
          {initials}
        </span>
      </div>
    );
  };

  const renderPattern = () => {
    switch (style) {
      case 'blockies':
        return renderBlockies();
      case 'gradient':
        return renderGradient();
      case 'geometric':
      default:
        return renderGeometric();
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden border-2 border-gray-600
        ${sizeClasses[size]} ${shapeClasses[shape]} ${className}
      `}
      role="img"
      aria-label={`Identicon for address ${address}`}
      title={`Generated avatar for ${address}`}
    >
      {renderPattern()}
    </div>
  );
};

/**
 * Simple circular identicon with just initials
 */
export const SimpleIdenticon: React.FC<{
  address: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ address, size = 'medium', className = '' }) => {
  const colors = useMemo(() => {
    if (!address || address.length < 6) {
      return { bg: '#6366f1', text: '#ffffff' };
    }

    const hash = address.toLowerCase().replace('0x', '');
    const hue = parseInt(hash.substring(0, 2), 16) % 360;
    const bg = `hsl(${hue}, 70%, 50%)`;
    
    return { bg, text: '#ffffff' };
  }, [address]);

  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-lg',
  };

  const initials = address ? address.substring(2, 4).toUpperCase() : '??';

  return (
    <div
      className={`
        flex items-center justify-center rounded-full font-bold font-mono
        ${sizeClasses[size]} ${className}
      `}
      style={{ backgroundColor: colors.bg, color: colors.text }}
      role="img"
      aria-label={`Simple identicon for address ${address}`}
    >
      {initials}
    </div>
  );
};

/**
 * Hook to generate identicon colors from address
 */
export const useIdenticonColors = (address: string) => {
  return useMemo(() => {
    if (!address || address.length < 10) {
      return {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#1f2937',
      };
    }

    const hash = address.toLowerCase().replace('0x', '');
    
    const primaryHue = parseInt(hash.substring(0, 2), 16) % 360;
    const primary = `hsl(${primaryHue}, 70%, 60%)`;
    
    const secondaryHue = parseInt(hash.substring(6, 8), 16) % 360;
    const secondary = `hsl(${secondaryHue}, 65%, 55%)`;
    
    const accentHue = parseInt(hash.substring(hash.length - 2), 16) % 360;
    const accent = `hsl(${accentHue}, 75%, 65%)`;
    
    const bgLightness = (parseInt(hash.substring(2, 4), 16) % 30) + 15;
    const background = `hsl(${primaryHue}, 20%, ${bgLightness}%)`;

    return { primary, secondary, accent, background };
  }, [address]);
};

/**
 * Utility function to generate identicon data URL for use in img src
 */
export const generateIdenticonDataUrl = (
  address: string,
  size: number = 64,
  style: 'geometric' | 'blockies' | 'gradient' = 'geometric'
): string => {
  try {
    // This would typically generate an actual data URL
    // For now, return a placeholder that could be implemented with canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    // Simple implementation - in a real app you'd render the full pattern
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const hash = address.toLowerCase().replace('0x', '');
      const hue = parseInt(hash.substring(0, 2), 16) % 360;
      
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(0, 0, size, size);
      
      ctx.fillStyle = 'white';
      ctx.font = `${size / 3}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hash.substring(0, 2).toUpperCase(), size / 2, size / 2);
      
      return canvas.toDataURL();
    }
  } catch (error) {
    // Fallback for test environments or when canvas is not available
    console.warn('Canvas not available, returning fallback data URL');
  }
  
  // Fallback data URL for test environments
  const hash = address.toLowerCase().replace('0x', '');
  const hue = parseInt(hash.substring(0, 2), 16) % 360;
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="hsl(${hue}, 70%, 50%)"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="monospace" font-size="${size / 3}">
        ${hash.substring(0, 2).toUpperCase()}
      </text>
    </svg>
  `)}`;
};

export default Identicon;