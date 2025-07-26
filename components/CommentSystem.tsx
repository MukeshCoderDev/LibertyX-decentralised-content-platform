import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { MessageCircle, Heart, ThumbsUp, ThumbsDown, Flag, Reply } from 'lucide-react';

interface Comment {
  id: string;
  contentId: number;
  author: string;
  authorEns?: string;
  authorAvatar?: string;
  message: string;
  timestamp: number;
  likes: number;
  dislikes: number;
  replies: Comment[];
  isVerified: boolean;
  signature: string;
  parentId?: string;
}

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
  const { executeTransaction, listenToEvents } = useContractManager();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
    setupEventListeners();
  }, [contentId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      // Load comments from blockchain or IPFS
      const commentsData = await fetchCommentsFromChain(contentId);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Listen for new comments
    listenToEvents('contentRegistry', 'CommentAdded', (event: any) => {
      if (event.contentId === contentId) {
        loadComments();
      }
    });

    // Listen for comment reactions
    listenToEvents('contentRegistry', 'CommentReaction', (event: any) => {
      if (event.contentId === contentId) {
        updateCommentReaction(event.commentId, event.reactionType, event.count);
      }
    });
  };

  const submitComment = async () => {
    if (!isConnected || !account || !newComment.trim()) return;

    try {
      setIsSubmitting(true);
      
      // Sign the comment message for verification
      const message = `Comment on content ${contentId}: ${newComment}`;
      const signature = await signMessage(message);

      // Submit comment to blockchain
      await executeTransaction('contentRegistry', 'addComment', [
        contentId,
        newComment,
        signature,
        replyingTo || '0x0'
      ]);

      setNewComment('');
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reactToComment = async (commentId: string, reactionType: 'like' | 'dislike') => {
    if (!isConnected || !account) return;

    try {
      await executeTransaction('contentRegistry', 'reactToComment', [
        contentId,
        commentId,
        reactionType === 'like' ? 1 : 2
      ]);
    } catch (error) {
      console.error('Failed to react to comment:', error);
    }
  };

  const reportComment = async (commentId: string, reason: string) => {
    if (!isConnected || !account) return;

    try {
      await executeTransaction('contentRegistry', 'reportComment', [
        contentId,
        commentId,
        reason
      ]);
    } catch (error) {
      console.error('Failed to report comment:', error);
    }
  };

  const fetchCommentsFromChain = async (contentId: number): Promise<Comment[]> => {
    // Mock implementation - would fetch from actual blockchain
    return [];
  };

  const signMessage = async (message: string): Promise<string> => {
    // Mock implementation - would use actual wallet signing
    return 'signature';
  };

  const updateCommentReaction = (commentId: string, reactionType: number, count: number) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: reactionType === 1 ? count : comment.likes,
          dislikes: reactionType === 2 ? count : comment.dislikes
        };
      }
      return comment;
    }));
  };

  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ 
    comment, 
    depth = 0 
  }) => (
    <div className={`border-l-2 border-gray-200 pl-4 ${depth > 0 ? 'ml-8 mt-4' : 'mb-6'}`}>
      <div className="flex items-start space-x-3">
        <img
          src={comment.authorAvatar || '/default-avatar.png'}
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
              {new Date(comment.timestamp * 1000).toLocaleDateString()}
            </span>
          </div>
          
          <p className="mt-1 text-gray-700">{comment.message}</p>
          
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => reactToComment(comment.id, 'like')}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-600"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{comment.likes}</span>
            </button>
            
            <button
              onClick={() => reactToComment(comment.id, 'dislike')}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{comment.dislikes}</span>
            </button>
            
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
            
            <button
              onClick={() => reportComment(comment.id, 'inappropriate')}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
          
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {isConnected ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."}
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            rows={3}
          />
          
          <div className="flex justify-between items-center mt-3">
            {replyingTo && (
              <button
                onClick={() => setReplyingTo(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel Reply
              </button>
            )}
            
            <button
              onClick={submitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : replyingTo ? 'Reply' : 'Comment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">Connect your wallet to join the conversation</p>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};