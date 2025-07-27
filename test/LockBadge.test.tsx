import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LockBadge, LockBadgeText, useAccessRequirementText } from '../components/ui/LockBadge';

describe('LockBadge', () => {
  describe('Subscription Access', () => {
    it('should show subscription required when no access', () => {
      render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
        />
      );
      
      expect(screen.getByText('Subscribe Required')).toBeInTheDocument();
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should show subscribed when has access', () => {
      render(
        <LockBadge
          accessType="subscription"
          hasAccess={true}
        />
      );
      
      expect(screen.getByText('Subscribed')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('NFT Access', () => {
    it('should show NFT tier requirement when no access', () => {
      render(
        <LockBadge
          accessType="nft"
          hasAccess={false}
          tier={2}
        />
      );
      
      expect(screen.getByText('Need NFT Tier #2')).toBeInTheDocument();
      expect(screen.getByText('🎨')).toBeInTheDocument();
    });

    it('should show NFT tier when has access', () => {
      render(
        <LockBadge
          accessType="nft"
          hasAccess={true}
          tier={3}
        />
      );
      
      expect(screen.getByText('NFT Tier #3')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should default to tier 1 when no tier specified', () => {
      render(
        <LockBadge
          accessType="nft"
          hasAccess={false}
        />
      );
      
      expect(screen.getByText('Need NFT Tier #1')).toBeInTheDocument();
    });
  });

  describe('Premium Access', () => {
    it('should show premium required when no access', () => {
      render(
        <LockBadge
          accessType="premium"
          hasAccess={false}
        />
      );
      
      expect(screen.getByText('Premium Required')).toBeInTheDocument();
      expect(screen.getByText('💎')).toBeInTheDocument();
    });

    it('should show premium access when has access', () => {
      render(
        <LockBadge
          accessType="premium"
          hasAccess={true}
        />
      );
      
      expect(screen.getByText('Premium Access')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state', () => {
      render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
          isLoading={true}
        />
      );
      
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
          size="small"
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-xs', 'px-2', 'py-1');
    });

    it('should apply medium size classes (default)', () => {
      const { container } = render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-xs', 'px-3', 'py-1.5');
    });

    it('should apply large size classes', () => {
      const { container } = render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
          size="large"
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('text-sm', 'px-4', 'py-2');
    });
  });

  describe('Icon Display', () => {
    it('should show icon by default', () => {
      render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
        />
      );
      
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
          showIcon={false}
        />
      );
      
      expect(screen.queryByText('🔒')).not.toBeInTheDocument();
      expect(screen.getByText('Subscribe Required')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label for subscription', () => {
      render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
        />
      );
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'subscription access required');
    });

    it('should have proper aria-label when access granted', () => {
      render(
        <LockBadge
          accessType="nft"
          hasAccess={true}
          tier={2}
        />
      );
      
      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'nft access granted');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <LockBadge
          accessType="subscription"
          hasAccess={false}
          className="custom-class"
        />
      );
      
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });
  });
});

describe('LockBadgeText', () => {
  it('should show subscription required text', () => {
    render(
      <LockBadgeText
        accessType="subscription"
        hasAccess={false}
      />
    );
    
    expect(screen.getByText('Subscription required')).toBeInTheDocument();
  });

  it('should show NFT tier required text', () => {
    render(
      <LockBadgeText
        accessType="nft"
        hasAccess={false}
        tier={2}
      />
    );
    
    expect(screen.getByText('NFT Tier #2 required')).toBeInTheDocument();
  });

  it('should show premium required text', () => {
    render(
      <LockBadgeText
        accessType="premium"
        hasAccess={false}
      />
    );
    
    expect(screen.getByText('Premium access required')).toBeInTheDocument();
  });

  it('should not render when user has access', () => {
    const { container } = render(
      <LockBadgeText
        accessType="subscription"
        hasAccess={true}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should apply correct color classes', () => {
    const { rerender } = render(
      <LockBadgeText
        accessType="subscription"
        hasAccess={false}
      />
    );
    
    expect(screen.getByText('Subscription required')).toHaveClass('text-orange-300');

    rerender(
      <LockBadgeText
        accessType="nft"
        hasAccess={false}
        tier={1}
      />
    );
    
    expect(screen.getByText('NFT Tier #1 required')).toHaveClass('text-purple-300');

    rerender(
      <LockBadgeText
        accessType="premium"
        hasAccess={false}
      />
    );
    
    expect(screen.getByText('Premium access required')).toHaveClass('text-yellow-300');
  });
});

describe('useAccessRequirementText', () => {
  // Note: Testing custom hooks requires a test component wrapper
  // For now, we'll test the logic by creating a test component
  
  const TestComponent: React.FC<{
    accessType: 'subscription' | 'nft' | 'premium';
    tier?: number;
  }> = ({ accessType, tier }) => {
    const { fullText, shortText } = useAccessRequirementText(accessType, tier);
    return (
      <div>
        <div data-testid="full-text">{fullText}</div>
        <div data-testid="short-text">{shortText}</div>
      </div>
    );
  };

  it('should return correct text for subscription', () => {
    render(<TestComponent accessType="subscription" />);
    
    expect(screen.getByTestId('full-text')).toHaveTextContent('Subscribe to access this content');
    expect(screen.getByTestId('short-text')).toHaveTextContent('Subscription required');
  });

  it('should return correct text for NFT with tier', () => {
    render(<TestComponent accessType="nft" tier={3} />);
    
    expect(screen.getByTestId('full-text')).toHaveTextContent('Own NFT Tier #3 to access this content');
    expect(screen.getByTestId('short-text')).toHaveTextContent('Need NFT Tier #3');
  });

  it('should return correct text for premium', () => {
    render(<TestComponent accessType="premium" />);
    
    expect(screen.getByTestId('full-text')).toHaveTextContent('Premium subscription or NFT required to access this content');
    expect(screen.getByTestId('short-text')).toHaveTextContent('Premium required');
  });

  it('should default to tier 1 for NFT when no tier specified', () => {
    render(<TestComponent accessType="nft" />);
    
    expect(screen.getByTestId('full-text')).toHaveTextContent('Own NFT Tier #1 to access this content');
    expect(screen.getByTestId('short-text')).toHaveTextContent('Need NFT Tier #1');
  });
});