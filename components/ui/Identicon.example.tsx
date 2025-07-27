/**
 * Example usage of the Identicon component
 * This file demonstrates how to use auto-generated profile pictures
 */

import React, { useState } from 'react';
import { Identicon, SimpleIdenticon, useIdenticonColors, generateIdenticonDataUrl } from './Identicon';

export const IdenticonExamples: React.FC = () => {
  const [customAddress, setCustomAddress] = useState('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4');

  // Sample wallet addresses for demonstration
  const sampleAddresses = [
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d4d4',
    '0x123456789abcdef123456789abcdef123456789a',
    '0xabcdef123456789abcdef123456789abcdef1234',
    '0x9FAF7Fc3b2b7F66c26c1931c993fb86A012345678',
    '0x555666777888999aaabbbcccdddeeefff0001112',
  ];

  return (
    <div className="p-8 space-y-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">Identicon Component Examples</h1>

      {/* Interactive Demo */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter Wallet Address:
            </label>
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              placeholder="0x..."
            />
          </div>
          <div className="flex items-center gap-4">
            <Identicon address={customAddress} size="large" />
            <div>
              <p className="font-medium">Generated Identicon</p>
              <p className="text-sm text-gray-400">
                Address: {customAddress.substring(0, 10)}...{customAddress.substring(customAddress.length - 8)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Size Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Identicon address={sampleAddresses[0]} size="small" />
            <p className="text-sm mt-2">Small</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[0]} size="medium" />
            <p className="text-sm mt-2">Medium</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[0]} size="large" />
            <p className="text-sm mt-2">Large</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[0]} size="xl" />
            <p className="text-sm mt-2">Extra Large</p>
          </div>
        </div>
      </section>

      {/* Shape Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Shape Variants</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Identicon address={sampleAddresses[1]} shape="circle" size="large" />
            <p className="text-sm mt-2">Circle</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[1]} shape="rounded" size="large" />
            <p className="text-sm mt-2">Rounded</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[1]} shape="square" size="large" />
            <p className="text-sm mt-2">Square</p>
          </div>
        </div>
      </section>

      {/* Style Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Style Variants</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <Identicon address={sampleAddresses[2]} style="geometric" size="large" />
            <p className="text-sm mt-2">Geometric</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[2]} style="blockies" size="large" />
            <p className="text-sm mt-2">Blockies</p>
          </div>
          <div className="text-center">
            <Identicon address={sampleAddresses[2]} style="gradient" size="large" />
            <p className="text-sm mt-2">Gradient</p>
          </div>
        </div>
      </section>

      {/* Simple Identicons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Simple Identicons (Initials Only)</h2>
        <div className="flex items-center gap-4">
          {sampleAddresses.slice(0, 4).map((address, index) => (
            <div key={index} className="text-center">
              <SimpleIdenticon address={address} size="large" />
              <p className="text-xs mt-2 font-mono">
                {address.substring(2, 4).toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Multiple Addresses Showcase */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Multiple Addresses (Consistency Demo)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sampleAddresses.map((address, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg text-center">
              <Identicon address={address} size="large" className="mx-auto mb-3" />
              <p className="text-xs font-mono text-gray-400">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                User #{index + 1}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Case Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Use Case Examples</h2>
        
        {/* Comment Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Comment Section</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            {sampleAddresses.slice(0, 3).map((address, index) => (
              <div key={index} className="flex items-start gap-3 mb-4 last:mb-0">
                <Identicon address={address} size="medium" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {address.substring(0, 6)}...{address.substring(address.length - 4)}
                    </span>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    This is a sample comment from a user without a profile picture. 
                    The identicon provides a consistent visual representation.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">User List</h3>
          <div className="bg-gray-800 p-4 rounded-lg">
            {sampleAddresses.map((address, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center gap-3">
                  <SimpleIdenticon address={address} size="medium" />
                  <div>
                    <p className="font-medium">User {index + 1}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {address.substring(0, 10)}...{address.substring(address.length - 8)}
                    </p>
                  </div>
                </div>
                <button className="text-primary hover:underline text-sm">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Color Hook Demo */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Color Hook Demo</h2>
        <ColorHookExample address={customAddress} />
      </section>

      {/* Data URL Demo */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Data URL Generation</h2>
        <DataUrlExample address={customAddress} />
      </section>
    </div>
  );
};

const ColorHookExample: React.FC<{ address: string }> = ({ address }) => {
  const colors = useIdenticonColors(address);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h4 className="font-semibold mb-3">Generated Colors for Address</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-lg mx-auto mb-2"
            style={{ backgroundColor: colors.primary }}
          />
          <p className="text-xs">Primary</p>
          <p className="text-xs font-mono text-gray-400">{colors.primary}</p>
        </div>
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-lg mx-auto mb-2"
            style={{ backgroundColor: colors.secondary }}
          />
          <p className="text-xs">Secondary</p>
          <p className="text-xs font-mono text-gray-400">{colors.secondary}</p>
        </div>
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-lg mx-auto mb-2"
            style={{ backgroundColor: colors.accent }}
          />
          <p className="text-xs">Accent</p>
          <p className="text-xs font-mono text-gray-400">{colors.accent}</p>
        </div>
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-lg mx-auto mb-2"
            style={{ backgroundColor: colors.background }}
          />
          <p className="text-xs">Background</p>
          <p className="text-xs font-mono text-gray-400">{colors.background}</p>
        </div>
      </div>
    </div>
  );
};

const DataUrlExample: React.FC<{ address: string }> = ({ address }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [size, setSize] = useState(64);

  React.useEffect(() => {
    const url = generateIdenticonDataUrl(address, size);
    setDataUrl(url);
  }, [address, size]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h4 className="font-semibold mb-3">Generated Data URL</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Size:</label>
          <input
            type="range"
            min="32"
            max="128"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-full"
          />
          <span className="text-sm text-gray-400">{size}px</span>
        </div>
        
        <div className="flex items-center gap-4">
          <img 
            src={dataUrl} 
            alt="Generated identicon" 
            className="rounded-lg border border-gray-600"
            style={{ width: size, height: size }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Data URL:</p>
            <textarea
              value={dataUrl}
              readOnly
              className="w-full h-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-xs font-mono resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdenticonExamples;