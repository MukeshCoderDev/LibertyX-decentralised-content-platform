import React, { useState } from 'react';
import { useNFTAccess } from '../hooks/useNFTAccess';
import Button from './ui/Button';

interface NFTTierCreationFormProps {
  onSuccess?: (txHash: string) => void;
  onCancel?: () => void;
}

const NFTTierCreationForm: React.FC<NFTTierCreationFormProps> = ({ onSuccess, onCancel }) => {
  const { createTier, isLoading, error } = useNFTAccess();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    maxSupply: 100,
    priceEth: '0.1'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxSupply' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.imageUrl || !formData.priceEth) {
      alert('Please fill in all fields');
      return;
    }

    if (formData.maxSupply <= 0) {
      alert('Max supply must be greater than 0');
      return;
    }

    try {
      // Create metadata URI (in a real app, this would be uploaded to IPFS)
      const metadata = {
        name: formData.name,
        description: formData.description,
        image: formData.imageUrl,
        attributes: [
          {
            trait_type: "Max Supply",
            value: formData.maxSupply
          },
          {
            trait_type: "Price",
            value: `${formData.priceEth} ETH`
          }
        ]
      };
      
      // For demo purposes, we'll use a placeholder URI
      // In production, upload metadata to IPFS and use that URI
      const metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      
      const txHash = await createTier(metadataUri, formData.maxSupply, formData.priceEth);
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        maxSupply: 100,
        priceEth: '0.1'
      });
    } catch (err: any) {
      console.error('Error creating NFT tier:', err);
      alert(`Failed to create NFT tier: ${err.message}`);
    }
  };

  return (
    <div className="bg-card p-6 rounded-2xl">
      <h3 className="text-xl font-satoshi font-bold mb-6">Create NFT Access Tier</h3>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tier Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., VIP Access, Premium Tier"
            className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe what this NFT tier provides access to..."
            rows={3}
            className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image URL</label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            placeholder="https://example.com/nft-image.png"
            className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Supply</label>
            <input
              type="number"
              name="maxSupply"
              value={formData.maxSupply}
              onChange={handleInputChange}
              min="1"
              className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price (ETH)</label>
            <input
              type="number"
              name="priceEth"
              value={formData.priceEth}
              onChange={handleInputChange}
              step="0.001"
              min="0"
              className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Creating...' : 'Create NFT Tier'}
          </Button>
          
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default NFTTierCreationForm;