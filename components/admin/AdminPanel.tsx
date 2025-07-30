import React, { useState } from 'react';
import AdminVideoManager from './AdminVideoManager';
import AnalyticsDashboard from './AnalyticsDashboard';

interface AdminPanelProps {
  className?: string;
}

type AdminTab = 'videos' | 'analytics';

const AdminPanel: React.FC<AdminPanelProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('videos');

  const renderTabButton = (tab: AdminTab, label: string, icon: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        backgroundColor: activeTab === tab ? 'var(--primary, #007bff)' : 'transparent',
        color: activeTab === tab ? 'white' : 'var(--text-secondary, #888)',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        transition: 'all 0.3s'
      }}
      onMouseEnter={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.backgroundColor = 'var(--background-secondary, #1f2937)';
          e.currentTarget.style.color = 'var(--text-primary, #fff)';
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary, #888)';
        }
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background, #111827)' }} className={className}>
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--background-secondary, #1f2937)',
        borderBottom: '1px solid var(--border, #374151)',
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--text-primary, #fff)',
            marginBottom: '16px'
          }}>
            🎬 LibertyX Admin Panel
          </h1>
          
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {renderTabButton('videos', 'Video Management', '📹')}
            {renderTabButton('analytics', 'Analytics', '📊')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ backgroundColor: 'var(--background, #111827)' }}>
        {activeTab === 'videos' && <AdminVideoManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
};

export default AdminPanel;