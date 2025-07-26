import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useContractManager } from '../hooks/useContractManager';
import { Send, Users, Gift, Crown, Heart, Star } from 'lucide-react';

interface ChatMessage {
  id: string;
  streamId: string;
  author: string;
  authorEns?: string;
  authorAvatar?: string;
  message: string;
  timestamp: number;
  type: 'message' | 'tip' | 'subscription' | 'reaction';
  amount?: {
    value: string;
    token: string;
  };
  isCreator: boolean;
  isModerator: boolean;
  isSubscriber: boolean;
}

interface LiveStreamChatProps {
  streamId: string;
  creatorAddress: string;
  isLive: boolean;
  viewerCount: number;
  className?: string;
}

export const LiveStreamChat: React.FC<LiveStreamChatProps> = ({
  streamId,
  creatorAddress,
  isLive,
  viewerCount,
  className = ''
}) => {
  const { account, isConnected } = useWallet();
  const { executeTransaction, listenToEvents } = useContractManager();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnectedToChat, setIsConnectedToChat] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isLive) {
      connectToChat();
      setupEventListeners();
    }
    
    return () => {
      disconnectFromChat();
    };
  }, [streamId, isLive]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToChat = () => {
    try {
      // Connect to WebSocket for real-time chat
      const wsUrl = `wss://chat.libertyx.io/stream/${streamId}`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnectedToChat(true);
        console.log('Connected to chat');
      };
      
      wsRef.current.onmessage = (event) => {
        const message: ChatMessage = JSON.parse(event.data);
        setMessages(prev => [...prev, message]);
      };
      
      wsRef.current.onclose = () => {
        setIsConnectedToChat(false);
        console.log('Disconnected from chat');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Chat connection error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to chat:', error);
    }
  };

  const disconnectFromChat = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnectedToChat(false);
  };

  const setupEventListeners = () => {
    // Listen for tips
    listenToEvents('revenueSplitter', 'TipSent', (event: any) => {
      if (event.streamId === streamId) {
        const tipMessage: ChatMessage = {
          id: `tip-${Date.now()}`,
          streamId,
          author: event.tipper,
          message: `Tipped ${event.amount} ${event.token}!`,
          timestamp: Date.now() / 1000,
          type: 'tip',
          amount: {
            value: event.amount,
            token: event.token
          },
          isCreator: false,
          isModerator: false,
          isSubscriber: false
        };
        setMessages(prev => [...prev, tipMessage]);
      }
    });

    // Listen for new subscriptions
    listenToEvents('subscriptionManager', 'SubscriptionCreated', (event: any) => {
      if (event.creatorAddress === creatorAddress) {
        const subMessage: ChatMessage = {
          id: `sub-${Date.now()}`,
          streamId,
          author: event.subscriber,
          message: 'Just subscribed!',
          timestamp: Date.now() / 1000,
          type: 'subscription',
          isCreator: false,
          isModerator: false,
          isSubscriber: true
        };
        setMessages(prev => [...prev, subMessage]);
      }
    });
  };

  const sendMessage = async () => {
    if (!isConnected || !account || !newMessage.trim() || !isConnectedToChat) return;

    try {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        streamId,
        author: account,
        message: newMessage,
        timestamp: Date.now() / 1000,
        type: 'message',
        isCreator: account.toLowerCase() === creatorAddress.toLowerCase(),
        isModerator: false, // TODO: Check moderator status
        isSubscriber: false // TODO: Check subscription status
      };

      // Send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const sendTip = async () => {
    if (!isConnected || !account || !tipAmount) return;

    try {
      await executeTransaction('revenueSplitter', 'tipCreator', [
        creatorAddress,
        streamId,
        tipAmount
      ]);
      
      setShowTipModal(false);
      setTipAmount('');
    } catch (error) {
      console.error('Failed to send tip:', error);
    }
  };

  const sendReaction = async (reaction: string) => {
    if (!isConnected || !account || !isConnectedToChat) return;

    try {
      const reactionMessage: ChatMessage = {
        id: `reaction-${Date.now()}`,
        streamId,
        author: account,
        message: reaction,
        timestamp: Date.now() / 1000,
        type: 'reaction',
        isCreator: account.toLowerCase() === creatorAddress.toLowerCase(),
        isModerator: false,
        isSubscriber: false
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(reactionMessage));
      }
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const getMessageStyle = () => {
      switch (message.type) {
        case 'tip':
          return 'bg-yellow-50 border-l-4 border-yellow-400 pl-3';
        case 'subscription':
          return 'bg-purple-50 border-l-4 border-purple-400 pl-3';
        case 'reaction':
          return 'bg-pink-50 border-l-4 border-pink-400 pl-3';
        default:
          return '';
      }
    };

    const getUserBadge = () => {
      if (message.isCreator) {
        return <Crown className="w-4 h-4 text-yellow-500" />;
      }
      if (message.isModerator) {
        return <Star className="w-4 h-4 text-blue-500" />;
      }
      if (message.isSubscriber) {
        return <Heart className="w-4 h-4 text-red-500" />;
      }
      return null;
    };

    return (
      <div className={`p-2 rounded ${getMessageStyle()}`}>
        <div className="flex items-start space-x-2">
          <img
            src={message.authorAvatar || '/default-avatar.png'}
            alt={message.authorEns || message.author}
            className="w-6 h-6 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <span className="font-medium text-sm truncate">
                {message.authorEns || `${message.author.slice(0, 6)}...${message.author.slice(-4)}`}
              </span>
              {getUserBadge()}
              <span className="text-xs text-gray-500">
                {new Date(message.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 break-words">{message.message}</p>
            {message.amount && (
              <div className="text-xs text-yellow-600 font-medium">
                💰 {message.amount.value} {message.amount.token}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border flex flex-col h-96 ${className}`}>
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500' : 'bg-gray-400'}`}></div>
            <span className="font-medium">
              {isLive ? 'Live Chat' : 'Chat Offline'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{viewerCount}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {isConnected && isLive ? (
        <div className="p-4 border-t">
          {/* Quick Reactions */}
          <div className="flex space-x-2 mb-3">
            {['❤️', '👏', '🔥', '😍', '🚀'].map(reaction => (
              <button
                key={reaction}
                onClick={() => sendReaction(reaction)}
                className="text-lg hover:scale-110 transition-transform"
              >
                {reaction}
              </button>
            ))}
            <button
              onClick={() => setShowTipModal(true)}
              className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm hover:bg-yellow-200"
            >
              <Gift className="w-4 h-4" />
              <span>Tip</span>
            </button>
          </div>

          {/* Message Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isConnectedToChat ? "Say something..." : "Connecting..."}
              disabled={!isConnectedToChat}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnectedToChat}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t bg-gray-50 text-center text-gray-600">
          {!isConnected ? 'Connect wallet to chat' : 'Stream is offline'}
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Send a Tip</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (LIB)
                </label>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendTip}
                  disabled={!tipAmount}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Send Tip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};