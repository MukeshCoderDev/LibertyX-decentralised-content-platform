import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { mockCommentService, Comment } from '../lib/mockCommentService';
import { MessageCircle, ThumbsUp, ThumbsDown, Flag, Reply, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface CommentSystemProps {
  contentId: number;
  creatorAddress: string;
  className?: string;
}

export const CommentSystem: React.FC<CommentSystemProps> = ({
  contentId,
  creatorAddress,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [retryingComments, setRetryingComments] = useState<Set<string>>(new Set());
  const [isCommentBoxCollapsed, setIsCommentBoxCollapsed] = useState(false);

  useEffect(() => {
    loadComments();
    
    // Subscribe to real-time comment updates
    const unsubscribe = mockCommentService.subscribeToComments(contentId, (updatedComments) => {
      setComments(updatedComments);
    });

    return unsubscribe;
  }, [contentId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const commentsData = await mockCommentService.getComments(contentId);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    if (!isConnected || !account || !newComment.trim()) {
      console.log('Submit blocked:', { isConnected, account, newComment: newComment.trim() });
      return;
    }

    const commentText = newComment.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    console.log('Submitting comment:', commentText);
    
    // Create optimistic comment for immediate display
    const optimisticComment: Comment = {
      id: tempId,
      contentId,
      author: account,
      authorAvatar: mockCommentService.generateUserAvatar(account),
      message: commentText,
      timestamp: Date.now(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isVerified: false,
      parentId: replyingTo || undefined,
      isPending: true,
      localId: tempId
    };

    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages
      
      // Add optimistic comment immediately
      setPendingComments(prev => [...prev, optimisticComment]);
      
      // Clear input immediately for better UX - this is the key fix!
      setNewComment('');
      setReplyingTo(null);
      
      console.log('Input cleared, submitting to service...');

      // Submit to mock service (simulates blockchain)
      const confirmedComment = await mockCommentService.addComment(
        contentId,
        commentText,
        account,
        replyingTo || undefined
      );

      console.log('Comment submitted successfully:', confirmedComment);

      // Remove from pending and let the subscription update handle the confirmed comment
      setPendingComments(prev => prev.filter(c => c.id !== tempId));
      
      // Show success message briefly
      setSuccessMessage('Comment posted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Collapse comment box after successful submission (YouTube-style)
      setIsCommentBoxCollapsed(true);
      setTimeout(() => setIsCommentBoxCollapsed(false), 2000); // Expand again after 2 seconds
      
    } catch (error) {
      console.error('Failed to submit comment:', error);
      
      // On error, restore the comment text so user doesn't lose it
      setNewComment(commentText);
      
      // Mark comment as error for retry
      setPendingComments(prev => 
        prev.map(c => 
          c.id === tempId 
            ? { ...c, isPending: false, isError: true }
            : c
        )
      );
      
      setError('Failed to post comment. Please try again.');
      setSuccessMessage(null); // Clear any success messages on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const reactToComment = async (commentId: string, reactionType: 'like' | 'dislike') => {
    if (!isConnected || !account) return;

    try {
      // Optimistic update - immediately update the UI
      setComments(prev => updateCommentReactionOptimistic(prev, commentId, reactionType));
      
      // Submit to service
      await mockCommentService.reactToComment(contentId, commentId, reactionType, account);
    } catch (error) {
      console.error('Failed to react to comment:', error);
      // Revert optimistic update on error
      await loadComments();
      setError(`Failed to ${reactionType} comment. Please try again.`);
    }
  };

  const updateCommentReactionOptimistic = (comments: Comment[], commentId: string, reaction: 'like' | 'dislike'): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: reaction === 'like' ? comment.likes + 1 : comment.likes,
          dislikes: reaction === 'dislike' ? comment.dislikes + 1 : comment.dislikes
        };
      }
      if (comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentReactionOptimistic(comment.replies, commentId, reaction)
        };
      }
      return comment;
    });
  };

  const reportComment = async (commentId: string, reason: string) => {
    if (!isConnected || !account) return;

    try {
      await mockCommentService.reportComment(contentId, commentId, reason, account);
      alert('Comment reported successfully. Thank you for helping keep our community safe.');
    } catch (error) {
      console.error('Failed to report comment:', error);
      setError('Failed to report comment. Please try again.');
    }
  };

  const retryComment = async (comment: Comment) => {
    if (!comment.localId) return;

    setRetryingComments(prev => new Set(prev).add(comment.localId!));

    try {
      // Remove error state
      setPendingComments(prev => 
        prev.map(c => 
          c.id === comment.id 
            ? { ...c, isPending: true, isError: false }
            : c
        )
      );

      // Retry submission
      const confirmedComment = await mockCommentService.addComment(
        contentId,
        comment.message,
        comment.author,
        comment.parentId
      );

      // Remove from pending
      setPendingComments(prev => prev.filter(c => c.id !== comment.id));
      
    } catch (error) {
      console.error('Failed to retry comment:', error);
      
      // Mark as error again
      setPendingComments(prev => 
        prev.map(c => 
          c.id === comment.id 
            ? { ...c, isPending: false, isError: true }
            : c
        )
      );
    } finally {
      setRetryingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(comment.localId!);
        return newSet;
      });
    }
  };

  const removeFailedComment = (commentId: string) => {
    setPendingComments(prev => prev.filter(c => c.id !== commentId));
  };

  // Combine confirmed comments with pending comments for display
  const allComments = [...comments, ...pendingComments];
  const totalCommentCount = mockCommentService.getCommentCount(contentId) + pendingComments.length;

  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ 
    comment, 
    depth = 0 
  }) => {
    const isRetrying = comment.localId && retryingComments.has(comment.localId);
    
    return (
      <div className={`border-l-2 border-gray-200 pl-4 ${depth > 0 ? 'ml-8 mt-4' : 'mb-6'} ${
        comment.isPending ? 'opacity-70' : ''
      } ${comment.isError ? 'bg-red-50 border-red-200 rounded-lg p-3' : ''}`}>
        <div className="flex items-start space-x-3">
          <img
            src={comment.authorAvatar || mockCommentService.generateUserAvatar(comment.author)}
            alt={comment.authorEns || comment.author}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {comment.authorEns || `${comment.author.slice(0, 6)}...${comment.author.slice(-4)}`}
              </span>
              {comment.isVerified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <span className="text-sm text-gray-500">
                {new Date(comment.timestamp).toLocaleDateString()}
              </span>
              
              {/* Status indicators */}
              {comment.isPending && (
                <div className="flex items-center space-x-1 text-blue-500">
                  <Clock className="w-3 h-3 animate-pulse" />
                  <span className="text-xs">Posting...</span>
                </div>
              )}
              {comment.isError && (
                <div className="flex items-center space-x-1 text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs">Failed</span>
                </div>
              )}
            </div>
            
            <p className="mt-1 text-gray-700">{comment.message}</p>
            
            {/* Error state actions */}
            {comment.isError && (
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => retryComment(comment)}
                  disabled={isRetrying}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span className="text-xs">{isRetrying ? 'Retrying...' : 'Retry'}</span>
                </button>
                <button
                  onClick={() => removeFailedComment(comment.id)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>
            )}
            
            {/* Normal comment actions */}
            {!comment.isError && (
              <div className="flex items-center space-x-4 mt-2">
                <button
                  onClick={() => reactToComment(comment.id, 'like')}
                  disabled={comment.isPending}
                  className="flex items-center space-x-1 text-gray-500 hover:text-green-600 disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{comment.likes}</span>
                </button>
                
                <button
                  onClick={() => reactToComment(comment.id, 'dislike')}
                  disabled={comment.isPending}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{comment.dislikes}</span>
                </button>
                
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  disabled={comment.isPending}
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                >
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
                
                <button
                  onClick={() => {
                    const reason = prompt('Why are you reporting this comment?');
                    if (reason) reportComment(comment.id, reason);
                  }}
                  disabled={comment.isPending}
                  className="flex items-center space-x-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 relative ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">
            Comments{totalCommentCount > 0 && ` (${totalCommentCount})`}
          </h3>
        </div>
        
        {error && (
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
            title="Dismiss error"
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {isConnected ? (
        <div className="mb-6">
          {isCommentBoxCollapsed ? (
            // Collapsed state - YouTube style
            <div 
              onClick={() => setIsCommentBoxCollapsed(false)}
              className="p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Add a comment...</span>
              </div>
            </div>
          ) : (
            // Expanded state - full comment form
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                submitComment();
              }}
              className="transition-all duration-300 ease-in-out"
            >
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    // Submit on Ctrl+Enter or Cmd+Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                  placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {newComment.length}/500
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center space-x-2">
                  {replyingTo && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment(''); // Clear input when canceling reply
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                      disabled={isSubmitting}
                    >
                      Cancel Reply
                    </button>
                  )}
                  <span className="text-xs text-gray-400">
                    Press Ctrl+Enter to submit
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCommentBoxCollapsed(true);
                      setNewComment('');
                      setReplyingTo(null);
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim() || newComment.length > 500}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>{isSubmitting ? 'Posting...' : replyingTo ? 'Reply' : 'Comment'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-center border border-blue-200">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
          <p className="text-gray-700 font-medium">Join the conversation!</p>
          <p className="text-gray-600 text-sm">Connect your wallet to comment and engage with the community</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {/* Loading skeleton */}
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : allComments.length > 0 ? (
          <div className="space-y-4">
            {allComments
              .sort((a, b) => b.timestamp - a.timestamp) // Newest first
              .map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h4 className="text-lg font-medium mb-2">No comments yet</h4>
            <p className="text-sm">Be the first to share your thoughts about this content!</p>
            {!isConnected && (
              <p className="text-xs mt-2 text-gray-400">Connect your wallet to get started</p>
            )}
          </div>
        )}
      </div>

      {/* Retry all failed comments button */}
      {pendingComments.some(c => c.isError) && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => {
              pendingComments.filter(c => c.isError).forEach(comment => {
                retryComment(comment);
              });
            }}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry all failed comments</span>
          </button>
        </div>
      )}
    </div>
  );
};