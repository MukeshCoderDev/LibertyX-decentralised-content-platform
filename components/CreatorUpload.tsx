import React, { useState, useEffect, useRef } from 'react';
import { NavigationProps, Page, TokenPrice } from '../types';
import Button from './ui/Button';
import Toggle from './ui/Toggle';
import Modal from './ui/Modal';
import { useArweave } from '../hooks/useArweave';
import { ContentMetadata } from '../lib/arweaveConfig';
import CryptoPriceInput from './CryptoPriceInput';
import { uploadVideo, estimateUploadCost } from '../lib/uploadToArweave';
import WalletUpload from './WalletUpload';
import { useWallet } from '../hooks/useWallet';
import AnimatedUploadProgress from './AnimatedUploadProgress';
import ArweaveFeatureHighlight from './ArweaveFeatureHighlight';
import WalletConnectionAnimation from './WalletConnectionAnimation';

const CreatorUpload: React.FC<NavigationProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [price, setPrice] = useState<TokenPrice>({
        amount: (10 * Math.pow(10, 18)).toFixed(0), // 10 LIB in wei
        token: 'LIB',
        decimals: 18,
        symbol: 'LIB'
    });
    const [isEncrypted, setIsEncrypted] = useState(true);
    const [selectedThumb, setSelectedThumb] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [arweaveTransactionId, setArweaveTransactionId] = useState<string | null>(null);
    const [uploadCostEstimate, setUploadCostEstimate] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStage, setUploadStage] = useState<'preparing' | 'uploading' | 'confirming' | 'complete'>('preparing');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Wallet management
    const { 
        wallet, 
        isWalletLoaded, 
        walletBalance,
        refreshBalance,
        clearWallet,
        estimateUploadCost: estimateWalletCost 
    } = useWallet();

    // Remove the old Arweave hook since we're using direct wallet upload
    const [error, setError] = useState<string | null>(null);

    // Generate thumbnails when file is selected
    useEffect(() => {
        if (selectedFile && selectedFile.type.startsWith('video/')) {
            generateThumbnails(selectedFile);
            // Estimate upload cost
            estimateUploadCost(selectedFile.size)
                .then(cost => setUploadCostEstimate(cost))
                .catch(err => console.error('Cost estimation failed:', err));
        }
    }, [selectedFile]);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }
        
        setSelectedFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
        setStep(2);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const generateThumbnails = (file: File) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = () => {
            canvas.width = 400;
            canvas.height = 225;
            
            const duration = video.duration;
            const thumbTimes = [duration * 0.1, duration * 0.5, duration * 0.9];
            const thumbs: string[] = [];
            
            let currentIndex = 0;
            
            const captureFrame = () => {
                if (currentIndex >= thumbTimes.length) {
                    setThumbnails(thumbs);
                    return;
                }
                
                video.currentTime = thumbTimes[currentIndex];
                video.onseeked = () => {
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
                    }
                    currentIndex++;
                    captureFrame();
                };
            };
            
            captureFrame();
        };
        
        video.src = URL.createObjectURL(file);
    };

    const handleUploadToArweave = async () => {
        if (!selectedFile || !title.trim()) {
            setError('Please provide a title for your content');
            return;
        }

        if (!isWalletLoaded || !wallet) {
            setError('Please upload your Arweave wallet first');
            return;
        }

        // Check if wallet has sufficient funds
        if (uploadCostEstimate && parseFloat(walletBalance!) < parseFloat(uploadCostEstimate)) {
            setError(`Insufficient funds. You need at least ${uploadCostEstimate} AR tokens. Current balance: ${walletBalance} AR`);
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            setUploadStage('preparing');
            setUploadProgress(0);
            
            console.log('🚀 Starting creator-funded upload to Arweave...');
            
            // Simulate preparation phase
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUploadStage('uploading');
            setUploadProgress(10);
            
            // Convert file to buffer
            const buffer = await selectedFile.arrayBuffer();
            setUploadProgress(30);
            
            // Prepare metadata
            const metadata = {
                title: title.trim(),
                description: description.trim() || 'No description provided',
                accessLevel: isEncrypted ? 'premium' : 'public',
            };
            
            setUploadProgress(50);
            
            // Upload using creator's wallet
            const result = await uploadVideo(buffer, selectedFile.type, wallet.keyfile, metadata);
            
            setUploadProgress(80);
            setUploadStage('confirming');
            
            // Simulate confirmation phase
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (result) {
                setUploadProgress(100);
                setUploadStage('complete');
                
                console.log('🎉 Creator-funded upload completed!');
                console.log('📁 Arweave TX:', result.transactionId);
                console.log('🔗 Content URL:', result.url);
                
                setArweaveTransactionId(result.transactionId);
                
                // Wait for success animation then proceed
                setTimeout(() => {
                    setStep(5); // Success step
                }, 2000);
            }
        } catch (error: any) {
            console.error('❌ Creator-funded upload failed:', error);
            setError(error.message || 'Upload failed');
            setIsUploading(false);
            setUploadStage('preparing');
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Upload Your Content</h2>
                        <p className="text-text-secondary mb-8">First, upload your Arweave wallet to pay for storage, then select your video.</p>
                        
                        {/* Wallet Upload Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-satoshi font-semibold mb-4">Step 1: Upload Your Arweave Wallet</h3>
                            {isWalletLoaded ? (
                                <WalletConnectionAnimation
                                    isConnected={isWalletLoaded}
                                    walletAddress={wallet?.address}
                                    balance={walletBalance}
                                    onRefresh={refreshBalance}
                                    onDisconnect={clearWallet}
                                />
                            ) : (
                                <WalletUpload onWalletLoaded={() => console.log('Wallet loaded!')} />
                            )}
                        </div>

                        {/* Video Upload Section */}
                        {isWalletLoaded && (
                            <div className="animate-slideUp">
                                <h3 className="text-lg font-satoshi font-semibold mb-4">Step 2: Select Your Video</h3>
                                <div 
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-64 border-4 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-card/50 transition-all duration-300 hover-lift hover-glow"
                                >
                                    <div className="text-6xl mb-4 animate-float">📁</div>
                                    <p className="text-lg font-semibold">Drop video file here</p>
                                    <p className="text-sm text-text-secondary mt-2">or click to browse</p>
                                    <div className="mt-4 text-xs text-gray-500">
                                        Supported: MP4, WebM, MOV • Max: 500MB
                                    </div>
                                </div>
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileInput}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {/* Arweave Feature Highlight */}
                        {!isWalletLoaded && (
                            <div className="mt-8">
                                <ArweaveFeatureHighlight />
                            </div>
                        )}
                        
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                                <p className="text-red-400">{error}</p>
                                <Button onClick={() => setError(null)} className="mt-2 text-sm">Dismiss</Button>
                            </div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Content Details</h2>
                        <p className="text-text-secondary mb-8">Add title and description for your content.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-lg font-satoshi mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full p-3 bg-background border border-gray-600 rounded-lg focus:border-primary focus:outline-none"
                                    placeholder="Enter content title..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-lg font-satoshi mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 bg-background border border-gray-600 rounded-lg focus:border-primary focus:outline-none resize-none"
                                    placeholder="Describe your content..."
                                />
                            </div>
                            
                            {selectedFile && (
                                <div className="p-4 bg-background rounded-lg">
                                    <p className="text-sm text-text-secondary">Selected file:</p>
                                    <p className="font-medium">{selectedFile.name}</p>
                                    <p className="text-sm text-text-secondary">
                                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <Button 
                            onClick={() => setStep(3)} 
                            className="mt-8 w-full"
                            disabled={!title.trim()}
                        >
                            Next Step
                        </Button>
                    </div>
                );

            case 3:
                return (
                    <div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Select Cover Thumbnail</h2>
                        <p className="text-text-secondary mb-8">
                            {thumbnails.length > 0 ? "Choose from generated thumbnails:" : "Generating thumbnails..."}
                        </p>
                        
                        {thumbnails.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {thumbnails.map((thumb, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedThumb(i + 1)} 
                                        className={`relative rounded-lg overflow-hidden cursor-pointer aspect-[16/9] border-4 ${
                                            selectedThumb === i + 1 ? 'border-primary' : 'border-transparent'
                                        }`}
                                    >
                                        <img src={thumb} className="w-full h-full object-cover" alt={`Thumbnail ${i + 1}`} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                        
                        <Button 
                            onClick={() => setStep(4)} 
                            className="mt-8 w-full"
                            disabled={thumbnails.length === 0}
                        >
                            Next Step
                        </Button>
                    </div>
                );

            case 4:
                return (
                    <div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Final Details</h2>
                        <p className="text-text-secondary mb-8">Review costs and set your price and privacy settings.</p>
                        
                        <div className="space-y-6">
                            {/* Cost Breakdown */}
                            {uploadCostEstimate && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-800 mb-2">Upload Cost Breakdown</h4>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">File size:</span>
                                            <span className="text-blue-800">{(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Arweave storage cost:</span>
                                            <span className="text-blue-800">{parseFloat(uploadCostEstimate).toFixed(6)} AR</span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span className="text-blue-700">Your wallet balance:</span>
                                            <span className="text-blue-800">{parseFloat(walletBalance!).toFixed(6)} AR</span>
                                        </div>
                                        <div className="flex justify-between font-medium">
                                            <span className="text-blue-700">Remaining after upload:</span>
                                            <span className={`${parseFloat(walletBalance!) >= parseFloat(uploadCostEstimate) ? 'text-green-600' : 'text-red-600'}`}>
                                                {parseFloat(walletBalance!) >= parseFloat(uploadCostEstimate) 
                                                    ? `${(parseFloat(walletBalance!) - parseFloat(uploadCostEstimate)).toFixed(6)} AR`
                                                    : 'Insufficient funds'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <CryptoPriceInput
                                    price={price}
                                    onPriceChange={setPrice}
                                />
                            </div>
                            
                            <Toggle 
                                label="End-to-end Encryption" 
                                enabled={isEncrypted} 
                                setEnabled={setIsEncrypted} 
                            />
                            
                            {isUploading && (
                                <div className="p-4 bg-background rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span>Uploading to Arweave with your wallet...</span>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    </div>
                                    <p className="text-sm text-text-secondary">
                                        This may take a few moments. Please don't close this tab.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <Button 
                            onClick={handleUploadToArweave} 
                            className="mt-8 w-full"
                            disabled={isUploading || !isWalletLoaded || (uploadCostEstimate && parseFloat(walletBalance!) < parseFloat(uploadCostEstimate))}
                        >
                            {isUploading ? 'Uploading with Your Wallet...' : 'Upload to Arweave & Mint Access Pass'}
                        </Button>

                        {uploadCostEstimate && parseFloat(walletBalance!) < parseFloat(uploadCostEstimate) && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    <strong>Insufficient funds:</strong> You need at least {parseFloat(uploadCostEstimate).toFixed(6)} AR tokens to upload this video. 
                                    Please add more AR to your wallet and refresh the balance.
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="text-center animate-uploadSuccess">
                        <div className="text-8xl mb-6 animate-bounce">🎉</div>
                        <h2 className="text-4xl font-satoshi font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            Upload Successful!
                        </h2>
                        <p className="text-text-secondary mb-8 text-lg">
                            Your content is now <span className="font-semibold text-purple-600">permanently stored forever</span> on Arweave's decentralized network!
                        </p>
                        
                        {/* Success Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="text-2xl mb-1">♾️</div>
                                <div className="text-sm font-medium text-green-800">Permanent</div>
                                <div className="text-xs text-green-600">Forever stored</div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-2xl mb-1">🔒</div>
                                <div className="text-sm font-medium text-blue-800">Decentralized</div>
                                <div className="text-xs text-blue-600">Censorship resistant</div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <div className="text-2xl mb-1">🌐</div>
                                <div className="text-sm font-medium text-purple-800">Global</div>
                                <div className="text-xs text-purple-600">Worldwide access</div>
                            </div>
                        </div>
                        
                        {arweaveTransactionId && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-8 text-left animate-fadeIn">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-lg">🔗</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Arweave Transaction</h4>
                                        <p className="text-sm text-gray-600">Your content's permanent address</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Transaction ID:</p>
                                    <p className="font-mono text-sm break-all text-gray-800">{arweaveTransactionId}</p>
                                </div>
                                <a 
                                    href={`https://arweave.net/${arweaveTransactionId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover-lift"
                                >
                                    <span>View on Arweave</span>
                                    <span>→</span>
                                </a>
                            </div>
                        )}
                        
                        <div className="flex gap-4">
                            <Button 
                                onClick={() => onNavigate(Page.CreatorDashboard)} 
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 hover-lift"
                            >
                                🎯 View Dashboard
                            </Button>
                            <Button 
                                onClick={() => {
                                    setStep(1);
                                    setSelectedFile(null);
                                    setTitle('');
                                    setDescription('');
                                    setThumbnails([]);
                                    setArweaveTransactionId(null);
                                    setUploadCostEstimate(null);
                                    setError(null);
                                    setIsUploading(false);
                                    setUploadStage('preparing');
                                    setUploadProgress(0);
                                }} 
                                variant="secondary"
                                className="flex-1 hover-lift"
                            >
                                🚀 Upload Another
                            </Button>
                        </div>
                    </div>
                );

            default: 
                return null;
        }
    }

    return (
        <>
            <div className="container mx-auto max-w-2xl py-12 px-4">
                <div className="bg-card p-8 rounded-2xl shadow-lg hover-lift">
                    {renderStep()}
                </div>
            </div>

            {/* Animated Upload Progress Modal */}
            <AnimatedUploadProgress
                isUploading={isUploading}
                progress={uploadProgress}
                stage={uploadStage}
                fileName={selectedFile?.name}
            />
        </>
    );
};

export default CreatorUpload;
