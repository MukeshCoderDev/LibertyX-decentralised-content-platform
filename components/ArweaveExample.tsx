import React, { useState } from 'react';
import ContentUpload from './ContentUpload';
import ContentViewer from './ContentViewer';
import Button from './ui/Button';

const ArweaveExample: React.FC = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<{
    arweaveId: string;
    contentType: string;
    title: string;
    description: string;
  } | null>(null);

  const handleUploadComplete = (result: { arweaveResult: any; txHash?: string }) => {
    console.log('Upload completed:', result);
    
    // Store the uploaded content info for viewing
    setUploadedContent({
      arweaveId: result.arweaveResult.transactionId,
      contentType: result.arweaveResult.contentType,
      title: 'Uploaded Content', // You'd get this from the metadata
      description: 'Content uploaded to Arweave',
    });
    
    setShowUpload(false);
    
    // Show success message
    alert(`Content uploaded successfully!\nArweave ID: ${result.arweaveResult.transactionId}\nBlockchain TX: ${result.txHash || 'Pending'}`);
  };

  const handleUploadCancel = () => {
    setShowUpload(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Arweave Integration Demo</h1>
      
      {/* Upload Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Upload Content</h2>
          {!showUpload && (
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Upload New Content
            </Button>
          )}
        </div>
        
        {showUpload && (
          <ContentUpload
            onUploadComplete={handleUploadComplete}
            onCancel={handleUploadCancel}
          />
        )}
      </div>

      {/* Viewer Section */}
      {uploadedContent && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Content</h2>
          <ContentViewer
            arweaveId={uploadedContent.arweaveId}
            contentType={uploadedContent.contentType}
            title={uploadedContent.title}
            description={uploadedContent.description}
          />
        </div>
      )}

      {/* Example Content Viewer */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Example: View Existing Arweave Content</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            Enter an Arweave transaction ID to view content:
          </p>
          <ExampleViewer />
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Arweave Integration Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-blue-700 mb-2">Upload Features:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Drag & drop file upload</li>
              <li>• Progress tracking</li>
              <li>• Retry logic with exponential backoff</li>
              <li>• ArConnect wallet integration</li>
              <li>• Metadata tagging</li>
              <li>• On-chain registration</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-700 mb-2">Viewer Features:</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Multi-format support (images, videos, audio, PDF, text)</li>
              <li>• Automatic content type detection</li>
              <li>• Metadata display</li>
              <li>• Error handling</li>
              <li>• Loading states</li>
              <li>• Responsive design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example component for testing existing Arweave content
const ExampleViewer: React.FC = () => {
  const [arweaveId, setArweaveId] = useState('');
  const [showViewer, setShowViewer] = useState(false);

  const handleView = () => {
    if (arweaveId.trim()) {
      setShowViewer(true);
    }
  };

  return (
    <div>
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={arweaveId}
          onChange={(e) => setArweaveId(e.target.value)}
          placeholder="Enter Arweave transaction ID (e.g., abc123...)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          onClick={handleView}
          disabled={!arweaveId.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          View
        </Button>
      </div>
      
      {showViewer && arweaveId && (
        <div className="mt-4">
          <ContentViewer
            arweaveId={arweaveId}
            contentType="application/octet-stream" // Will be detected automatically
            title="External Arweave Content"
            description="Content loaded from Arweave network"
          />
        </div>
      )}
    </div>
  );
};

export default ArweaveExample;