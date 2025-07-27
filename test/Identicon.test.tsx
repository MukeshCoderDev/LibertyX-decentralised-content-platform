import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Identicon, SimpleIdenticon, useIdenticonColors, generateIdenticonDataUrl } from '../components/ui/Identicon';

// Mock wallet addresses for testing
const testAddresses = {
  valid: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
  short: '0x123456',
  empty: '',
  invalid: 'invalid-address',
};

describe('Identicon', () => {
  describe('Basic Rendering', () => {
    it('should render with valid address', () => {
      render(<Identicon address={testAddresses.valid} />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toBeInTheDocument();
      expect(identicon).toHaveAttribute('aria-label', `Identicon for address ${testAddresses.valid}`);
    });

    it('should render with fallback for empty address', () => {
      render(<Identicon address={testAddresses.empty} />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toBeInTheDocument();
    });

    it('should render with fallback for invalid address', () => {
      render(<Identicon address={testAddresses.invalid} />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} size="small" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-8', 'h-8');
    });

    it('should apply medium size classes (default)', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-12', 'h-12');
    });

    it('should apply large size classes', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} size="large" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-16', 'h-16');
    });

    it('should apply xl size classes', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} size="xl" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-20', 'h-20');
    });
  });

  describe('Shape Variants', () => {
    it('should apply circle shape (default)', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('rounded-full');
    });

    it('should apply square shape', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} shape="square" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('rounded-none');
    });

    it('should apply rounded shape', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} shape="rounded" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('rounded-lg');
    });
  });

  describe('Style Variants', () => {
    it('should render geometric style (default)', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} style="geometric" />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
    });

    it('should render blockies style', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} style="blockies" />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render gradient style with initials', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} style="gradient" />
      );
      
      const initialsDiv = container.querySelector('div > div');
      expect(initialsDiv).toBeInTheDocument();
      expect(initialsDiv).toHaveTextContent('74'); // First 2 chars after 0x
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Identicon address={testAddresses.valid} />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toHaveAttribute('aria-label', `Identicon for address ${testAddresses.valid}`);
      expect(identicon).toHaveAttribute('title', `Generated avatar for ${testAddresses.valid}`);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Identicon address={testAddresses.valid} className="custom-class" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('custom-class');
    });
  });

  describe('Consistency', () => {
    it('should generate same pattern for same address', () => {
      const { container: container1 } = render(
        <Identicon address={testAddresses.valid} />
      );
      const { container: container2 } = render(
        <Identicon address={testAddresses.valid} />
      );
      
      // Both should have the same structure
      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it('should generate different patterns for different addresses', () => {
      const { container: container1 } = render(
        <Identicon address="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4" />
      );
      const { container: container2 } = render(
        <Identicon address="0x123456789abcdef123456789abcdef123456789a" />
      );
      
      // Should have different content
      expect(container1.innerHTML).not.toBe(container2.innerHTML);
    });
  });
});

describe('SimpleIdenticon', () => {
  describe('Basic Rendering', () => {
    it('should render with initials from address', () => {
      render(<SimpleIdenticon address={testAddresses.valid} />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toBeInTheDocument();
      expect(identicon).toHaveTextContent('74'); // First 2 chars after 0x
    });

    it('should render fallback for empty address', () => {
      render(<SimpleIdenticon address="" />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toHaveTextContent('??');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(
        <SimpleIdenticon address={testAddresses.valid} size="small" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-8', 'h-8', 'text-xs');
    });

    it('should apply medium size classes (default)', () => {
      const { container } = render(
        <SimpleIdenticon address={testAddresses.valid} />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-12', 'h-12', 'text-sm');
    });

    it('should apply large size classes', () => {
      const { container } = render(
        <SimpleIdenticon address={testAddresses.valid} size="large" />
      );
      
      const identicon = container.firstChild as HTMLElement;
      expect(identicon).toHaveClass('w-16', 'h-16', 'text-lg');
    });
  });

  describe('Color Generation', () => {
    it('should have consistent background color for same address', () => {
      const { container: container1 } = render(
        <SimpleIdenticon address={testAddresses.valid} />
      );
      const { container: container2 } = render(
        <SimpleIdenticon address={testAddresses.valid} />
      );
      
      const identicon1 = container1.firstChild as HTMLElement;
      const identicon2 = container2.firstChild as HTMLElement;
      
      expect(identicon1.style.backgroundColor).toBe(identicon2.style.backgroundColor);
    });

    it('should have different colors for different addresses', () => {
      const { container: container1 } = render(
        <SimpleIdenticon address="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4" />
      );
      const { container: container2 } = render(
        <SimpleIdenticon address="0x123456789abcdef123456789abcdef123456789a" />
      );
      
      const identicon1 = container1.firstChild as HTMLElement;
      const identicon2 = container2.firstChild as HTMLElement;
      
      expect(identicon1.style.backgroundColor).not.toBe(identicon2.style.backgroundColor);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<SimpleIdenticon address={testAddresses.valid} />);
      
      const identicon = screen.getByRole('img');
      expect(identicon).toHaveAttribute('aria-label', `Simple identicon for address ${testAddresses.valid}`);
    });
  });
});

describe('useIdenticonColors', () => {
  // Testing custom hooks requires a test component wrapper
  const TestComponent: React.FC<{ address: string }> = ({ address }) => {
    const colors = useIdenticonColors(address);
    return (
      <div>
        <div data-testid="primary">{colors.primary}</div>
        <div data-testid="secondary">{colors.secondary}</div>
        <div data-testid="accent">{colors.accent}</div>
        <div data-testid="background">{colors.background}</div>
      </div>
    );
  };

  it('should return consistent colors for same address', () => {
    const { rerender } = render(<TestComponent address={testAddresses.valid} />);
    
    const primary1 = screen.getByTestId('primary').textContent;
    const secondary1 = screen.getByTestId('secondary').textContent;
    
    rerender(<TestComponent address={testAddresses.valid} />);
    
    const primary2 = screen.getByTestId('primary').textContent;
    const secondary2 = screen.getByTestId('secondary').textContent;
    
    expect(primary1).toBe(primary2);
    expect(secondary1).toBe(secondary2);
  });

  it('should return different colors for different addresses', () => {
    const { rerender } = render(<TestComponent address="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4" />);
    
    const primary1 = screen.getByTestId('primary').textContent;
    
    rerender(<TestComponent address="0x123456789abcdef123456789abcdef123456789a" />);
    
    const primary2 = screen.getByTestId('primary').textContent;
    
    expect(primary1).not.toBe(primary2);
  });

  it('should return fallback colors for invalid address', () => {
    render(<TestComponent address="" />);
    
    expect(screen.getByTestId('primary')).toHaveTextContent('#6366f1');
    expect(screen.getByTestId('secondary')).toHaveTextContent('#8b5cf6');
    expect(screen.getByTestId('accent')).toHaveTextContent('#ec4899');
    expect(screen.getByTestId('background')).toHaveTextContent('#1f2937');
  });
});

describe('generateIdenticonDataUrl', () => {
  it('should generate data URL for valid address', () => {
    const dataUrl = generateIdenticonDataUrl(testAddresses.valid);
    expect(dataUrl).toMatch(/^data:image\/(png|svg\+xml);base64,/);
  });

  it('should generate different data URLs for different addresses', () => {
    const dataUrl1 = generateIdenticonDataUrl('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4');
    const dataUrl2 = generateIdenticonDataUrl('0x123456789abcdef123456789abcdef123456789a');
    
    expect(dataUrl1).not.toBe(dataUrl2);
  });

  it('should respect size parameter', () => {
    const dataUrl64 = generateIdenticonDataUrl(testAddresses.valid, 64);
    const dataUrl128 = generateIdenticonDataUrl(testAddresses.valid, 128);
    
    // Both should be valid data URLs but different due to size
    expect(dataUrl64).toMatch(/^data:image\/(png|svg\+xml);base64,/);
    expect(dataUrl128).toMatch(/^data:image\/(png|svg\+xml);base64,/);
    expect(dataUrl64).not.toBe(dataUrl128);
  });
});