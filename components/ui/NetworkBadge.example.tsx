/**
 * Example usage of the NetworkBadge component
 * This file demonstrates how to use the clean network status badge
 */

import React, { useState } from 'react';
import { NetworkBadge, NetworkDot, NetworkStatus, useNetworkStatus } from './NetworkBadge';

export const NetworkBadgeExamples: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
      setIsConnecting(false);
    } else if (isConnecting) {
      setIsConnected(true);
      setIsConnecting(false);
    } else {
      setIsConnecting(true);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">NetworkBadge Component Examples</h1>

      {/* Interactive Demo */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
        <div className="space-y-4">
          <button
            onClick={toggleConnection}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Toggle Connection State
          </button>
          <div className="flex gap-4 items-center">
            <NetworkBadge
              networkName="Sepolia"
              isConnected={isConnected}
              isConnecting={isConnecting}
            />
            <span className="text-gray-400">
              Current state: {isConnecting ? 'Connecting' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </section>

      {/* Default Variant */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Default Variant (Full Badge)</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
          />
          <NetworkBadge
            networkName="Polygon"
            isConnected={false}
            isConnecting={true}
          />
          <NetworkBadge
            networkName="BSC"
            isConnected={false}
          />
        </div>
      </section>

      {/* Compact Variant */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Compact Variant (Network Name Only)</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
            variant="compact"
          />
          <NetworkBadge
            networkName="Polygon"
            isConnected={false}
            isConnecting={true}
            variant="compact"
          />
          <NetworkBadge
            networkName="BSC"
            isConnected={false}
            variant="compact"
          />
        </div>
      </section>

      {/* Minimal Variant */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Minimal Variant (Clean Dot + Name)</h2>
        <div className="flex gap-4 items-center flex-wrap">
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
            variant="minimal"
          />
          <NetworkBadge
            networkName="Polygon"
            isConnected={false}
            isConnecting={true}
            variant="minimal"
          />
          <NetworkBadge
            networkName="BSC"
            isConnected={false}
            variant="minimal"
          />
        </div>
      </section>

      {/* Size Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
        <div className="flex gap-4 items-center">
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
            size="small"
          />
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
            size="medium"
          />
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
            size="large"
          />
        </div>
      </section>

      {/* Network Dots Only */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Network Dots (Minimal Indicators)</h2>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <NetworkDot isConnected={true} size="small" />
            <span className="text-sm">Small Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <NetworkDot isConnected={false} isConnecting={true} size="medium" />
            <span className="text-sm">Medium Connecting</span>
          </div>
          <div className="flex items-center gap-2">
            <NetworkDot isConnected={false} size="large" />
            <span className="text-sm">Large Disconnected</span>
          </div>
        </div>
      </section>

      {/* Network Status (Header Style) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Network Status (Header Style)</h2>
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <NetworkStatus
              networkName="Sepolia"
              isConnected={true}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <NetworkStatus
              networkName="Polygon Mumbai"
              isConnected={false}
              isConnecting={true}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <NetworkStatus
              networkName="BSC Testnet"
              isConnected={false}
            />
          </div>
        </div>
      </section>

      {/* Without Network Names */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Status Only (No Network Names)</h2>
        <div className="flex gap-4 items-center">
          <NetworkBadge
            networkName="Ethereum"
            isConnected={true}
            showNetworkName={false}
          />
          <NetworkBadge
            networkName="Polygon"
            isConnected={false}
            isConnecting={true}
            showNetworkName={false}
          />
          <NetworkBadge
            networkName="BSC"
            isConnected={false}
            showNetworkName={false}
          />
        </div>
      </section>

      {/* Hook Usage Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">useNetworkStatus Hook</h2>
        <NetworkStatusHookExample />
      </section>
    </div>
  );
};

const NetworkStatusHookExample: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const status = useNetworkStatus(isConnected, isConnecting);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => {
            setIsConnected(true);
            setIsConnecting(false);
          }}
          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
        >
          Connected
        </button>
        <button
          onClick={() => {
            setIsConnected(false);
            setIsConnecting(true);
          }}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
        >
          Connecting
        </button>
        <button
          onClick={() => {
            setIsConnected(false);
            setIsConnecting(false);
          }}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Disconnected
        </button>
      </div>
      
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold mb-2">Hook Returns:</h4>
        <div className="space-y-1 text-sm">
          <p>Status Text: <span className={status.textColor}>{status.statusText}</span></p>
          <p>Dot Color: <span className="font-mono">{status.dotColor}</span></p>
          <p>Text Color: <span className="font-mono">{status.textColor}</span></p>
          <p>Background: <span className="font-mono">{status.bgColor}</span></p>
        </div>
        
        {/* Visual representation */}
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status.dotColor}`} />
          <span className={`${status.textColor} font-medium`}>
            Custom Badge using Hook
          </span>
        </div>
      </div>
    </div>
  );
};

export default NetworkBadgeExamples;