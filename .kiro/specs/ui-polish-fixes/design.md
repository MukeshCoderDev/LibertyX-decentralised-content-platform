# Design Document

## Overview

This design addresses 11 critical UI/UX polish issues in the LibertyX decentralized content platform. The solution focuses on creating reusable utility functions, standardized components, and consistent styling patterns to ensure a professional and cohesive user experience across the platform.

## Architecture

### Component Architecture
The solution follows a utility-first approach with shared components and helper functions:

```
utils/
├── formatters.ts          # Token formatting, address shortening
├── identicon.ts          # Profile picture generation
└── validation.ts         # Balance validation helpers

components/
├── ui/
│   ├── LockBadge.tsx     # Unified access control badge
│   ├── NetworkBadge.tsx  # Clean network status indicator
│   └── Identicon.tsx     # Auto-generated profile pictures
└── shared/
    └── SearchInput.tsx   # Enhanced search component
```

### State Management
- Wallet balance validation will be handled through existing `useWallet` hook
- Component state will be managed locally where appropriate
- Shared formatting utilities will be pure functions for consistency

## Components and Interfaces

### 1. Token Formatting Utility

```typescript
// utils/formatters.ts
export interface TokenAmount {
  amount: string | number;
  symbol: string;
}

export const formatToken = (amount: string | number, symbol: string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${numAmount.toFixed(2)} ${symbol}`;
};

export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6).toLowerCase()}…${address.substring(address.length - 4).toLowerCase()}`;
};
```

### 2. LockBadge Component

```typescript
// components/ui/LockBadge.tsx
interface LockBadgeProps {
  tier?: number;
  accessType: 'subscription' | 'nft' | 'premium';
  hasAccess?: boolean;
  className?: string;
}

export const LockBadge: React.FC<LockBadgeProps> = ({
  tier,
  accessType,
  hasAccess = false,
  className = ''
}) => {
  // Unified badge component replacing multiple inconsistent labels
};
```

### 3. NetworkBadge Component

```typescript
// components/ui/NetworkBadge.tsx
interface NetworkBadgeProps {
  networkName: string;
  isConnected: boolean;
  className?: string;
}

export const NetworkBadge: React.FC<NetworkBadgeProps> = ({
  networkName,
  isConnected,
  className = ''
}) => {
  // Clean network status with green dot instead of bullet separator
};
```

### 4. Identicon Component

```typescript
// components/ui/Identicon.tsx
interface IdenticonProps {
  address: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Identicon: React.FC<IdenticonProps> = ({
  address,
  size = 'medium',
  className = ''
}) => {
  // Generate consistent identicons from wallet addresses
};
```

### 5. Enhanced Search Input

```typescript
// components/shared/SearchInput.tsx
interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search videos, creators, NFTs…",
  onSearch,
  className = ''
}) => {
  // Enhanced search with descriptive placeholder
};
```

## Data Models

### Balance Validation Model
```typescript
interface BalanceValidation {
  hasEnoughBalance: boolean;
  requiredAmount: number;
  currentBalance: number;
  tokenSymbol: string;
}
```

### Access Control Model
```typescript
interface AccessRequirement {
  type: 'subscription' | 'nft' | 'premium';
  tier?: number;
  creatorAddress?: string;
  hasAccess: boolean;
}
```

## Error Handling

### Balance Validation Errors
- Gracefully handle insufficient balance scenarios
- Provide clear user feedback through disabled states and tooltips
- Fallback to zero balance if wallet data is unavailable

### Data Loading States
- Show loading states for comment counts and engagement metrics
- Hide counters until data is fully loaded
- Provide fallback content for missing or invalid data

### Network Connection Issues
- Handle wallet disconnection gracefully
- Maintain consistent address formatting even with connection issues
- Provide appropriate fallbacks for network status display

## Testing Strategy

### Unit Tests
- Test token formatting utility functions with various input scenarios
- Test address shortening with different address formats
- Test identicon generation consistency
- Test balance validation logic

### Component Tests
- Test LockBadge component with different access types and states
- Test NetworkBadge component with connected/disconnected states
- Test Identicon component with various wallet addresses
- Test SearchInput component functionality

### Integration Tests
- Test wallet balance validation in ContentCard components
- Test consistent formatting across Header and ExploreFeed components
- Test navigation active states across different pages
- Test comment count synchronization

### Visual Regression Tests
- Verify consistent token formatting across all components
- Verify unified badge styling and positioning
- Verify network status display consistency
- Verify profile picture display in all contexts

## Implementation Details

### Phase 1: Utility Functions
1. Create `formatToken` utility for consistent token display
2. Create `shortenAddress` utility for wallet address formatting
3. Create balance validation helpers

### Phase 2: UI Components
1. Implement `LockBadge` component to replace inconsistent access labels
2. Implement `NetworkBadge` component for clean connection status
3. Implement `Identicon` component for auto-generated profile pictures

### Phase 3: Integration
1. Update Header component to use new utilities and components
2. Update ContentCard component to use LockBadge
3. Update ExploreFeed to use enhanced SearchInput
4. Add navigation active states

### Phase 4: Data Consistency
1. Implement comment count synchronization
2. Remove placeholder/test content
3. Ensure proper loading states for all dynamic content

## Design Decisions

### Token Formatting Standardization
- **Decision**: Use "amount SPACE symbol" format consistently
- **Rationale**: Improves readability and creates visual consistency across the platform
- **Impact**: All token displays will follow the same pattern

### Address Display Consistency
- **Decision**: Use lowercase formatting after "0x" with 6…4 character display
- **Rationale**: Creates professional appearance and consistent user experience
- **Impact**: All wallet addresses will appear uniform throughout the platform

### Unified Access Control Badges
- **Decision**: Replace multiple inconsistent labels with single LockBadge component
- **Rationale**: Reduces visual clutter and improves user understanding
- **Impact**: Cleaner content cards with consistent access requirement display

### Auto-Generated Profile Pictures
- **Decision**: Generate identicons from wallet addresses for users without profile pictures
- **Rationale**: Eliminates empty profile picture spaces and improves visual completeness
- **Impact**: All user profiles will have visual representation

### Enhanced Search Experience
- **Decision**: Use descriptive placeholder text instead of generic "Type here to search"
- **Rationale**: Helps users understand what content types are searchable
- **Impact**: Improved user guidance and search discoverability