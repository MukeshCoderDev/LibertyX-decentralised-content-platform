import React from 'react';
import { SocialFeaturesHub } from './SocialFeaturesHub';
import { useWallet } from '../lib/WalletProvider';

export const SocialTestPage: React.FC = () => {
  const { isConnected, account } = useWallet();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Social Features Test Page
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Wallet Status</h3>
              <p className="text-blue-700">
                {isConnected ? `✅ Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` : '❌ Not Connected'}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Features Available</h3>
              <ul className="text-green-700 text-sm">
                <li>✅ Comments & Reactions</li>
                <li>✅ Community Rewards</li>
                <li>✅ Creator Collaboration</li>
                <li>✅ Content Moderation</li>
                <li>✅ Community Integration</li>
              </ul>
            </div>
          </div>

          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                <strong>Connect your MetaMask wallet</strong> to test all social features!
              </p>
            </div>
          )}
        </div>

        {/* Social Features Hub */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <SocialFeaturesHub
            contentId={123}
            creatorAddress="0x1234567890123456789012345678901234567890"
            className="min-h-[600px]"
          />
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🧪 How to Test Social Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Comments System</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Write and post comments</li>
                <li>• Like/dislike comments</li>
                <li>• Reply to comments</li>
                <li>• Report inappropriate content</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Community Rewards</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Earn LIB tokens for engagement</li>
                <li>• View achievements and progress</li>
                <li>• Check engagement score</li>
                <li>• Track reward history</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3. Creator Collaboration</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Create collaboration proposals</li>
                <li>• Set revenue sharing splits</li>
                <li>• Accept/reject proposals</li>
                <li>• Track collaboration earnings</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Content Moderation</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Report problematic content</li>
                <li>• Vote on moderation cases</li>
                <li>• Stake LIB tokens to participate</li>
                <li>• View community decisions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};