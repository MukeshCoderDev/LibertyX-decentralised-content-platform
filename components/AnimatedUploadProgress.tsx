import React, { useState, useEffect } from 'react';

interface AnimatedUploadProgressProps {
  isUploading: boolean;
  progress?: number;
  stage: 'preparing' | 'uploading' | 'confirming' | 'complete';
  fileName?: string;
}

const AnimatedUploadProgress: React.FC<AnimatedUploadProgressProps> = ({
  isUploading,
  progress = 0,
  stage,
  fileName
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (isUploading) {
      setPulseAnimation(true);
      const interval = setInterval(() => {
        setDisplayProgress(prev => {
          if (prev < progress) {
            return Math.min(prev + 2, progress);
          }
          return prev;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isUploading, progress]);

  const getStageInfo = () => {
    switch (stage) {
      case 'preparing':
        return {
          icon: '🔄',
          title: 'Preparing Upload',
          description: 'Processing your video for permanent storage...',
          color: 'blue'
        };
      case 'uploading':
        return {
          icon: '🚀',
          title: 'Uploading to Arweave',
          description: 'Storing your content permanently on the permaweb...',
          color: 'purple'
        };
      case 'confirming':
        return {
          icon: '⏳',
          title: 'Confirming Transaction',
          description: 'Finalizing your permanent storage transaction...',
          color: 'orange'
        };
      case 'complete':
        return {
          icon: '✅',
          title: 'Upload Complete!',
          description: 'Your content is now permanently stored forever!',
          color: 'green'
        };
      default:
        return {
          icon: '📁',
          title: 'Ready',
          description: 'Ready to upload',
          color: 'gray'
        };
    }
  };

  const stageInfo = getStageInfo();

  if (!isUploading && stage !== 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Animated Icon */}
        <div className="text-center mb-6">
          <div className={`text-6xl mb-4 ${pulseAnimation ? 'animate-pulse' : ''}`}>
            {stageInfo.icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {stageInfo.title}
          </h3>
          <p className="text-gray-600">
            {stageInfo.description}
          </p>
        </div>

        {/* File Info */}
        {fileName && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600">Uploading:</p>
            <p className="font-medium text-gray-900 truncate">{fileName}</p>
          </div>
        )}

        {/* Progress Bar */}
        {stage !== 'complete' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{displayProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
                  stageInfo.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  stageInfo.color === 'purple' ? 'from-purple-500 to-purple-600' :
                  stageInfo.color === 'orange' ? 'from-orange-500 to-orange-600' :
                  'from-green-500 to-green-600'
                }`}
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Arweave Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🌐</div>
            <div>
              <h4 className="font-semibold text-purple-800">Permanent Storage</h4>
              <p className="text-sm text-purple-700">
                Your content will be stored forever on Arweave's decentralized network
              </p>
            </div>
          </div>
        </div>

        {/* Success Actions */}
        {stage === 'complete' && (
          <div className="mt-6 space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              View on Arweave
            </button>
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors">
              Continue to Dashboard
            </button>
          </div>
        )}

        {/* Loading Animation */}
        {stage !== 'complete' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm">Please don't close this window...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedUploadProgress;