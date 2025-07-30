import React from 'react';
import { useContractManager } from '../hooks/useContractManager';

interface ContractStatusIndicatorProps {
  contractName?: string;
  showDetails?: boolean;
  className?: string;
}

const ContractStatusIndicator: React.FC<ContractStatusIndicatorProps> = ({
  contractName,
  showDetails = false,
  className = ''
}) => {
  const { healthReport, isHealthy, currentChainId } = useContractManager();

  if (!healthReport) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-text-secondary">Checking contracts...</span>
      </div>
    );
  }

  // Show specific contract status
  if (contractName && healthReport[contractName]) {
    const status = healthReport[contractName];
    const isHealthy = status.isDeployed && status.isResponding;
    
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${
          isHealthy ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className={`text-xs ${
          isHealthy ? 'text-green-400' : 'text-red-400'
        }`}>
          {isHealthy ? 'Available' : 'Unavailable'}
        </span>
        {showDetails && status.error && (
          <span className="text-xs text-text-secondary">
            ({status.error})
          </span>
        )}
      </div>
    );
  }

  // Show overall health status
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        isHealthy ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className={`text-xs ${
        isHealthy ? 'text-green-400' : 'text-red-400'
      }`}>
        {isHealthy ? 'All systems operational' : 'Some contracts unavailable'}
      </span>
      {showDetails && (
        <span className="text-xs text-text-secondary">
          (Chain: {currentChainId})
        </span>
      )}
    </div>
  );
};

export default ContractStatusIndicator;