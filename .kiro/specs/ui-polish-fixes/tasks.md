# Implementation Plan

- [x] 1. Create utility functions for consistent formatting

  - Create `utils/formatters.ts` with `formatToken` and `shortenAddress` functions
  - Implement token formatting that ensures "amount SPACE symbol" pattern
  - Implement address shortening with lowercase formatting and 6…4 character display
  - Write unit tests for formatting functions
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3_

- [x] 2. Create balance validation utility

  - Create `utils/validation.ts` with balance validation helpers
  - Implement `checkSufficientBalance` function for subscription validation
  - Create helper to determine button disabled state based on balance
  - Write unit tests for validation logic
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Create LockBadge component for unified access control

  - Create `components/ui/LockBadge.tsx` component
  - Implement single badge format "Need NFT Tier #X" for NFT requirements
  - Replace multiple inconsistent access control labels with unified component
  - Add proper styling and visual consistency
  - Write component tests for different access types
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Create NetworkBadge component for clean connection status

  - Create `components/ui/NetworkBadge.tsx` component
  - Replace bullet separator "·" with small green dot badge
  - Implement clean visual hierarchy for network information
  - Add proper styling for connected/disconnected states
  - Write component tests for different connection states
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Create Identicon component for auto-generated profile pictures


  - Create `components/ui/Identicon.tsx` component
  - Implement identicon generation based on wallet addresses
  - Create consistent, recognizable patterns for user identification
  - Add different size variants (small, medium, large)
  - Write component tests for identicon generation consistency
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 6. Create enhanced SearchInput component

  - Create `components/shared/SearchInput.tsx` component
  - Replace generic placeholder with "Search videos, creators, NFTs…"
  - Maintain existing search functionality while improving UX
  - Add proper styling and focus states
  - Write component tests for search functionality
  - _Requirements: 5.1, 5.2_

- [ ] 7. Update Header component with new utilities and components

  - Update `components/Header.tsx` to use `formatToken` utility for balance display
  - Update wallet address display to use `shortenAddress` utility
  - Replace network status display with NetworkBadge component
  - Ensure consistent token formatting in balance section
  - Test Header component with updated utilities
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3_

- [ ] 8. Update ContentCard component with LockBadge and validation

  - Update `components/ContentCard.tsx` to use LockBadge component
  - Implement balance validation for Subscribe button disabled state
  - Add tooltip "Not enough LIB tokens" for disabled Subscribe buttons
  - Replace inconsistent access control labels with unified LockBadge
  - Add Identicon component for missing profile pictures
  - Test ContentCard with different access levels and balance states
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 9.1, 9.2, 9.3_

- [ ] 9. Update ExploreFeed component with enhanced search

  - Update `components/ExploreFeed.tsx` to use enhanced SearchInput component
  - Replace existing search placeholder with descriptive text
  - Ensure search functionality remains intact
  - Test search component integration
  - _Requirements: 5.1, 5.2_

- [ ] 10. Add navigation active states styling

  - Update `components/Header.tsx` navigation items with active state feedback
  - Add underline or color change for active navigation items
  - Ensure consistent active state styling across all navigation elements
  - Test navigation active states across different pages
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 11. Fix content quality and data consistency issues

  - Remove or replace "FOR BIGGER BLAZES" placeholder text in relevant components
  - Fix comment count synchronization to match actual loaded comments
  - Hide comment counters until data is fully loaded
  - Remove duplicate "Creator" labels and use distinct descriptive labels
  - Implement proper loading states for dynamic content
  - Test data consistency across all components
  - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 11.1, 11.2, 11.3_

- [ ] 12. Update StableBalanceDisplay component for consistent formatting

  - Update `components/StableBalanceDisplay.tsx` to use `formatToken` utility
  - Ensure all token displays follow "amount SPACE symbol" format
  - Fix any inconsistent spacing in token amount displays
  - Test balance display consistency across different components
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13. Update PriceDisplay component for consistent formatting
  - Update `components/PriceDisplay.tsx` to use `formatToken` utility
  - Ensure consistent token formatting in price displays
  - Maintain existing styling while improving format consistency
  - Test price display formatting across different contexts
  - _Requirements: 3.1, 3.2, 3.3_
