import React, { useState } from 'react';
import { Page, NavigationProps } from '../types';
import LightningIcon from './icons/LightningIcon';
import ShareIcon from './icons/ShareIcon';
import ReportIcon from './icons/ReportIcon';
import HeartIcon from './icons/HeartIcon';
import Confetti from './ui/Confetti';

const WatchPage: React.FC<NavigationProps> = ({ onNavigate }) => {
    const [showComments, setShowComments] = useState(false);
    const [isTipping, setIsTipping] = useState(false);

    const handleTip = () => {
        setIsTipping(true);
        setTimeout(() => setIsTipping(false), 2000); // Reset after animation
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
                    <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
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
                <button onClick={handleTip} className="relative bg-primary p-4 rounded-full text-white shadow-lg transform transition hover:scale-110">
                    <LightningIcon className="w-8 h-8"/>
                    {isTipping && <Confetti />}
                </button>
                 <button className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white shadow-lg transform transition hover:scale-110 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 ring-2 ring-white">
                    <HeartIcon className="w-8 h-8"/>
                </button>
                <button className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg transform transition hover:scale-110">
                    <ShareIcon className="w-7 h-7"/>
                </button>
                <button className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg transform transition hover:scale-110">
                    <ReportIcon className="w-7 h-7"/>
                </button>
            </div>
            
            {/* Comments button */}
            <div className="absolute left-4 bottom-5 z-10">
                <button onClick={() => setShowComments(true)} className="bg-white/20 backdrop-blur-md text-white py-2 px-4 rounded-full">
                    View Comments (1,234)
                </button>
            </div>

            {/* Comments Drawer */}
            <div className={`absolute top-0 right-0 h-full w-full md:w-96 bg-card shadow-2xl z-20 transform transition-transform ${showComments ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="font-satoshi text-xl font-bold">Comments</h3>
                    <button onClick={() => setShowComments(false)} className="text-text-secondary">&times;</button>
                </div>
                 <div className="p-4 text-text-secondary">Lens protocol comments would be displayed here.</div>
            </div>
        </div>
    );
};

export default WatchPage;
