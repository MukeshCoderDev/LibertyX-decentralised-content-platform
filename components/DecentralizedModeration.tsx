import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Shield, Flag, Vote, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ModerationReport {
  id: string;
  contentId: number;
  reportedBy: string;
  reportType: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'misinformation' | 'other';
  description: string;
  evidence?: string[];
  timestamp: number;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  votes: {
    guilty: number;
    innocent: number;
    abstain: number;
  };
  requiredVotes: number;
  deadline: number;
  resolution?: {
    action: 'no_action' | 'warning' | 'content_removal' | 'creator_suspension';
    reason: string;
    executedAt: number;
  };
}

interface ModerationVote {
  reportId: string;
  voter: string;
  vote: 'guilty' | 'innocent' | 'abstain';
  stake: string;
  timestamp: number;
  reason?: string;
}

interface DecentralizedModerationProps {
  className?: string;
}

export const DecentralizedModeration: React.FC<DecentralizedModerationProps> = ({
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction, listenToEvents } = useContractManager();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [userVotes, setUserVotes] = useState<ModerationVote[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [newReport, setNewReport] = useState({
    reportType: 'inappropriate' as ModerationReport['reportType'],
    description: '',
    evidence: [] as string[]
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'voting' | 'resolved'>('pending');
  const [loading, setLoading] = useState(true);
  const [userStake, setUserStake] = useState('0');

  useEffect(() => {
    loadModerationReports();
    loadUserVotes();
    loadUserStake();
    setupEventListeners();
  }, [account]);

  const loadModerationReports = async () => {
    try {
      setLoading(true);
      const reportsData = await fetchModerationReportsFromChain();
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load moderation reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotes = async () => {
    if (!account) return;
    try {
      const votesData = await fetchUserVotesFromChain(account);
      setUserVotes(votesData);
    } catch (error) {
      console.error('Failed to load user votes:', error);
    }
  };

  const loadUserStake = async () => {
    if (!account) return;
    try {
      // Get user's staked LIB tokens for moderation
      const stake = await getUserModerationStake(account);
      setUserStake(stake);
    } catch (error) {
      console.error('Failed to load user stake:', error);
    }
  };

  const setupEventListeners = () => {
    listenToEvents('libertyDAO', 'ModerationReportCreated', (_event: any) => {
      loadModerationReports();
    });

    listenToEvents('libertyDAO', 'ModerationVoteCast', (event: any) => {
      if (event?.voter?.toLowerCase() === account?.toLowerCase()) {
        loadUserVotes();
      }
      if (event?.reportId && event?.voteType) {
        updateReportVotes(event.reportId, event.voteType);
      }
    });

    listenToEvents('libertyDAO', 'ModerationResolved', (event: any) => {
      updateReportStatus(event.reportId, 'resolved', event.resolution);
    });
  };

  const submitReport = async () => {
    if (!isConnected || !account || !selectedContentId) return;

    try {
      await executeTransaction('libertyDAO', 'submitModerationReport', [
        selectedContentId,
        newReport.reportType,
        newReport.description,
        newReport.evidence
      ]);

      setShowReportModal(false);
      setSelectedContentId(null);
      resetNewReport();
      await loadModerationReports();
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const castVote = async (reportId: string, vote: 'guilty' | 'innocent' | 'abstain', reason?: string) => {
    if (!isConnected || !account) return;

    try {
      // Require minimum stake to vote
      if (parseFloat(userStake) < 10) {
        alert('You need to stake at least 10 LIB tokens to participate in moderation voting.');
        return;
      }

      await executeTransaction('libertyDAO', 'castModerationVote', [
        reportId,
        vote === 'guilty' ? 1 : vote === 'innocent' ? 2 : 3,
        reason || ''
      ]);

      await loadUserVotes();
      await loadModerationReports();
    } catch (error) {
      console.error('Failed to cast vote:', error);
    }
  };

  const stakeForModeration = async (amount: string) => {
    if (!isConnected || !account) return;

    try {
      await executeTransaction('libertyDAO', 'stakeLIBForModeration', [amount]);
      await loadUserStake();
    } catch (error) {
      console.error('Failed to stake tokens:', error);
    }
  };

  const fetchModerationReportsFromChain = async (): Promise<ModerationReport[]> => {
    // Mock implementation
    return [
      {
        id: '1',
        contentId: 123,
        reportedBy: '0x1234...5678',
        reportType: 'inappropriate',
        description: 'Content contains inappropriate material that violates community guidelines.',
        timestamp: Date.now() / 1000 - 3600,
        status: 'under_review',
        votes: { guilty: 15, innocent: 8, abstain: 2 },
        requiredVotes: 25,
        deadline: Date.now() / 1000 + 86400
      },
      {
        id: '2',
        contentId: 456,
        reportedBy: '0x5678...9012',
        reportType: 'spam',
        description: 'This content appears to be spam and low quality.',
        timestamp: Date.now() / 1000 - 7200,
        status: 'resolved',
        votes: { guilty: 30, innocent: 5, abstain: 1 },
        requiredVotes: 25,
        deadline: Date.now() / 1000 - 3600,
        resolution: {
          action: 'content_removal',
          reason: 'Community voted to remove spam content',
          executedAt: Date.now() / 1000 - 1800
        }
      }
    ];
  };

  const fetchUserVotesFromChain = async (_userAddress: string): Promise<ModerationVote[]> => {
    // Mock implementation
    return [];
  };

  const getUserModerationStake = async (_userAddress: string): Promise<string> => {
    // Mock implementation
    return '25.5';
  };

  const updateReportVotes = (reportId: string, voteType: number) => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const votes = { ...report.votes };
        if (voteType === 1) votes.guilty++;
        else if (voteType === 2) votes.innocent++;
        else votes.abstain++;
        return { ...report, votes };
      }
      return report;
    }));
  };

  const updateReportStatus = (reportId: string, status: ModerationReport['status'], resolution?: any) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, status, resolution } : report
    ));
  };

  const resetNewReport = () => {
    setNewReport({
      reportType: 'inappropriate',
      description: '',
      evidence: []
    });
  };

  const hasUserVoted = (reportId: string): boolean => {
    return userVotes.some(vote => vote.reportId === reportId);
  };

  const getReportTypeColor = (type: ModerationReport['reportType']) => {
    switch (type) {
      case 'spam': return 'bg-yellow-100 text-yellow-800';
      case 'harassment': return 'bg-red-100 text-red-800';
      case 'inappropriate': return 'bg-orange-100 text-orange-800';
      case 'copyright': return 'bg-purple-100 text-purple-800';
      case 'misinformation': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ModerationReport['status']) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'under_review': return <Vote className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'dismissed': return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const ReportCard: React.FC<{ report: ModerationReport }> = ({ report }) => {
    const totalVotes = report.votes.guilty + report.votes.innocent + report.votes.abstain;
    const guiltyPercentage = totalVotes > 0 ? (report.votes.guilty / totalVotes) * 100 : 0;
    const innocentPercentage = totalVotes > 0 ? (report.votes.innocent / totalVotes) * 100 : 0;
    const userHasVoted = hasUserVoted(report.id);

    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(report.status)}
            <div>
              <h3 className="font-semibold text-gray-900">Content #{report.contentId}</h3>
              <p className="text-sm text-gray-600">
                Reported by {report.reportedBy.slice(0, 6)}...{report.reportedBy.slice(-4)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.reportType)}`}>
            {report.reportType.replace('_', ' ')}
          </span>
        </div>

        <p className="text-gray-700 mb-4">{report.description}</p>

        {report.status === 'under_review' && (
          <div className="space-y-3 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Voting Progress</span>
              <span>{totalVotes}/{report.requiredVotes} votes</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">Guilty ({report.votes.guilty})</span>
                <span>{guiltyPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${guiltyPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Innocent ({report.votes.innocent})</span>
                <span>{innocentPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${innocentPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Deadline: {new Date(report.deadline * 1000).toLocaleString()}
            </div>

            {isConnected && !userHasVoted && parseFloat(userStake) >= 10 && (
              <div className="flex space-x-2 pt-3">
                <button
                  onClick={() => castVote(report.id, 'guilty')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Vote Guilty
                </button>
                <button
                  onClick={() => castVote(report.id, 'innocent')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Vote Innocent
                </button>
                <button
                  onClick={() => castVote(report.id, 'abstain')}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                >
                  Abstain
                </button>
              </div>
            )}

            {userHasVoted && (
              <div className="text-sm text-blue-600 pt-3">
                ✓ You have already voted on this report
              </div>
            )}
          </div>
        )}

        {report.resolution && (
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium text-sm">Resolution</span>
            </div>
            <p className="text-sm text-gray-700">{report.resolution.reason}</p>
            <p className="text-xs text-gray-500 mt-1">
              Action: {report.resolution.action.replace('_', ' ')} • 
              {new Date(report.resolution.executedAt * 1000).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Community Moderation</h2>
        </div>
        
        {isConnected && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Staked: {userStake} LIB
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Flag className="w-4 h-4" />
              <span>Report Content</span>
            </button>
          </div>
        )}
      </div>

      {parseFloat(userStake) < 10 && isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Stake LIB tokens to participate in moderation
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                You need at least 10 LIB tokens staked to vote on moderation reports.
              </p>
            </div>
          </div>
          <button
            onClick={() => stakeForModeration('10')}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
          >
            Stake 10 LIB
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'pending', label: 'Pending Reports', count: reports.filter(r => r.status === 'pending').length },
            { id: 'voting', label: 'Under Review', count: reports.filter(r => r.status === 'under_review').length },
            { id: 'resolved', label: 'Resolved', count: reports.filter(r => r.status === 'resolved').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Reports */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading reports...</p>
          </div>
        ) : (
          reports
            .filter(report => {
              if (activeTab === 'pending') return report.status === 'pending';
              if (activeTab === 'voting') return report.status === 'under_review';
              if (activeTab === 'resolved') return report.status === 'resolved' || report.status === 'dismissed';
              return true;
            })
            .map(report => <ReportCard key={report.id} report={report} />)
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Report Content</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content ID
                </label>
                <input
                  type="number"
                  value={selectedContentId || ''}
                  onChange={(e) => setSelectedContentId(parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter content ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={newReport.reportType}
                  onChange={(e) => setNewReport(prev => ({ ...prev, reportType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  rows={4}
                  placeholder="Explain why you're reporting this content..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!selectedContentId || !newReport.description}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};