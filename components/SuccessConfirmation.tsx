import React from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface NextStep {
  label: string;
  description: string;
  action: () => void;
  primary?: boolean;
}

interface SuccessConfirmationProps {
  title: string;
  message: string;
  transactionHash?: string;
  nextSteps?: NextStep[];
  onClose?: () => void;
  className?: string;
}

export const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  title,
  message,
  transactionHash,
  nextSteps = [],
  onClose,
  className = ''
}) => {
  const truncateHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show a small toast here
  };

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-8 w-8 text-green-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-green-800">
              {title}
            </h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-green-400 hover:text-green-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <p className="text-green-700 mt-2">
            {message}
          </p>

          {/* Transaction Hash */}
          {transactionHash && (
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-800 mb-1">
                    Transaction Hash
                  </p>
                  <code className="text-sm font-mono text-green-700">
                    {truncateHash(transactionHash)}
                  </code>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(transactionHash)}
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    Copy
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                What's next?
              </h4>
              <div className="space-y-3">
                {nextSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      step.primary 
                        ? 'bg-green-100 border border-green-300' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.primary ? 'text-green-900' : 'text-green-800'
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-xs mt-1 ${
                        step.primary ? 'text-green-700' : 'text-green-600'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                    <button
                      onClick={step.action}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                        step.primary
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                      }`}
                    >
                      <span>{step.primary ? 'Continue' : 'Go'}</span>
                      <ArrowRightIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default action if no next steps */}
          {nextSteps.length === 0 && (
            <div className="mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Predefined success configurations for common actions
export const createSuccessConfig = {
  contentUpload: (hash: string, contentId: string, onViewContent: () => void, onUploadMore: () => void) => ({
    title: 'Content Uploaded Successfully!',
    message: 'Your content has been permanently stored on Arweave and registered on the blockchain.',
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Your Content',
        description: 'See how your content appears to viewers',
        action: onViewContent,
        primary: true
      },
      {
        label: 'Upload More Content',
        description: 'Continue building your content library',
        action: onUploadMore
      }
    ]
  }),

  creatorRegistration: (hash: string, onViewProfile: () => void, onUploadContent: () => void) => ({
    title: 'Creator Registration Complete!',
    message: 'Welcome to LibertyX! Your creator profile has been registered on the blockchain.',
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Your Profile',
        description: 'Check out your new creator profile',
        action: onViewProfile,
        primary: true
      },
      {
        label: 'Upload Your First Content',
        description: 'Start sharing content with your audience',
        action: onUploadContent
      }
    ]
  }),

  subscription: (hash: string, creatorName: string, onViewContent: () => void, onManageSubscriptions: () => void) => ({
    title: 'Subscription Activated!',
    message: `You're now subscribed to ${creatorName}. Enjoy exclusive access to their content!`,
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Exclusive Content',
        description: 'Access subscriber-only content',
        action: onViewContent,
        primary: true
      },
      {
        label: 'Manage Subscriptions',
        description: 'View all your active subscriptions',
        action: onManageSubscriptions
      }
    ]
  }),

  nftMint: (hash: string, tierName: string, onViewNFT: () => void, onViewContent: () => void) => ({
    title: 'NFT Minted Successfully!',
    message: `You've successfully minted the "${tierName}" NFT and gained access to premium content.`,
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Your NFT',
        description: 'See your new NFT in your collection',
        action: onViewNFT,
        primary: true
      },
      {
        label: 'Access Premium Content',
        description: 'Enjoy your NFT-gated content',
        action: onViewContent
      }
    ]
  }),

  withdrawal: (hash: string, amount: string, token: string, onViewEarnings: () => void) => ({
    title: 'Withdrawal Successful!',
    message: `${amount} ${token} has been transferred to your wallet.`,
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Earnings Dashboard',
        description: 'Track your content performance and earnings',
        action: onViewEarnings,
        primary: true
      }
    ]
  }),

  proposalCreation: (hash: string, onViewProposal: () => void, onViewGovernance: () => void) => ({
    title: 'Proposal Created!',
    message: 'Your governance proposal has been submitted and is now open for voting.',
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Your Proposal',
        description: 'See your proposal and track votes',
        action: onViewProposal,
        primary: true
      },
      {
        label: 'Browse All Proposals',
        description: 'Participate in other governance decisions',
        action: onViewGovernance
      }
    ]
  }),

  vote: (hash: string, proposalTitle: string, onViewResults: () => void) => ({
    title: 'Vote Recorded!',
    message: `Your vote on "${proposalTitle}" has been recorded on the blockchain.`,
    transactionHash: hash,
    nextSteps: [
      {
        label: 'View Results',
        description: 'See current voting results',
        action: onViewResults,
        primary: true
      }
    ]
  })
};

export default SuccessConfirmation;