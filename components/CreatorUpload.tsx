import React, { useState, useEffect } from 'react';
import { NavigationProps, Page } from '../types';
import Button from './ui/Button';
import Toggle from './ui/Toggle';
import Modal from './ui/Modal';

const CreatorUpload: React.FC<NavigationProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [price, setPrice] = useState(10);
    const [isEncrypted, setIsEncrypted] = useState(true);
    const [isMinting, setIsMinting] = useState(false);
    const [selectedThumb, setSelectedThumb] = useState(1);

    useEffect(() => {
        let interval: number;
        if (isUploading) {
            interval = window.setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsUploading(false);
                        setStep(2);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isUploading]);

    const startUpload = () => {
        setProgress(0);
        setIsUploading(true);
    };
    
    const handleMint = () => {
        setIsMinting(true);
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Upload Your Content</h2>
                        <p className="text-text-secondary mb-8">Drag & drop your video file or click to select.</p>
                        {isUploading ? (
                             <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                                 <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                                     <circle className="text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                                     <circle 
                                        className="text-primary" 
                                        strokeWidth="10" 
                                        strokeDasharray={2 * Math.PI * 45} 
                                        strokeDashoffset={(2 * Math.PI * 45) - (progress/100) * (2 * Math.PI * 45)}
                                        strokeLinecap="round" 
                                        stroke="currentColor" 
                                        fill="transparent" 
                                        r="45" cx="50" cy="50"
                                        style={{transform: 'rotate(-90deg)', transformOrigin: '50% 50%'}}
                                     />
                                 </svg>
                                 <span className="text-3xl font-bold">{progress}%</span>
                            </div>
                        ) : (
                             <div onClick={startUpload} className="w-full h-64 border-4 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-card/50 transition-colors">
                                <p className="text-lg">Drop file here</p>
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                     <div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Select Cover Thumbnail</h2>
                        <p className="text-text-secondary mb-8">We've generated a few options from your video.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} onClick={() => setSelectedThumb(i)} className={`relative rounded-lg overflow-hidden cursor-pointer aspect-[16/9] border-4 ${selectedThumb === i ? 'border-primary' : 'border-transparent'}`}>
                                    <img src={`https://picsum.photos/seed/thumb${i}/400/225`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setStep(3)} className="mt-8 w-full">Next Step</Button>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Final Details</h2>
                        <p className="text-text-secondary mb-8">Set your price and privacy settings.</p>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="price-slider" className="block text-lg font-satoshi mb-2">Set Price</label>
                                <div className="flex items-center gap-4">
                                    <input id="price-slider" type="range" min="1" max="100" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                                    <span className="font-bold text-primary text-xl w-20 text-center">${price.toFixed(2)}</span>
                                </div>
                            </div>
                             <Toggle label="End-to-end Encryption" enabled={isEncrypted} setEnabled={setIsEncrypted} />
                        </div>
                        <Button onClick={handleMint} className="mt-8 w-full">Mint Access Pass</Button>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4">
            <div className="bg-card p-8 rounded-2xl shadow-lg">
                {renderStep()}
            </div>
             <Modal isOpen={isMinting} onClose={() => setIsMinting(false)} title="Confirm in Wallet">
                 <div className="text-center">
                    <p className="text-text-secondary mb-6">Please sign the transaction to mint the access pass NFT for your new content.</p>
                    <div className="bg-background p-4 rounded-lg mb-6">
                        <p>Minting 1 x Content Pass</p>
                        <p className="text-text-secondary text-sm">Gas Fee: ~0.002 ETH</p>
                    </div>
                    <Button onClick={() => onNavigate(Page.Explore)} className="w-full">Waiting for Signature...</Button>
                 </div>
            </Modal>
        </div>
    );
};

export default CreatorUpload;
