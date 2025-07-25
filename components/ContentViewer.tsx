import React, { useState, useEffect } from 'react';
import { useArweave } from '../hooks/useArweave';

interface ContentViewerProps {
  arweaveId: string;
  contentType: string;
  title?: string;
  description?: string;
  className?: string;
}

const ContentViewer: React.FC<ContentViewerProps> = ({
  arweaveId,
  contentType,
  title,
  description,
  className = '',
}) => {
  const { getContentUrl, getContentMetadata } = useArweave();
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentUrl = getContentUrl(arweaveId);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setLoading(true);
        const meta = await getContentMetadata(arweaveId);
        setMetadata(meta);
      } catch (err: any) {
        setError(err.message || 'Failed to load content metadata');
      } finally {
        setLoading(false);
      }
    };

    if (arweaveId) {
      loadMetadata();
    }
  }, [arweaveId, getContentMetadata]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">Failed to load content</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      );
    }

    // Render based on content type
    if (contentType.startsWith('image/')) {
      return (
        <img
          src={contentUrl}
          alt={title || 'Arweave content'}
          className="w-full h-auto rounded-lg shadow-md"
          onError={() => setError('Failed to load image')}
        />
      );
    }

    if (contentType.startsWith('video/')) {
      return (
        <video
          src={contentUrl}
          controls
          className="w-full h-auto rounded-lg shadow-md"
          onError={() => setError('Failed to load video')}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (contentType.startsWith('audio/')) {
      return (
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{title || 'Audio Content'}</h3>
              <p className="text-sm text-gray-500">Audio file</p>
            </div>
          </div>
          <audio
            src={contentUrl}
            controls
            className="w-full"
            onError={() => setError('Failed to load audio')}
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (contentType === 'application/pdf') {
      return (
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{title || 'PDF Document'}</h3>
              <p className="text-sm text-gray-500">PDF file</p>
            </div>
          </div>
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open PDF
          </a>
        </div>
      );
    }

    if (contentType === 'text/plain') {
      return (
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{title || 'Text Document'}</h3>
              <p className="text-sm text-gray-500">Text file</p>
            </div>
          </div>
          <iframe
            src={contentUrl}
            className="w-full h-96 border border-gray-300 rounded-md"
            title={title || 'Text content'}
          />
        </div>
      );
    }

    // Fallback for unknown content types
    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title || 'Unknown Content'}</h3>
            <p className="text-sm text-gray-500">{contentType}</p>
          </div>
        </div>
        <a
          href={contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Content
        </a>
      </div>
    );
  };

  return (
    <div className={`arweave-content-viewer ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>}
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      )}
      
      {renderContent()}
      
      {/* Metadata Display */}
      {metadata && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Arweave Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Transaction ID:</span>
              <p className="font-mono text-xs break-all">{arweaveId}</p>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>
              <p>{metadata.data_size} bytes</p>
            </div>
            {metadata.tags && Object.keys(metadata.tags).length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Tags:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(metadata.tags).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {key}: {value as string}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentViewer;