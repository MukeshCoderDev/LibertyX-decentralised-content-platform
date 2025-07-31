import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';

interface ScheduledContent {
  id: string;
  title: string;
  description: string;
  scheduledDate: string;
  status: 'pending' | 'published' | 'failed';
  creatorAddress: string;
  creatorHandle: string;
  contentType: 'video' | 'image' | 'audio' | 'document';
  price: {
    amount: string;
    token: string;
  };
}

interface ContentSchedulerProps {
  creatorAddress?: string;
}

export const ContentScheduler: React.FC<ContentSchedulerProps> = ({ creatorAddress }) => {
  const { account: _account, isConnected } = useWallet();
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadScheduledContent();
    }
  }, [isConnected, creatorAddress]);

  const loadScheduledContent = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from backend/contracts
      const mockScheduledContent: ScheduledContent[] = [
        {
          id: '1',
          title: 'Weekly Crypto Update #45',
          description: 'Latest trends in DeFi and NFTs',
          scheduledDate: '2025-01-27T10:00:00Z',
          status: 'pending',
          creatorAddress: '0x1234...5678',
          creatorHandle: 'cryptoexpert',
          contentType: 'video',
          price: { amount: '5.0', token: 'LIB' }
        },
        {
          id: '2',
          title: 'Behind the Scenes: Studio Tour',
          description: 'Exclusive look at my content creation setup',
          scheduledDate: '2025-01-28T15:30:00Z',
          status: 'pending',
          creatorAddress: '0x2345...6789',
          creatorHandle: 'techcreator',
          contentType: 'video',
          price: { amount: '3.5', token: 'LIB' }
        }
      ];
      
      setScheduledContent(mockScheduledContent);
    } catch (error) {
      console.error('Error loading scheduled content:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleContent = async (contentData: any) => {
    setLoading(true);
    try {
      // Implementation would upload to Arweave and schedule blockchain transaction
      console.log('Scheduling content:', contentData);
      await loadScheduledContent(); // Refresh the list
      setShowScheduleModal(false);
    } catch (error) {
      console.error('Error scheduling content:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelScheduledContent = async (contentId: string) => {
    setLoading(true);
    try {
      // Implementation would cancel the scheduled transaction
      setScheduledContent(prev => prev.filter(content => content.id !== contentId));
    } catch (error) {
      console.error('Error canceling scheduled content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900 text-yellow-300';
      case 'published': return 'bg-green-900 text-green-300';
      case 'failed': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📁';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Connect your wallet to access content scheduling</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Scheduler</h2>
          <p className="text-gray-400 mt-1">Automate your content publishing schedule</p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
        >
          Schedule New Content
        </button>
      </div>

      {/* Calendar View */}
      <div className="mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4">This Week's Schedule</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center p-2 bg-gray-600 rounded text-sm font-medium">
                {day}
              </div>
            ))}
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const hasContent = scheduledContent.some(content => 
                new Date(content.scheduledDate).toDateString() === date.toDateString()
              );
              
              return (
                <div key={i} className={`p-2 rounded text-center ${
                  hasContent ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <div className="text-sm">{date.getDate()}</div>
                  {hasContent && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scheduled Content List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Upcoming Content</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading scheduled content...</p>
          </div>
        ) : scheduledContent.length === 0 ? (
          <div className="text-center py-8 bg-gray-700 rounded-lg">
            <p className="text-gray-400">No content scheduled yet</p>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
            >
              Schedule Your First Content
            </button>
          </div>
        ) : (
          scheduledContent.map((content) => (
            <div key={content.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getContentTypeIcon(content.contentType)}</div>
                  <div>
                    <h4 className="font-semibold text-white">{content.title}</h4>
                    <p className="text-gray-400 text-sm">{content.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                      <span>📅 {new Date(content.scheduledDate).toLocaleDateString()}</span>
                      <span>⏰ {new Date(content.scheduledDate).toLocaleTimeString()}</span>
                      <span>💰 {content.price.amount} {content.price.token}</span>
                      <span>👤 {content.creatorHandle}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(content.status)}`}>
                    {content.status}
                  </span>
                  <button
                    onClick={() => cancelScheduledContent(content.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Schedule New Content</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              scheduleContent({
                title: formData.get('title'),
                description: formData.get('description'),
                scheduledDate: `${selectedDate}T${selectedTime}:00Z`,
                contentType: formData.get('contentType'),
                price: {
                  amount: formData.get('price'),
                  token: formData.get('token')
                }
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Content title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Content description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Content Type</label>
                    <select
                      name="contentType"
                      required
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="audio">Audio</option>
                      <option value="document">Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
                    <div className="flex">
                      <input
                        name="price"
                        type="number"
                        step="0.1"
                        required
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-3 py-2 text-white"
                        placeholder="0.0"
                      />
                      <select
                        name="token"
                        className="bg-gray-700 border border-gray-600 rounded-r-lg px-3 py-2 text-white"
                      >
                        <option value="LIB">LIB</option>
                        <option value="ETH">ETH</option>
                        <option value="MATIC">MATIC</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentScheduler;