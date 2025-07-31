import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastTriggered?: string;
  successRate: number;
  createdAt: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: string;
  requestCount: number;
  createdAt: string;
}

export const APIWebhookManager: React.FC = () => {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'api' | 'webhooks'>('api');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableEvents = [
    'content.uploaded',
    'subscription.created',
    'subscription.cancelled',
    'nft.minted',
    'payment.received',
    'user.registered',
    'content.viewed',
    'comment.created'
  ];

  const availablePermissions = [
    'read:content',
    'write:content',
    'read:users',
    'read:analytics',
    'write:webhooks',
    'read:earnings',
    'write:subscriptions'
  ];

  useEffect(() => {
    if (isConnected) {
      loadAPIKeys();
      loadWebhooks();
    }
  }, [isConnected]);

  const loadAPIKeys = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from backend
      const mockAPIKeys: APIKey[] = [
        {
          id: '1',
          name: 'Production API',
          key: 'lib_pk_live_1234567890abcdef',
          permissions: ['read:content', 'read:analytics', 'read:earnings'],
          isActive: true,
          lastUsed: '2025-01-26T10:30:00Z',
          requestCount: 15420,
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Analytics Dashboard',
          key: 'lib_pk_test_abcdef1234567890',
          permissions: ['read:analytics', 'read:users'],
          isActive: true,
          lastUsed: '2025-01-26T09:15:00Z',
          requestCount: 8750,
          createdAt: '2025-01-15T00:00:00Z'
        }
      ];
      setApiKeys(mockAPIKeys);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from backend
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          name: 'Content Upload Notifications',
          url: 'https://api.example.com/webhooks/content',
          events: ['content.uploaded', 'content.viewed'],
          isActive: true,
          secret: 'whsec_1234567890abcdef',
          lastTriggered: '2025-01-26T11:45:00Z',
          successRate: 98.5,
          createdAt: '2025-01-10T00:00:00Z'
        },
        {
          id: '2',
          name: 'Payment Processing',
          url: 'https://payments.example.com/webhook',
          events: ['payment.received', 'subscription.created'],
          isActive: true,
          secret: 'whsec_abcdef1234567890',
          lastTriggered: '2025-01-26T10:20:00Z',
          successRate: 99.2,
          createdAt: '2025-01-05T00:00:00Z'
        }
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async (data: any) => {
    setLoading(true);
    try {
      // Implementation would create API key on backend
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: data.name,
        key: `lib_pk_${data.environment}_${Math.random().toString(36).substr(2, 16)}`,
        permissions: data.permissions,
        isActive: true,
        requestCount: 0,
        createdAt: new Date().toISOString()
      };
      setApiKeys([...apiKeys, newKey]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (data: any) => {
    setLoading(true);
    try {
      // Implementation would create webhook on backend
      const newWebhook: Webhook = {
        id: Date.now().toString(),
        name: data.name,
        url: data.url,
        events: data.events,
        isActive: true,
        secret: `whsec_${Math.random().toString(36).substr(2, 16)}`,
        successRate: 100,
        createdAt: new Date().toISOString()
      };
      setWebhooks([...webhooks, newWebhook]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAPIKey = async (keyId: string) => {
    setApiKeys(apiKeys.map(key => 
      key.id === keyId ? { ...key, isActive: !key.isActive } : key
    ));
  };

  const toggleWebhook = async (webhookId: string) => {
    setWebhooks(webhooks.map(webhook => 
      webhook.id === webhookId ? { ...webhook, isActive: !webhook.isActive } : webhook
    ));
  };

  const deleteAPIKey = async (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      setWebhooks(webhooks.filter(webhook => webhook.id !== webhookId));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access API management</p>
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
            <h1 className="text-3xl font-bold">API & Webhook Management</h1>
            <p className="text-gray-400 mt-2">Manage your API keys and webhook integrations</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Create New {activeTab === 'api' ? 'API Key' : 'Webhook'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'api' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'webhooks' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Webhooks
          </button>
        </div>

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">API Documentation</h3>
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2">Base URL</h4>
                <code className="text-green-400">https://api.libertyx.io/v1</code>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Authentication</h4>
                  <p className="text-sm text-gray-300 mb-2">Include your API key in the Authorization header:</p>
                  <code className="text-green-400 text-sm">Authorization: Bearer YOUR_API_KEY</code>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Rate Limits</h4>
                  <p className="text-sm text-gray-300">
                    • 1000 requests per hour for read operations<br/>
                    • 100 requests per hour for write operations
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Your API Keys</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Key</th>
                      <th className="px-6 py-3 text-left">Permissions</th>
                      <th className="px-6 py-3 text-left">Usage</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold">{key.name}</p>
                            <p className="text-sm text-gray-400">
                              Created {new Date(key.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <code className="bg-gray-700 px-2 py-1 rounded text-sm">
                              {key.key.substring(0, 20)}...
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(key.key)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {key.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold">{key.requestCount.toLocaleString()}</p>
                            <p className="text-sm text-gray-400">
                              Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            key.isActive 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleAPIKey(key.id)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              {key.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => deleteAPIKey(key.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
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
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold">Your Webhooks</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">URL</th>
                      <th className="px-6 py-3 text-left">Events</th>
                      <th className="px-6 py-3 text-left">Success Rate</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((webhook) => (
                      <tr key={webhook.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold">{webhook.name}</p>
                            <p className="text-sm text-gray-400">
                              Created {new Date(webhook.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="bg-gray-700 px-2 py-1 rounded text-sm">
                            {webhook.url}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.map((event) => (
                              <span
                                key={event}
                                className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs"
                              >
                                {event}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold">{webhook.successRate}%</p>
                            <p className="text-sm text-gray-400">
                              Last triggered: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            webhook.isActive 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleWebhook(webhook.id)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              {webhook.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button className="text-green-400 hover:text-green-300 text-sm">
                              Test
                            </button>
                            <button
                              onClick={() => deleteWebhook(webhook.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
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
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">
                Create New {activeTab === 'api' ? 'API Key' : 'Webhook'}
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                
                if (activeTab === 'api') {
                  const apiData = { ...data, permissions: Array.from(formData.getAll('permissions')) };
                  createAPIKey(apiData);
                } else {
                  const webhookData = { ...data, events: Array.from(formData.getAll('events')) };
                  createWebhook(webhookData);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input
                      name="name"
                      type="text"
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder={`${activeTab === 'api' ? 'API Key' : 'Webhook'} name`}
                    />
                  </div>
                  
                  {activeTab === 'api' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Environment</label>
                        <select
                          name="environment"
                          required
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="test">Test</option>
                          <option value="live">Live</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Permissions</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availablePermissions.map((permission) => (
                            <label key={permission} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="permissions"
                                value={permission}
                                className="rounded"
                              />
                              <span className="text-sm">{permission}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Webhook URL</label>
                        <input
                          name="url"
                          type="url"
                          required
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                          placeholder="https://your-app.com/webhook"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Events</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availableEvents.map((event) => (
                            <label key={event} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="events"
                                value={event}
                                className="rounded"
                              />
                              <span className="text-sm">{event}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIWebhookManager;