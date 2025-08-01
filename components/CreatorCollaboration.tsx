import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Users, Plus, DollarSign, Calendar, Check, X } from 'lucide-react';

interface CollaborationProposal {
  id: string;
  initiator: string;
  collaborators: string[];
  title: string;
  description: string;
  revenueShares: { [address: string]: number };
  deadline: number;
  status: 'pending' | 'accepted' | 'rejected' | 'active' | 'completed';
  contentId?: number;
  totalEarnings: string;
  createdAt: number;
}

interface CreatorCollaborationProps {
  creatorAddress: string;
  className?: string;
}

export const CreatorCollaboration: React.FC<CreatorCollaborationProps> = ({
  creatorAddress,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction, listenToEvents } = useContractManager();
  const [proposals, setProposals] = useState<CollaborationProposal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    collaborators: [''],
    revenueShares: {} as { [address: string]: number },
    deadline: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollaborations();
    setupEventListeners();
  }, [creatorAddress]);

  const loadCollaborations = async () => {
    try {
      setLoading(true);
      // Load collaboration proposals from blockchain
      const collaborationsData = await fetchCollaborationsFromChain();
      setProposals(collaborationsData);
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    listenToEvents('contentRegistry', 'CollaborationProposed', (event: any) => {
      if (event.collaborators.includes(creatorAddress)) {
        loadCollaborations();
      }
    });

    listenToEvents('contentRegistry', 'CollaborationAccepted', (event: any) => {
      updateProposalStatus(event.proposalId, 'accepted');
    });

    listenToEvents('revenueSplitter', 'CollaborationEarnings', (event: any) => {
      updateProposalEarnings(event.proposalId, event.totalEarnings);
    });
  };

  const createCollaboration = async () => {
    if (!isConnected || !account) return;

    try {
      // Validate revenue shares add up to 100%
      const totalShares = Object.values(newProposal.revenueShares).reduce((sum, share) => sum + share, 0);
      if (totalShares !== 100) {
        alert('Revenue shares must add up to 100%');
        return;
      }

      await executeTransaction('contentRegistry', 'proposeCollaboration', [
        newProposal.title,
        newProposal.description,
        newProposal.collaborators.filter(addr => addr.trim()),
        Object.values(newProposal.revenueShares),
        Math.floor(new Date(newProposal.deadline).getTime() / 1000)
      ]);

      setShowCreateModal(false);
      resetNewProposal();
      await loadCollaborations();
    } catch (error) {
      console.error('Failed to create collaboration:', error);
    }
  };

  const respondToProposal = async (proposalId: string, accept: boolean) => {
    if (!isConnected || !account) return;

    try {
      await executeTransaction('contentRegistry', 'respondToCollaboration', [
        proposalId,
        accept
      ]);
      
      await loadCollaborations();
    } catch (error) {
      console.error('Failed to respond to proposal:', error);
    }
  };

  const addCollaborator = () => {
    setNewProposal(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, '']
    }));
  };

  const updateCollaborator = (index: number, address: string) => {
    setNewProposal(prev => ({
      ...prev,
      collaborators: prev.collaborators.map((addr, i) => i === index ? address : addr)
    }));
  };

  const removeCollaborator = (index: number) => {
    setNewProposal(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter((_, i) => i !== index)
    }));
  };

  const updateRevenueShare = (address: string, share: number) => {
    setNewProposal(prev => ({
      ...prev,
      revenueShares: {
        ...prev.revenueShares,
        [address]: share
      }
    }));
  };

  const resetNewProposal = () => {
    setNewProposal({
      title: '',
      description: '',
      collaborators: [''],
      revenueShares: {},
      deadline: ''
    });
  };

  const fetchCollaborationsFromChain = async (): Promise<CollaborationProposal[]> => {
    // Mock implementation - would fetch from actual blockchain
    return [];
  };

  const updateProposalStatus = (proposalId: string, status: CollaborationProposal['status']) => {
    setProposals(prev => prev.map(proposal => 
      proposal.id === proposalId ? { ...proposal, status } : proposal
    ));
  };

  const updateProposalEarnings = (proposalId: string, earnings: string) => {
    setProposals(prev => prev.map(proposal => 
      proposal.id === proposalId ? { ...proposal, totalEarnings: earnings } : proposal
    ));
  };

  const ProposalCard: React.FC<{ proposal: CollaborationProposal }> = ({ proposal }) => {
    const isInitiator = proposal.initiator.toLowerCase() === account?.toLowerCase();
    const isCollaborator = proposal.collaborators.some(addr => 
      addr.toLowerCase() === account?.toLowerCase()
    );
    const canRespond = isCollaborator && !isInitiator && proposal.status === 'pending';

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'accepted': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Initiated by {proposal.initiator.slice(0, 6)}...{proposal.initiator.slice(-4)}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </span>
        </div>

        <p className="text-gray-700 mb-4">{proposal.description}</p>

        <div className="space-y-3 mb-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Collaborators & Revenue Share</h4>
            <div className="space-y-2">
              {proposal.collaborators.map((collaborator, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {collaborator.slice(0, 6)}...{collaborator.slice(-4)}
                  </span>
                  <span className="font-medium">
                    {proposal.revenueShares[collaborator] || 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Deadline: {new Date(proposal.deadline * 1000).toLocaleDateString()}</span>
            </div>
            {proposal.totalEarnings !== '0' && (
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span>Earned: {proposal.totalEarnings} LIB</span>
              </div>
            )}
          </div>
        </div>

        {canRespond && (
          <div className="flex space-x-3">
            <button
              onClick={() => respondToProposal(proposal.id, true)}
              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check className="w-4 h-4" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => respondToProposal(proposal.id, false)}
              className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Collaborations</h2>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Collaboration</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading collaborations...</p>
        </div>
      ) : proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No collaborations yet. Start collaborating with other creators!</p>
        </div>
      )}

      {/* Create Collaboration Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Collaboration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Collaboration title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  rows={3}
                  placeholder="Describe the collaboration..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newProposal.deadline}
                  onChange={(e) => setNewProposal(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Collaborators & Revenue Share
                  </label>
                  <button
                    onClick={addCollaborator}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Collaborator
                  </button>
                </div>
                
                <div className="space-y-2">
                  {newProposal.collaborators.map((collaborator, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={collaborator}
                        onChange={(e) => updateCollaborator(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                        placeholder="0x..."
                      />
                      <input
                        type="number"
                        value={newProposal.revenueShares[collaborator] || ''}
                        onChange={(e) => updateRevenueShare(collaborator, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                        placeholder="%"
                        min="0"
                        max="100"
                      />
                      {newProposal.collaborators.length > 1 && (
                        <button
                          onClick={() => removeCollaborator(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  Total: {Object.values(newProposal.revenueShares).reduce((sum, share) => sum + share, 0)}%
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createCollaboration}
                disabled={!newProposal.title || !newProposal.description}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Collaboration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};