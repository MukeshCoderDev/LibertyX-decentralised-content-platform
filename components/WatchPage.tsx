import React, { useState } from 'react';
import { Page, NavigationProps } from '../types';
import LightningIcon from './icons/LightningIcon';
import ShareIcon from './icons/ShareIcon';
import ReportIcon from './icons/ReportIcon';
import HeartIcon from './icons/HeartIcon';
import Confetti from './ui/Confetti';
import { SocialFeaturesHub } from './SocialFeaturesHub';
import { useWallet } from '../lib/WalletProvider';
import { useSocialFeatures } from '../hooks/useSocialFeatures';

const WatchPage: React.FC<NavigationProps> = ({ onNavigate }) => {
    const { isConnected } = useWallet();
    const [showComments, setShowComments] = useState(false);
    const [isTipping, setIsTipping] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    // Mock content data - in real app this would come from props or URL params
    const contentId = 123;
    const creatorAddress = '0x1234567890123456789012345678901234567890';
    
    const { socialStats, actions } = useSocialFeatures(contentId, creatorAddress);

    const handleTip = async () => {
        if (!isConnected) {
            alert('Please connect your wallet to tip');
            return;
        }
        
        try {
            setIsTipping(true);
            await actions.tipCreator('1.0', 'Great content!');
            setTimeout(() => setIsTipping(false), 2000);
        } catch (error) {
            console.error('Tip failed:', error);
            setIsTipping(false);
        }
    };

    const handleLike = async () => {
        if (!isConnected) {
            alert('Please connect your wallet to like');
            return;
        }
        
        try {
            await actions.likeContent();
        } catch (error) {
            console.error('Like failed:', error);
        }
    };

    const handleShare = () => {
        setShowShareModal(true);
    };

    const handleReport = () => {
        if (!isConnected) {
            alert('Please connect your wallet to report');
            return;
        }
        
        const reason = prompt('Why are you reporting this content?');
        if (reason) {
            actions.reportContent('inappropriate', reason);
        }
    };

    const shareContent = async (platform: string) => {
        const shareUrl = `${window.location.origin}/watch/${contentId}`;
        const shareText = 'Check out this amazing content on LibertyX!';

        if (platform === 'twitter') {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        } else if (platform === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        } else if (platform === 'discord') {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            alert('Link copied to clipboard! Paste it in Discord.');
        } else if (platform === 'copy') {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }

        try {
            await actions.shareContent(platform);
        } catch (error) {
            console.error('Share tracking failed:', error);
        }

        setShowShareModal(false);
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
             {/* Player Placeholder */}
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                 <video
                    autoPlay
                    loop
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    poster="https://picsum.photos/seed/1/1920/1080"
                >
                    <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
            
            {/* Close Button */}
            <button onClick={() => onNavigate(Page.Explore)} className="absolute top-5 left-5 bg-black/50 p-2 rounded-full text-white z-20">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Floating Action Buttons */}
            <div className="absolute right-4 bottom-24 md:bottom-5 flex flex-col items-center space-y-6 z-10">
                {/* Tip Button */}
                <div className="text-center">
                    <button 
                        onClick={handleTip} 
                        className="relative bg-primary p-4 rounded-full text-white shadow-lg transform transition hover:scale-110"
                        title="Tip Creator"
                    >
                        <LightningIcon className="w-8 h-8"/>
                        {isTipping && <Confetti />}
                    </button>
                    <div className="text-white text-xs mt-1">{socialStats.tips} LIB</div>
                </div>

                {/* Like Button */}
                <div className="text-center">
                    <button 
                        onClick={handleLike}
                        className={`p-4 rounded-full text-white shadow-lg transform transition hover:scale-110 ${
                            socialStats.isLiked 
                                ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 ring-2 ring-white' 
                                : 'bg-white/20 backdrop-blur-md'
                        }`}
                        title="Like Content"
                    >
                        <HeartIcon className="w-8 h-8"/>
                    </button>
                    <div className="text-white text-xs mt-1">{socialStats.likes.toLocaleString()}</div>
                </div>

                {/* Share Button */}
                <div className="text-center">
                    <button 
                        onClick={handleShare}
                        className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg transform transition hover:scale-110"
                        title="Share Content"
                    >
                        <ShareIcon className="w-7 h-7"/>
                    </button>
                    <div className="text-white text-xs mt-1">{socialStats.shares}</div>
                </div>

                {/* Report Button */}
                <button 
                    onClick={handleReport}
                    className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg transform transition hover:scale-110"
                    title="Report Content"
                >
                    <ReportIcon className="w-7 h-7"/>
                </button>
            </div>
            
            {/* Comments button */}
            <div className="absolute left-4 bottom-5 z-10">
                <button 
                    onClick={() => setShowComments(true)} 
                    className="bg-white/20 backdrop-blur-md text-white py-2 px-4 rounded-full flex items-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Comments{socialStats.comments > 0 && ` (${socialStats.comments.toLocaleString()})`}</span>
                </button>
            </div>

            {/* Social Features Drawer */}
            <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-20 transform transition-transform ${showComments ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="font-satoshi text-xl font-bold text-gray-900">Social Hub</h3>
                    <button 
                        onClick={() => setShowComments(false)} 
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        &times;
                    </button>
                </div>
                
                <div className="h-full overflow-hidden">
                    <SocialFeaturesHub
                        contentId={contentId}
                        creatorAddress={creatorAddress}
                        className="h-full"
                    />
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowShareModal(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-80"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Share Content</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => shareContent('twitter')}
                                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <span>🐦</span>
                                <span>Twitter</span>
                            </button>
                            <button
                                onClick={() => shareContent('telegram')}
                                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <span>✈️</span>
                                <span>Telegram</span>
                            </button>
                            <button
                                onClick={() => shareContent('discord')}
                                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <span>🎮</span>
                                <span>Discord</span>
                            </button>
                            <button
                                onClick={() => shareContent('copy')}
                                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                            >
                                <span>📋</span>
                                <span>Copy Link</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchPage;
