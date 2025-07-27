// Mock Comment Service - Provides realistic comment data and functionality
// This simulates blockchain behavior with immediate responses for better UX

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
  signature?: string;
  parentId?: string;
  isPending?: boolean;
  isError?: boolean;
  localId?: string;
  blockchainTxHash?: string;
}

interface MockUser {
  address: string;
  ens?: string;
  avatar: string;
  isVerified: boolean;
}

class MockCommentService {
  private comments: Map<number, Comment[]> = new Map();
  private commentIdCounter = 1;
  private subscribers: Map<number, ((comments: Comment[]) => void)[]> = new Map();

  // Mock users for realistic comments
  private mockUsers: MockUser[] = [
    {
      address: '0x1234567890123456789012345678901234567890',
      ens: 'alice.eth',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      isVerified: true
    },
    {
      address: '0x2345678901234567890123456789012345678901',
      ens: 'bob.eth',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      isVerified: false
    },
    {
      address: '0x3456789012345678901234567890123456789012',
      ens: 'charlie.eth',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      isVerified: true
    },
    {
      address: '0x4567890123456789012345678901234567890123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
      isVerified: false
    },
    {
      address: '0x5678901234567890123456789012345678901234',
      ens: 'eve.eth',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
      isVerified: true
    }
  ];

  // Sample comment messages for realistic data
  private sampleMessages = [
    "This is amazing content! Thanks for sharing 🔥",
    "Great work on this video, really enjoyed it!",
    "Can you make more content like this?",
    "The quality keeps getting better and better 👏",
    "This helped me understand the concept so much better",
    "Love the production value on this one",
    "When is the next video coming out?",
    "This deserves way more views!",
    "Thanks for the detailed explanation 🙏",
    "Your content always brightens my day",
    "The editing on this is incredible",
    "This is exactly what I was looking for!",
    "Keep up the fantastic work 💪",
    "Mind blown by this content 🤯",
    "This should be trending everywhere"
  ];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create some initial comments for content ID 123 (the default in WatchPage)
    const contentId = 123;
    const initialComments: Comment[] = [];

    // Add some root comments
    for (let i = 0; i < 5; i++) {
      const user = this.mockUsers[i % this.mockUsers.length];
      const comment: Comment = {
        id: `comment_${this.commentIdCounter++}`,
        contentId,
        author: user.address,
        authorEns: user.ens,
        authorAvatar: user.avatar,
        message: this.sampleMessages[Math.floor(Math.random() * this.sampleMessages.length)],
        timestamp: Date.now() - Math.random() * 86400000 * 7, // Random time in last week
        likes: Math.floor(Math.random() * 50),
        dislikes: Math.floor(Math.random() * 5),
        replies: [],
        isVerified: user.isVerified,
        signature: `signature_${this.commentIdCounter}`
      };

      // Add some replies to some comments
      if (Math.random() > 0.6) {
        const replyUser = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
        const reply: Comment = {
          id: `comment_${this.commentIdCounter++}`,
          contentId,
          author: replyUser.address,
          authorEns: replyUser.ens,
          authorAvatar: replyUser.avatar,
          message: "Great point! I totally agree with this perspective.",
          timestamp: comment.timestamp + Math.random() * 3600000, // Reply after original
          likes: Math.floor(Math.random() * 20),
          dislikes: Math.floor(Math.random() * 2),
          replies: [],
          isVerified: replyUser.isVerified,
          parentId: comment.id,
          signature: `signature_${this.commentIdCounter}`
        };
        comment.replies.push(reply);
      }

      initialComments.push(comment);
    }

    this.comments.set(contentId, initialComments);
  }

  async getComments(contentId: number): Promise<Comment[]> {
    // Simulate network delay
    await this.delay(300 + Math.random() * 200);
    
    return this.comments.get(contentId) || [];
  }

  async addComment(
    contentId: number, 
    message: string, 
    author: string,
    parentId?: string
  ): Promise<Comment> {
    // Simulate network delay
    await this.delay(500 + Math.random() * 300);

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Network error: Failed to post comment. Please try again.');
    }

    const user = this.mockUsers.find(u => u.address === author) || {
      address: author,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
      isVerified: false
    };

    const comment: Comment = {
      id: `comment_${this.commentIdCounter++}`,
      contentId,
      author,
      authorEns: user.ens,
      authorAvatar: user.avatar,
      message: message.trim(),
      timestamp: Date.now(),
      likes: 0,
      dislikes: 0,
      replies: [],
      isVerified: user.isVerified,
      parentId,
      signature: `signature_${this.commentIdCounter}`,
      blockchainTxHash: `0x${Math.random().toString(16).substr(2, 64)}`
    };

    const comments = this.comments.get(contentId) || [];
    
    if (parentId) {
      // Add as reply
      this.addReplyToComment(comments, parentId, comment);
    } else {
      // Add as root comment
      comments.unshift(comment); // Add to beginning for newest first
    }

    this.comments.set(contentId, comments);
    this.notifySubscribers(contentId, comments);

    return comment;
  }

  private addReplyToComment(comments: Comment[], parentId: string, reply: Comment) {
    for (const comment of comments) {
      if (comment.id === parentId) {
        comment.replies.push(reply);
        return;
      }
      if (comment.replies.length > 0) {
        this.addReplyToComment(comment.replies, parentId, reply);
      }
    }
  }

  async reactToComment(
    contentId: number,
    commentId: string, 
    reaction: 'like' | 'dislike',
    author: string
  ): Promise<void> {
    // Simulate network delay
    await this.delay(200 + Math.random() * 100);

    // Simulate occasional failures (3% chance)
    if (Math.random() < 0.03) {
      throw new Error('Failed to update reaction. Please try again.');
    }

    const comments = this.comments.get(contentId) || [];
    this.updateCommentReaction(comments, commentId, reaction);
    
    this.comments.set(contentId, comments);
    this.notifySubscribers(contentId, comments);
  }

  private updateCommentReaction(comments: Comment[], commentId: string, reaction: 'like' | 'dislike') {
    for (const comment of comments) {
      if (comment.id === commentId) {
        if (reaction === 'like') {
          comment.likes += 1;
        } else {
          comment.dislikes += 1;
        }
        return;
      }
      if (comment.replies.length > 0) {
        this.updateCommentReaction(comment.replies, commentId, reaction);
      }
    }
  }

  async reportComment(
    contentId: number,
    commentId: string, 
    reason: string,
    reporter: string
  ): Promise<void> {
    // Simulate network delay
    await this.delay(400 + Math.random() * 200);

    // Simulate occasional failures (2% chance)
    if (Math.random() < 0.02) {
      throw new Error('Failed to submit report. Please try again.');
    }

    // In a real implementation, this would flag the comment for moderation
    console.log(`Comment ${commentId} reported by ${reporter} for: ${reason}`);
  }

  subscribeToComments(
    contentId: number, 
    callback: (comments: Comment[]) => void
  ): () => void {
    const subscribers = this.subscribers.get(contentId) || [];
    subscribers.push(callback);
    this.subscribers.set(contentId, subscribers);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(contentId) || [];
      const index = subs.indexOf(callback);
      if (index > -1) {
        subs.splice(index, 1);
        this.subscribers.set(contentId, subs);
      }
    };
  }

  private notifySubscribers(contentId: number, comments: Comment[]) {
    const subscribers = this.subscribers.get(contentId) || [];
    subscribers.forEach(callback => callback([...comments]));
  }

  // Utility method to simulate network delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to get comment count for a content
  getCommentCount(contentId: number): number {
    const comments = this.comments.get(contentId) || [];
    return this.countAllComments(comments);
  }

  private countAllComments(comments: Comment[]): number {
    let count = comments.length;
    for (const comment of comments) {
      count += this.countAllComments(comment.replies);
    }
    return count;
  }

  // Method to generate a user avatar for any address
  generateUserAvatar(address: string): string {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`;
  }

  // Method to simulate adding more sample comments (for testing)
  async addRandomComment(contentId: number): Promise<void> {
    const randomUser = this.mockUsers[Math.floor(Math.random() * this.mockUsers.length)];
    const randomMessage = this.sampleMessages[Math.floor(Math.random() * this.sampleMessages.length)];
    
    await this.addComment(contentId, randomMessage, randomUser.address);
  }
}

// Export singleton instance
export const mockCommentService = new MockCommentService();
export type { Comment, MockUser };