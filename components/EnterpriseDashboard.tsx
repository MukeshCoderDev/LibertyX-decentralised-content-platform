import React, { useState } from 'react';
import { useWallet } from '../lib/WalletProvider';
import AgencyDashboard from './AgencyDashboard';
import ContentScheduler from './ContentScheduler';
import WhiteLabelAnalytics from './WhiteLabelAnalytics';
import APIWebhookManager from './APIWebhookManager';
import TaxReportingSystem from './TaxReportingSystem';
import PrioritySupportSystem from './PrioritySupportSystem';

type DashboardView = 'overview' | 'agency' | 'scheduler' | 'analytics' | 'api' | 'tax' | 'support';

export const EnterpriseDashboard: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [activeView, setActiveView] = useState<DashboardView>('overview');

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'agency', label: 'Agency Management', icon: '👥' },
    { id: 'scheduler', label: 'Content Scheduler', icon: '📅' },
    { id: 'analytics', label: 'Analytics & Reports', icon: '📈' },
    { id: 'api', label: 'API & Webhooks', icon: '🔌' },
    { id: 'tax', label: 'Tax Reporting', icon: '📋' },
    { id: 'support', label: 'Priority Support', icon: '🎧' }
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'agency':
        return <AgencyDashboard />;
      case 'scheduler':
        return <ContentScheduler />;
      case 'analytics':
        return <WhiteLabelAnalytics />;
      case 'api':
        return <APIWebhookManager />;
      case 'tax':
        return <TaxReportingSystem />;
      case 'support':
        return <PrioritySupportSystem />;
      default:
        return <EnterpriseOverview />;
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access enterprise features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">LibertyX</h1>
              <p className="text-gray-400 text-sm">Enterprise</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as DashboardView)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Account Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {account?.substring(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">Enterprise Account</p>
              <p className="text-gray-400 text-xs truncate">
                {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {renderActiveView()}
      </div>
    </div>
  );
};

// Overview Component
const EnterpriseOverview: React.FC = () => {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Enterprise Dashboard</h1>
          <p className="text-gray-400">Comprehensive tools for professional content creators and agencies</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-2">Managed Creators</h3>
            <p className="text-3xl font-bold text-blue-400">24</p>
            <p className="text-sm text-green-400 mt-1">↗ +3 this month</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-400">45,280 LIB</p>
            <p className="text-sm text-green-400 mt-1">↗ +12.5% this month</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold mb-2">API Requests</h3>
            <p className="text-3xl font-bold text-purple-400">1.2M</p>
            <p className="text-sm text-green-400 mt-1">↗ +8.3% this month</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold mb-2">Support Tickets</h3>
            <p className="text-3xl font-bold text-yellow-400">3</p>
            <p className="text-sm text-gray-400 mt-1">2 resolved today</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">👥</span>
              <h3 className="text-xl font-bold">Agency Management</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Manage multiple creators, perform bulk operations, and track performance across your entire network.
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Multi-creator dashboard</li>
              <li>• Bulk content operations</li>
              <li>• Revenue tracking</li>
              <li>• Performance analytics</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📅</span>
              <h3 className="text-xl font-bold">Content Scheduling</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Automate your content publishing with advanced scheduling and calendar management tools.
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Automated publishing</li>
              <li>• Calendar integration</li>
              <li>• Bulk scheduling</li>
              <li>• Time zone optimization</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📈</span>
              <h3 className="text-xl font-bold">White-Label Analytics</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Professional analytics and reporting tools with customizable branding for your clients.
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Custom branding</li>
              <li>• Advanced metrics</li>
              <li>• Export capabilities</li>
              <li>• Client dashboards</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🔌</span>
              <h3 className="text-xl font-bold">API & Webhooks</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Comprehensive APIs and webhook integrations for seamless system connectivity.
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• RESTful APIs</li>
              <li>• Real-time webhooks</li>
              <li>• Rate limiting</li>
              <li>• Documentation</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">📋</span>
              <h3 className="text-xl font-bold">Tax Reporting</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Automated cryptocurrency tax reporting with support for multiple formats and jurisdictions.
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Automated calculations</li>
              <li>• Multiple export formats</li>
              <li>• Tax software integration</li>
              <li>• Compliance tracking</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-3xl">🎧</span>
              <h3 className="text-xl font-bold">Priority Support</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Dedicated support with guaranteed response times and direct access to technical experts.
            </p>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 1-hour response time</li>
              <li>• Dedicated agents</li>
              <li>• Technical expertise</li>
              <li>• 24/7 availability</li>
            </ul>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <span className="text-2xl">📊</span>
              <div className="flex-1">
                <p className="font-medium">Analytics report generated</p>
                <p className="text-sm text-gray-400">Monthly performance report for Q1 2025</p>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <span className="text-2xl">🔌</span>
              <div className="flex-1">
                <p className="font-medium">New API key created</p>
                <p className="text-sm text-gray-400">Production API key for analytics dashboard</p>
              </div>
              <span className="text-sm text-gray-400">5 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
              <span className="text-2xl">📅</span>
              <div className="flex-1">
                <p className="font-medium">Content scheduled</p>
                <p className="text-sm text-gray-400">15 posts scheduled for next week</p>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;