import React, { memo } from 'react';

interface RealTimeDataSyncProps {
  children: React.ReactNode;
}

// Memoized wrapper component that prevents unnecessary re-renders
export const RealTimeDataSync: React.FC<RealTimeDataSyncProps> = memo(({ children }) => {
  return <>{children}</>;
});