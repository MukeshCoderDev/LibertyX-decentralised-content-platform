import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  createdAt: string;
  updatedAt: string;
  assignedAgent?: string;
  responses: TicketResponse[];
  attachments: string[];
}

interface TicketResponse {
  id: string;
  author: string;
  authorType: 'user' | 'agent';
  message: string;
  timestamp: string;
  isInternal: boolean;
}

interface SupportAgent {
  id: string;
  name: string;
  avatar: string;
  specialties: string[];
  isOnline: boolean;
  responseTime: string;
}

export const PrioritySupportSystem: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [supportAgents, setSupportAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const supportCategories = [
    'Technical Issues',
    'Account Management',
    'Payment & Billing',
    'Content Upload',
    'Smart Contracts',
    'API Integration',
    'Tax Reporting',
    'General Inquiry'
  ];

  useEffect(() => {
    if (isConnected) {
      loadSupportTickets();
      loadSupportAgents();
    }
  }, [isConnected]);

  const loadSupportTickets = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would fetch from backend
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          title: 'Unable to upload content to Arweave',
          description: 'Getting error when trying to upload video content. The transaction fails after gas estimation.',
          priority: 'high',
          status: 'in_progress',
          category: 'Technical Issues',
          createdAt: '2025-01-25T10:30:00Z',
          updatedAt: '2025-01-26T09:15:00Z',
          assignedAgent: 'Sarah Chen',
          responses: [
            {
              id: '1',
              author: 'Sarah Chen',
              authorType: 'agent',
              message: 'Hi! I\'ve reviewed your issue. This appears to be related to network congestion. Let me help you resolve this.',
              timestamp: '2025-01-25T11:00:00Z',
              isInternal: false
            }
          ],
          attachments: ['error-screenshot.png']
        },
        {
          id: '2',
          title: 'API rate limit exceeded',
          description: 'My application is hitting rate limits even though I\'m within the documented limits.',
          priority: 'medium',
          status: 'open',
          category: 'API Integration',
          createdAt: '2025-01-26T08:20:00Z',
          updatedAt: '2025-01-26T08:20:00Z',
          responses: [],
          attachments: []
        }
      ];
      
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportAgents = async () => {
    try {
      // Mock data - in real implementation, this would fetch from backend
      const mockAgents: SupportAgent[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          avatar: '/api/placeholder/40/40',
          specialties: ['Technical Issues', 'Smart Contracts'],
          isOnline: true,
          responseTime: '< 2 hours'
        },
        {
          id: '2',
          name: 'Mike Rodriguez',
          avatar: '/api/placeholder/40/40',
          specialties: ['API Integration', 'Payment & Billing'],
          isOnline: true,
          responseTime: '< 1 hour'
        },
        {
          id: '3',
          name: 'Emma Thompson',
          avatar: '/api/placeholder/40/40',
          specialties: ['Account Management', 'Tax Reporting'],
          isOnline: false,
          responseTime: '< 4 hours'
        }
      ];
      
      setSupportAgents(mockAgents);
    } catch (error) {
      console.error('Error loading support agents:', error);
    }
  };

  const createTicket = async (ticketData: any) => {
    setLoading(true);
    try {
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: 'open',
        category: ticketData.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
        attachments: []
      };
      
      setTickets([newTicket, ...tickets]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    
    const response: TicketResponse = {
      id: Date.now().toString(),
      author: account || 'User',
      authorType: 'user',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isInternal: false
    };
    
    const updatedTicket = {
      ...selectedTicket,
      responses: [...selectedTicket.responses, response],
      updatedAt: new Date().toISOString()
    };
    
    setSelectedTicket(updatedTicket);
    setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setNewMessage('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-900 text-red-300';
      case 'high': return 'bg-orange-900 text-orange-300';
      case 'medium': return 'bg-yellow-900 text-yellow-300';
      case 'low': return 'bg-green-900 text-green-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-900 text-blue-300';
      case 'in_progress': return 'bg-purple-900 text-purple-300';
      case 'resolved': return 'bg-green-900 text-green-300';
      case 'closed': return 'bg-gray-900 text-gray-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to access priority support</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Priority Support</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition-colors text-sm"
              >
                New Ticket
              </button>
            </div>
            <div className="bg-green-900 border border-green-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-green-300 font-semibold">Enterprise Support Active</span>
              </div>
              <p className="text-green-200 text-sm mt-1">Priority response within 1 hour</p>
            </div>
          </div>

          {/* Support Agents */}
          <div className="p-6 border-b border-gray-700">
            <h3 className="font-semibold mb-3">Available Agents</h3>
            <div className="space-y-3">
              {supportAgents.map((agent) => (
                <div key={agent.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      agent.isOnline ? 'bg-green-400' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.responseTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <h3 className="font-semibold mb-3">Your Tickets</h3>
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id 
                          ? 'bg-blue-900 border border-blue-700' 
                          : 'bg-gray-700 hover:bg-gray-650'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{ticket.description}</p>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-6 border-b border-gray-700 bg-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{selectedTicket.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Ticket #{selectedTicket.id}</span>
                      <span>Category: {selectedTicket.category}</span>
                      {selectedTicket.assignedAgent && (
                        <span>Assigned to: {selectedTicket.assignedAgent}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority} priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Initial Description */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      U
                    </div>
                    <div>
                      <p className="font-medium">You</p>
                      <p className="text-xs text-gray-400">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300">{selectedTicket.description}</p>
                  {selectedTicket.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-2">Attachments:</p>
                      {selectedTicket.attachments.map((attachment, index) => (
                        <span key={index} className="inline-block bg-gray-700 px-2 py-1 rounded text-xs mr-2">
                          📎 {attachment}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Responses */}
                {selectedTicket.responses.map((response) => (
                  <div key={response.id} className={`rounded-lg p-4 ${
                    response.authorType === 'agent' ? 'bg-green-900' : 'bg-gray-800'
                  }`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        response.authorType === 'agent' ? 'bg-green-600' : 'bg-blue-600'
                      }`}>
                        {response.authorType === 'agent' ? 'A' : 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{response.author}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(response.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300">{response.message}</p>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-700 bg-gray-800">
                <div className="flex space-x-4">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white resize-none"
                    rows={3}
                  />
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Send
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors text-sm">
                      Attach File
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎧</div>
                <h2 className="text-2xl font-bold mb-2">Priority Support</h2>
                <p className="text-gray-400 mb-6">Select a ticket to view the conversation</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
                >
                  Create New Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Create Support Ticket</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              createTicket(Object.fromEntries(formData.entries()));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Select a category</option>
                    {supportCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select
                    name="priority"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    name="description"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Detailed description of your issue"
                    rows={4}
                  />
                </div>
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
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrioritySupportSystem;