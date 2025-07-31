import React, { useState, useEffect, useRef } from 'react';
import { PromotionalVideo, VideoMetadata } from '../../types/promotional-video';
import { promotionalVideoService } from '../../lib/promotionalVideoService';
// import { analyticsService } from '../../lib/analyticsService';
import VideoScheduler from './VideoScheduler';

interface AdminVideoManagerProps {
  className?: string;
}

const AdminVideoManager: React.FC<AdminVideoManagerProps> = ({ className = '' }) => {
  const [videos, setVideos] = useState<PromotionalVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<PromotionalVideo | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerVideo, setSchedulerVideo] = useState<PromotionalVideo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    priority: 0
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const allVideos = await promotionalVideoService.getAllVideos();
      setVideos(allVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!uploadForm.title.trim()) {
      alert('Please enter a title for the video');
      setShowUploadForm(true);
      return;
    }

    try {
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return 0;
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const metadata: VideoMetadata = {
        title: uploadForm.title,
        description: uploadForm.description,
        priority: uploadForm.priority
      };

      await promotionalVideoService.uploadVideo(file, metadata);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form and reload videos
      setUploadForm({ title: '', description: '', priority: 0 });
      setShowUploadForm(false);
      await loadVideos();
      
      setTimeout(() => setUploadProgress(null), 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploadProgress(null);
    }
  };

  const handleToggleStatus = async (videoId: string, isActive: boolean) => {
    try {
      await promotionalVideoService.toggleVideoStatus(videoId, isActive);
      await loadVideos();
    } catch (error) {
      console.error('Failed to toggle video status:', error);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await promotionalVideoService.deleteVideo(videoId);
      await loadVideos();
      if (selectedVideo?.id === videoId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const handleOpenScheduler = (video: PromotionalVideo) => {
    setSchedulerVideo(video);
    setShowScheduler(true);
  };

  const handleCloseScheduler = () => {
    setShowScheduler(false);
    setSchedulerVideo(null);
  };

  const handleSchedulerSave = async () => {
    await loadVideos();
    handleCloseScheduler();
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className={className}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
          Video Management
        </h1>
        <p style={{ color: 'var(--text-secondary, #888)' }}>
          Upload and manage promotional videos for the landing page
        </p>
      </div>

      {/* Upload Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary, #007bff)' : 'var(--border, #374151)'}`,
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(0, 123, 255, 0.05)' : 'var(--background-secondary, #1f2937)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {uploadProgress !== null ? (
            <div>
              <div style={{ marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>
                Uploading... {Math.round(uploadProgress)}%
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--border, #374151)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary, #007bff)',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📹</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
                Drop video files here or click to browse
              </h3>
              <p style={{ color: 'var(--text-secondary, #888)', marginBottom: '16px' }}>
                Supports MP4 and WebM files up to 100MB
              </p>
              
              {!showUploadForm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUploadForm(true);
                  }}
                  style={{
                    backgroundColor: 'var(--primary, #007bff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                >
                  Set Video Details
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upload Form */}
        {showUploadForm && (
          <div style={{
            marginTop: '16px',
            padding: '24px',
            backgroundColor: 'var(--background-secondary, #1f2937)',
            borderRadius: '8px',
            border: '1px solid var(--border, #374151)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>
              Video Details
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background, #111827)',
                    border: '1px solid var(--border, #374151)',
                    borderRadius: '6px',
                    color: 'var(--text-primary, #fff)'
                  }}
                  placeholder="Enter video title"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background, #111827)',
                    border: '1px solid var(--border, #374151)',
                    borderRadius: '6px',
                    color: 'var(--text-primary, #fff)',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter video description"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
                  Priority
                </label>
                <input
                  type="number"
                  value={uploadForm.priority}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background, #111827)',
                    border: '1px solid var(--border, #374151)',
                    borderRadius: '6px',
                    color: 'var(--text-primary, #fff)'
                  }}
                  placeholder="0"
                />
                <small style={{ display: 'block', marginTop: '4px', color: 'var(--text-secondary, #888)' }}>
                  Higher numbers have higher priority
                </small>
              </div>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowUploadForm(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary, #888)',
                  border: '1px solid var(--border, #374151)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Videos List */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary, #fff)' }}>
          Uploaded Videos ({videos.length})
        </h2>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #888)' }}>
            Loading videos...
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary, #888)' }}>
            No videos uploaded yet
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {videos.map((video) => (
              <div
                key={video.id}
                style={{
                  backgroundColor: 'var(--background-secondary, #1f2937)',
                  border: '1px solid var(--border, #374151)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: '120px',
                  height: '68px',
                  backgroundColor: 'var(--background, #111827)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                
                {/* Video Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary, #fff)' }}>
                      {video.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: video.isActive ? '#10b981' : '#6b7280',
                      color: 'white'
                    }}>
                      {video.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--primary, #007bff)',
                      color: 'white'
                    }}>
                      Priority: {video.priority}
                    </span>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary, #888)', marginBottom: '8px' }}>
                    {video.description || 'No description'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--text-secondary, #888)', marginBottom: '8px' }}>
                    <span>Duration: {formatDuration(video.duration)}</span>
                    <span>Size: {formatFileSize(video.fileSize)}</span>
                    <span>Format: {video.format.toUpperCase()}</span>
                    <span>Created: {formatDate(video.createdAt)}</span>
                  </div>
                  
                  {video.schedule && (
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary, #888)' }}>
                      <span>📅 Scheduled: {formatDate(video.schedule.startDate)} - {formatDate(video.schedule.endDate)}</span>
                      {video.schedule.isRecurring && (
                        <span style={{ marginLeft: '8px' }}>🔄 Recurring</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleStatus(video.id, !video.isActive)}
                    style={{
                      backgroundColor: video.isActive ? '#dc2626' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {video.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => handleOpenScheduler(video)}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--primary, #007bff)',
                      border: '1px solid var(--primary, #007bff)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Schedule
                  </button>
                  
                  <button
                    onClick={() => setSelectedVideo(video)}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #888)',
                      border: '1px solid var(--border, #374151)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Details
                  </button>
                  
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Scheduler Modal */}
      {showScheduler && schedulerVideo && (
        <VideoScheduler
          video={schedulerVideo}
          onClose={handleCloseScheduler}
          onSave={handleSchedulerSave}
        />
      )}
    </div>
  );
};

export default AdminVideoManager;