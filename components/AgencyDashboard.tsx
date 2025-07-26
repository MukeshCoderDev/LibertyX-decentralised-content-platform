import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';

interface Creator {
  address: string;
  handle: string;
  avatar: string;
  totalEarnings: string;
  contentCount: number;
  subscriberCount: number;
  isActive: boolean;
  lastActivity: string;
}

interface BulkOperation {
  type: 'update_pricing' | 'schedule_content' | 'send_message' | 'update_settings';
  selectedCreators: string[];
  parameters: any;
}

export const AgencyDashboard: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { contracts } = useContractManager();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      loadManagedCreators();
    }
  }, [isConnected, account]);

  const loadManagedCreators = async () => {
    setLoading(true);
    try {
      // Mock data for now - in real implementation, this would fetch from contracts
      const mockCreators: Creator[] = [
        {
          address: '0x1234...5678',
          handle: 'creator1',
          avatar: '/api/placeholder/40/40',
          totalEarnings: '125.5',
          contentCount: 45,
          subscriberCount: 1250,
          isActive: true,
          lastActivity: '2 hours ago'
        },
        {
          address: '0x2345...6789',
          handle: 'creator2',
          avatar: '/api/placeholder/40/40',
          totalEarnings: '89.2',
          contentCount: 32,
          subscriberCount: 890,
          isActive: false,
          lastActivity: '1 day ago'
        }
      ];
      setCreators(mockCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSelection = (address: string, selected: boolean) => {
    if (selected) {
      setSelectedCreators([...selectedCreators, address]);
    } else {
      setSelectedCreators(selectedCreators.filter(addr => addr !== address));
    }
  };

  const executeBulkOperation = async () => {
    if (!bulkOperation) return;
    
    setLoading(true);
    try {
      // Implementation would depend on the operation type
      console.log('Executing bulk operation:', bulkOperation);
      // Reset after execution
      setBulkOperation(null);
      setSelectedCreators([]);
    } catch (error) {
      console.error('Error executing bulk operation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access the agency dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agency Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage multiple creators and perform bulk operations</p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              Add Creator
            </button>
            <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Creators</h3>
            <p className="text-3xl font-bold text-blue-400">{creators.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Active Creators</h3>
            <p className="text-3xl font-bold text-green-400">
              {creators.filter(c => c.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Earnings</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {creators.reduce((sum, c) => sum + parseFloat(c.totalEarnings), 0).toFixed(1)} LIB
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Subscribers</h3>
            <p className="text-3xl font-bold text-purple-400">
              {creators.reduce((sum, c) => sum + c.subscriberCount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bulk Operations Panel */}
        {selectedCreators.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Bulk Operations ({selectedCreators.length} creators selected)
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setBulkOperation({
                  type: 'update_pricing',
                  selectedCreators,
                  parameters: {}
                })}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Update Pricing
              </button>
              <button
                onClick={() => setBulkOperation({
                  type: 'schedule_content',
                  selectedCreators,
                  parameters: {}
                })}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                Schedule Content
              </button>
              <button
                onClick={() => setBulkOperation({
                  type: 'send_message',
                  selectedCreators,
                  parameters: {}
                })}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        )}

        {/* Creators Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Managed Creators</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCreators(creators.map(c => c.address));
                        } else {
                          setSelectedCreators([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">Creator</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Earnings</th>
                  <th className="px-6 py-3 text-left">Content</th>
                  <th className="px-6 py-3 text-left">Subscribers</th>
                  <th className="px-6 py-3 text-left">Last Activity</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator.address} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCreators.includes(creator.address)}
                        onChange={(e) => handleCreatorSelection(creator.address, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={creator.avatar}
                          alt={creator.handle}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-semibold">{creator.handle}</p>
                          <p className="text-sm text-gray-400">{creator.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        creator.isActive 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {creator.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{creator.totalEarnings} LIB</span>
                    </td>
                    <td className="px-6 py-4">{creator.contentCount}</td>
                    <td className="px-6 py-4">{creator.subscriberCount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-400">{creator.lastActivity}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm">
                          View
                        </button>
                        <button className="text-green-400 hover:text-green-300 text-sm">
                          Edit
                        </button>
                        <button className="text-red-400 hover:text-red-300 text-sm">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyDashboard;