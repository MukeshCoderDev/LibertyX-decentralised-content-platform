import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Shuffle, Eye, EyeOff, ArrowRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface MixingTransaction {
  id: string;
  amount: string;
  token: string;
  status: 'pending' | 'mixing' | 'completed' | 'failed';
  depositTxHash: string;
  withdrawTxHash?: string;
  mixingPool: string;
  anonymitySet: number;
  createdAt: number;
  completedAt?: number;
  estimatedTime: number;
}

interface MixingPool {
  id: string;
  token: string;
  denomination: string;
  totalDeposits: number;
  anonymitySet: number;
  fee: string;
  minDelay: number;
  maxDelay: number;
  isActive: boolean;
}

interface PrivacyMixingProps {
  className?: string;
}

export const PrivacyMixing: React.FC<PrivacyMixingProps> = ({
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction } = useContractManager();
  const [mixingPools, setMixingPools] = useState<MixingPool[]>([]);
  const [userTransactions, setUserTransactions] = useState<MixingTransaction[]>([]);
  const [selectedPool, setSelectedPool] = useState<MixingPool | null>(null);
  const [mixingAmount, setMixingAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isMixing, setIsMixing] = useState(false);
  const [showPrivateData, setShowPrivateData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMixingPools();
    if (isConnected && account) {
      loadUserTransactions();
    }
  }, [isConnected, account]);

  const loadMixingPools = async () => {
    try {
      setLoading(true);
      const pools = await fetchMixingPoolsFromChain();
      setMixingPools(pools);
      if (pools.length > 0) {
        setSelectedPool(pools[0]);
      }
    } catch (error) {
      console.error('Failed to load mixing pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTransactions = async () => {
    try {
      const transactions = await fetchUserMixingTransactions();
      setUserTransactions(transactions);
    } catch (error) {
      console.error('Failed to load user transactions:', error);
    }
  };

  const depositToMixer = async () => {
    if (!isConnected || !account || !selectedPool || !mixingAmount || !withdrawAddress) return;

    try {
      setIsMixing(true);

      // Validate amount matches pool denomination
      if (mixingAmount !== selectedPool.denomination) {
        alert(`Amount must be exactly ${selectedPool.denomination} ${selectedPool.token}`);
        return;
      }

      // Generate commitment hash for privacy
      const commitment = await generateCommitment();

      // Deposit to mixing pool
      await executeTransaction('privacyMixer', 'deposit', [
        selectedPool.id,
        commitment.hash,
        withdrawAddress
      ], {
        value: selectedPool.token === 'ETH' ? mixingAmount : undefined
      });

      // Store commitment locally (encrypted)
      await storeCommitmentLocally(commitment);

      // Reset form
      setMixingAmount('');
      setWithdrawAddress('');
      
      // Reload transactions
      await loadUserTransactions();
    } catch (error) {
      console.error('Failed to deposit to mixer:', error);
    } finally {
      setIsMixing(false);
    }
  };

  const withdrawFromMixer = async (transaction: MixingTransaction) => {
    if (!isConnected || !account) return;

    try {
      // Get commitment from local storage
      const commitment = await getStoredCommitment(transaction.id);
      if (!commitment) {
        alert('Commitment not found. Cannot withdraw.');
        return;
      }

      // Generate zero-knowledge proof
      const proof = await generateWithdrawProof(commitment, transaction);

      // Submit withdrawal
      await executeTransaction('privacyMixer', 'withdraw', [
        proof.proof,
        proof.publicSignals,
        transaction.withdrawTxHash || account
      ]);

      // Update transaction status
      await loadUserTransactions();
    } catch (error) {
      console.error('Failed to withdraw from mixer:', error);
    }
  };

  const generateCommitment = async () => {
    // Generate random nullifier and secret
    const nullifier = window.crypto.getRandomValues(new Uint8Array(32));
    const secret = window.crypto.getRandomValues(new Uint8Array(32));

    // Create commitment hash
    const commitment = await hashCommitment(nullifier, secret);

    return {
      nullifier: Array.from(nullifier),
      secret: Array.from(secret),
      hash: commitment
    };
  };

  const hashCommitment = async (nullifier: Uint8Array, secret: Uint8Array): Promise<string> => {
    // Combine nullifier and secret
    const combined = new Uint8Array(nullifier.length + secret.length);
    combined.set(nullifier);
    combined.set(secret, nullifier.length);

    // Hash the combined data
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return '0x' + hashHex;
  };

  const storeCommitmentLocally = async (commitment: any) => {
    // In production, this would be encrypted and stored securely
    const commitments = JSON.parse(localStorage.getItem('mixingCommitments') || '{}');
    commitments[commitment.hash] = commitment;
    localStorage.setItem('mixingCommitments', JSON.stringify(commitments));
  };

  const getStoredCommitment = async (transactionId: string) => {
    // Mock implementation - would retrieve by transaction ID
    const commitments = JSON.parse(localStorage.getItem('mixingCommitments') || '{}');
    return Object.values(commitments)[0]; // Simplified
  };

  const generateWithdrawProof = async (commitment: any, transaction: MixingTransaction) => {
    // Mock ZK proof generation for withdrawal
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      proof: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      publicSignals: [transaction.mixingPool, commitment.hash]
    };
  };

  const fetchMixingPoolsFromChain = async (): Promise<MixingPool[]> => {
    // Mock implementation
    return [
      {
        id: 'eth-0.1',
        token: 'ETH',
        denomination: '0.1',
        totalDeposits: 1250,
        anonymitySet: 847,
        fee: '0.001',
        minDelay: 300, // 5 minutes
        maxDelay: 3600, // 1 hour
        isActive: true
      },
      {
        id: 'eth-1.0',
        token: 'ETH',
        denomination: '1.0',
        totalDeposits: 523,
        anonymitySet: 312,
        fee: '0.01',
        minDelay: 600, // 10 minutes
        maxDelay: 7200, // 2 hours
        isActive: true
      },
      {
        id: 'lib-100',
        token: 'LIB',
        denomination: '100',
        totalDeposits: 2847,
        anonymitySet: 1523,
        fee: '1',
        minDelay: 180, // 3 minutes
        maxDelay: 1800, // 30 minutes
        isActive: true
      }
    ];
  };

  const fetchUserMixingTransactions = async (): Promise<MixingTransaction[]> => {
    // Mock implementation
    return [
      {
        id: '1',
        amount: '0.1',
        token: 'ETH',
        status: 'mixing',
        depositTxHash: '0xabc123...',
        mixingPool: 'eth-0.1',
        anonymitySet: 847,
        createdAt: Date.now() / 1000 - 1800,
        estimatedTime: 3600
      }
    ];
  };

  const getStatusColor = (status: MixingTransaction['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'mixing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const getStatusIcon = (status: MixingTransaction['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'mixing': return <Shuffle className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const PoolCard: React.FC<{ pool: MixingPool; isSelected: boolean }> = ({ pool, isSelected }) => (
    <button
      onClick={() => setSelectedPool(pool)}
      className={`w-full p-4 border rounded-lg text-left transition-colors ${
        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">
          {pool.denomination} {pool.token}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          pool.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {pool.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Anonymity Set:</span>
          <span className="font-medium">{pool.anonymitySet.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Deposits:</span>
          <span className="font-medium">{pool.totalDeposits.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Fee:</span>
          <span className="font-medium">{pool.fee} {pool.token}</span>
        </div>
        <div className="flex justify-between">
          <span>Delay:</span>
          <span className="font-medium">
            {formatTime(pool.minDelay)} - {formatTime(pool.maxDelay)}
          </span>
        </div>
      </div>
    </button>
  );

  const TransactionCard: React.FC<{ transaction: MixingTransaction }> = ({ transaction }) => (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            {getStatusIcon(transaction.status)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {transaction.amount} {transaction.token}
            </h3>
            <p className="text-sm text-gray-600">Pool: {transaction.mixingPool}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>Anonymity Set:</span>
          <span>{transaction.anonymitySet.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Deposit Hash:</span>
          <span className="font-mono text-xs">
            {showPrivateData ? transaction.depositTxHash : transaction.depositTxHash.slice(0, 10) + '...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Created:</span>
          <span>{new Date(transaction.createdAt * 1000).toLocaleString()}</span>
        </div>
        {transaction.status === 'mixing' && (
          <div className="flex justify-between">
            <span>Est. Completion:</span>
            <span>{formatTime(transaction.estimatedTime - (Date.now() / 1000 - transaction.createdAt))}</span>
          </div>
        )}
      </div>

      {transaction.status === 'completed' && (
        <button
          onClick={() => withdrawFromMixer(transaction)}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Withdraw</span>
        </button>
      )}
    </div>
  );

  if (!isConnected) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-8 text-center ${className}`}>
        <Shuffle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Mixing</h3>
        <p className="text-gray-600">
          Connect your wallet to use privacy mixing for enhanced transaction anonymity.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shuffle className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy Mixing</h2>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Shuffle className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-purple-900">Enhanced Transaction Privacy</h3>
              <p className="text-sm text-purple-700 mt-1">
                Mix your transactions with others to break the link between your deposit and withdrawal addresses. 
                Higher anonymity sets provide better privacy protection.
              </p>
            </div>
          </div>
        </div>

        {/* Mixing Pools */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Available Mixing Pools</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading mixing pools...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mixingPools.map(pool => (
                <PoolCard
                  key={pool.id}
                  pool={pool}
                  isSelected={selectedPool?.id === pool.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Deposit Form */}
        {selectedPool && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">
              Deposit to {selectedPool.denomination} {selectedPool.token} Pool
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({selectedPool.token})
                </label>
                <input
                  type="text"
                  value={mixingAmount}
                  onChange={(e) => setMixingAmount(e.target.value)}
                  placeholder={selectedPool.denomination}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be exactly {selectedPool.denomination} {selectedPool.token}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Address
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use a different address for maximum privacy
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Privacy Notice:</p>
                    <p>
                      Mixing takes {formatTime(selectedPool.minDelay)} to {formatTime(selectedPool.maxDelay)}. 
                      Fee: {selectedPool.fee} {selectedPool.token}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={depositToMixer}
                disabled={isMixing || !mixingAmount || !withdrawAddress}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isMixing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Depositing...</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4" />
                    <span>Deposit & Mix</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* User Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Mixing Transactions</h3>
            <button
              onClick={() => setShowPrivateData(!showPrivateData)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {showPrivateData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPrivateData ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>

          {userTransactions.length > 0 ? (
            <div className="space-y-4">
              {userTransactions.map(transaction => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shuffle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No mixing transactions yet.</p>
              <p className="text-sm">Deposit to a mixing pool to enhance your privacy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};