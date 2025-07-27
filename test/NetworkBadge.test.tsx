import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NetworkBadge, NetworkDot, NetworkStatus, useNetworkStatus } from '../components/ui/NetworkBadge';

describe('NetworkBadge', () => {
  describe('Connection States', () => {
    it('should show connected state', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
        />
      );
      
      expect(screen.getByText('Ethereum • Connected')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Ethereum network connected');
    });

    it('should show disconnected state', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={false}
        />
      );
      
      expect(screen.getByText('Ethereum • Disconnected')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Ethereum network disconnected');
    });

    it('should show connecting state', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={false}
          isConnecting={true}
        />
      );
      
      expect(screen.getByText('Ethereum • Connecting')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Ethereum network connecting');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          size="small"
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('gap-1.5');
      
      // Text size is applied to the inner span
      const textSpan = badge.querySelector('span');
      expect(textSpan).toHaveClass('text-xs');
    });

    it('should apply medium size classes (default)', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2');
      expect(badge).toHaveClass('py-1');
      expect(badge).toHaveClass('gap-2');
      
      // Text size is applied to the inner span
      const textSpan = badge.querySelector('span');
      expect(textSpan).toHaveClass('text-xs');
    });

    it('should apply large size classes', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          size="large"
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-3');
      expect(badge).toHaveClass('py-1.5');
      expect(badge).toHaveClass('gap-2');
      
      // Text size is applied to the inner span
      const textSpan = badge.querySelector('span');
      expect(textSpan).toHaveClass('text-sm');
    });
  });

  describe('Variants', () => {
    it('should render default variant with status text', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          variant="default"
        />
      );
      
      expect(screen.getByText('Ethereum • Connected')).toBeInTheDocument();
    });

    it('should render compact variant', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          variant="compact"
        />
      );
      
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    it('should render minimal variant', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          variant="minimal"
        />
      );
      
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
    });

    it('should hide network name when showNetworkName is false', () => {
      render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          showNetworkName={false}
        />
      );
      
      expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should apply connected styling', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-900/30', 'text-green-400', 'border-green-700/50');
    });

    it('should apply disconnected styling', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={false}
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-red-900/30', 'text-red-400', 'border-red-700/50');
    });

    it('should apply connecting styling with animation', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={false}
          isConnecting={true}
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-yellow-900/30', 'text-yellow-400', 'border-yellow-700/50');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <NetworkBadge
          networkName="Ethereum"
          isConnected={true}
          className="custom-class"
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });
  });
});

describe('NetworkDot', () => {
  it('should show green dot when connected', () => {
    const { container } = render(
      <NetworkDot isConnected={true} />
    );
    
    const dot = container.firstChild as HTMLElement;
    expect(dot).toHaveClass('bg-green-500');
    expect(dot).toHaveAttribute('aria-label', 'Connected');
  });

  it('should show red dot when disconnected', () => {
    const { container } = render(
      <NetworkDot isConnected={false} />
    );
    
    const dot = container.firstChild as HTMLElement;
    expect(dot).toHaveClass('bg-red-500');
    expect(dot).toHaveAttribute('aria-label', 'Disconnected');
  });

  it('should show yellow pulsing dot when connecting', () => {
    const { container } = render(
      <NetworkDot isConnected={false} isConnecting={true} />
    );
    
    const dot = container.firstChild as HTMLElement;
    expect(dot).toHaveClass('bg-yellow-500', 'animate-pulse');
    expect(dot).toHaveAttribute('aria-label', 'Connecting');
  });

  it('should apply different sizes', () => {
    const { rerender, container } = render(
      <NetworkDot isConnected={true} size="small" />
    );
    
    expect(container.firstChild).toHaveClass('w-1.5', 'h-1.5');

    rerender(<NetworkDot isConnected={true} size="medium" />);
    expect(container.firstChild).toHaveClass('w-2', 'h-2');

    rerender(<NetworkDot isConnected={true} size="large" />);
    expect(container.firstChild).toHaveClass('w-2.5', 'h-2.5');
  });
});

describe('NetworkStatus', () => {
  it('should display network name with status', () => {
    render(
      <NetworkStatus
        networkName="Sepolia"
        isConnected={true}
      />
    );
    
    expect(screen.getByText('Network:')).toBeInTheDocument();
    expect(screen.getByText('Sepolia')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should show connecting status', () => {
    render(
      <NetworkStatus
        networkName="Sepolia"
        isConnected={false}
        isConnecting={true}
      />
    );
    
    expect(screen.getByText('Connecting')).toBeInTheDocument();
  });

  it('should show disconnected status', () => {
    render(
      <NetworkStatus
        networkName="Sepolia"
        isConnected={false}
      />
    );
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <NetworkStatus
        networkName="Sepolia"
        isConnected={true}
        className="custom-status"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-status');
  });
});

describe('useNetworkStatus', () => {
  // Testing custom hooks requires a test component wrapper
  const TestComponent: React.FC<{
    isConnected: boolean;
    isConnecting?: boolean;
  }> = ({ isConnected, isConnecting = false }) => {
    const status = useNetworkStatus(isConnected, isConnecting);
    return (
      <div>
        <div data-testid="dot-color">{status.dotColor}</div>
        <div data-testid="text-color">{status.textColor}</div>
        <div data-testid="status-text">{status.statusText}</div>
      </div>
    );
  };

  it('should return connected status', () => {
    render(<TestComponent isConnected={true} />);
    
    expect(screen.getByTestId('dot-color')).toHaveTextContent('bg-green-500');
    expect(screen.getByTestId('text-color')).toHaveTextContent('text-green-400');
    expect(screen.getByTestId('status-text')).toHaveTextContent('Connected');
  });

  it('should return connecting status', () => {
    render(<TestComponent isConnected={false} isConnecting={true} />);
    
    expect(screen.getByTestId('dot-color')).toHaveTextContent('bg-yellow-500 animate-pulse');
    expect(screen.getByTestId('text-color')).toHaveTextContent('text-yellow-400');
    expect(screen.getByTestId('status-text')).toHaveTextContent('Connecting');
  });

  it('should return disconnected status', () => {
    render(<TestComponent isConnected={false} />);
    
    expect(screen.getByTestId('dot-color')).toHaveTextContent('bg-red-500');
    expect(screen.getByTestId('text-color')).toHaveTextContent('text-red-400');
    expect(screen.getByTestId('status-text')).toHaveTextContent('Disconnected');
  });
});