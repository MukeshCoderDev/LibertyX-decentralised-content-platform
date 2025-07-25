import React, { useState, useEffect, useRef } from 'react';
import { NavigationProps, Page, TokenPrice } from '../types';
import Button from './ui/Button';
import Toggle from './ui/Toggle';
import Modal from './ui/Modal';
import { useArweave } from '../hooks/useArweave';
import { ContentMetadata } from '../lib/arweaveConfig';
import CryptoPriceInput from './CryptoPriceInput';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Arweave hook
    const {
        isUploading,
        uploadProgress,
        uploadResult,
        isWaitingConfirmation,
        error,
        uploadAndRegisterContent,
        getContentUrl,
        clearError,
        reset
    } = useArweave();

    // Generate thumbnails when file is selected
    useEffect(() => {
        if (selectedFile && selectedFile.type.startsWith('video/')) {
            generateThumbnails(selectedFile);
        }
    }, [selectedFile]);

    // Handle upload completion
    useEffect(() => {
        if (uploadResult) {
            setArweaveTransactionId(uploadResult.transactionId);
            console.log('✅ Content uploaded to Arweave:', uploadResult.transactionId);
            console.log('🔗 Content URL:', getContentUrl(uploadResult.transactionId));
        }
    }, [uploadResult, getContentUrl]);

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
            alert('Please provide a title for your content');
            return;
        }

        const metadata: Omit<ContentMetadata, 'arweaveId' | 'size' | 'createdAt'> = {
            title: title.trim(),
            description: description.trim() || 'No description provided',
            contentType: selectedFile.type,
            price: price.amount, // Price is already in wei format
            accessLevel: isEncrypted ? 'premium' : 'public',
            tags: ['video', 'content', 'libertyx'],
            thumbnail: thumbnails[selectedThumb - 1] || '',
            duration: 0, // Will be calculated later
        };

        try {
            clearError();
            const result = await uploadAndRegisterContent(selectedFile, metadata, true);
            
            if (result) {
                console.log('🎉 Upload and registration completed!');
                console.log('📁 Arweave TX:', result.arweaveResult.transactionId);
                console.log('⛓️ Blockchain TX:', result.txHash);
                setStep(5); // Success step
            }
        } catch (error: any) {
            console.error('❌ Upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        }
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Upload Your Content</h2>
                        <p className="text-text-secondary mb-8">Drag & drop your video file or click to select.</p>
                        
                        <div 
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-64 border-4 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-card/50 transition-colors"
                        >
                            <div className="text-6xl mb-4">📁</div>
                            <p className="text-lg">Drop file here</p>
                            <p className="text-sm text-text-secondary mt-2">or click to browse</p>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                        
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                                <p className="text-red-400">{error}</p>
                                <Button onClick={clearError} className="mt-2 text-sm">Dismiss</Button>
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
                        <p className="text-text-secondary mb-8">Set your price and privacy settings.</p>
                        
                        <div className="space-y-6">
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
                                        <span>Uploading to Arweave...</span>
                                        <span>{uploadProgress?.percentage || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress?.percentage || 0}%` }}
                                        />
                                    </div>
                                    {isWaitingConfirmation && (
                                        <p className="text-sm text-text-secondary mt-2">
                                            Waiting for blockchain confirmation...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <Button 
                            onClick={handleUploadToArweave} 
                            className="mt-8 w-full"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Upload to Arweave & Mint Access Pass'}
                        </Button>
                    </div>
                );

            case 5:
                return (
                    <div className="text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-3xl font-satoshi font-bold mb-4">Upload Successful!</h2>
                        <p className="text-text-secondary mb-8">
                            Your content has been permanently stored on Arweave and registered on the blockchain.
                        </p>
                        
                        {arweaveTransactionId && (
                            <div className="bg-background p-4 rounded-lg mb-6 text-left">
                                <p className="text-sm text-text-secondary mb-2">Arweave Transaction ID:</p>
                                <p className="font-mono text-sm break-all">{arweaveTransactionId}</p>
                                <a 
                                    href={getContentUrl(arweaveTransactionId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-sm"
                                >
                                    View on Arweave →
                                </a>
                            </div>
                        )}
                        
                        <div className="flex gap-4">
                            <Button 
                                onClick={() => onNavigate(Page.CreatorDashboard)} 
                                className="flex-1"
                            >
                                View Dashboard
                            </Button>
                            <Button 
                                onClick={() => {
                                    reset();
                                    setStep(1);
                                    setSelectedFile(null);
                                    setTitle('');
                                    setDescription('');
                                    setThumbnails([]);
                                    setArweaveTransactionId(null);
                                }} 
                                variant="secondary"
                                className="flex-1"
                            >
                                Upload Another
                            </Button>
                        </div>
                    </div>
                );

            default: 
                return null;
        }
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4">
            <div className="bg-card p-8 rounded-2xl shadow-lg">
                {renderStep()}
            </div>
 
        </div>
    );
};

export default CreatorUpload;
