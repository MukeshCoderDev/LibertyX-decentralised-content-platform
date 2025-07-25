import React, { useState } from 'react';
import { useWallet } from '../lib/WalletProvider';
import { useCreatorRegistry } from '../hooks/useCreatorRegistry'; // Import the new hook
import Button from './ui/Button';
import Modal from './ui/Modal';

interface CreatorRegistrationFormProps {
  onRegistrationSuccess: () => void;
  onClose: () => void;
}

const CreatorRegistrationForm: React.FC<CreatorRegistrationFormProps> = ({ onRegistrationSuccess, onClose }) => {
  const { account, isConnected } = useWallet();
  const { registerCreator, isLoading, error, setError } = useCreatorRegistry(); // Use the new hook

  const [handle, setHandle] = useState('');
  const [avatarURI, setAvatarURI] = useState('');
  const [bio, setBio] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Keep success message here

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear error from hook
    setSuccessMessage(null);

    if (!isConnected || !account) {
      setError('Please connect your wallet to register as a creator.');
      return;
    }
    if (!handle || !avatarURI || !bio) {
      setError('All fields are required.');
      return;
    }

    try {
      const txResult = await registerCreator(handle, avatarURI, bio);
      if (txResult) {
        console.log('Registration transaction sent:', txResult.hash);
        setSuccessMessage('Creator registration successful! Transaction hash: ' + txResult.hash);
        onRegistrationSuccess();
      } else {
        // Error is already set by the hook if txResult is null
        setSuccessMessage(null);
      }
    } catch (err: any) {
      // This catch block might be redundant if hook handles all errors, but good for safety
      console.error('Creator registration failed:', err);
      setError(`Registration failed: ${err.message || err.reason || 'Unknown error'}`);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Register as a Creator">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="handle" className="block text-sm font-medium text-gray-700">
            Creator Handle
          </label>
          <input
            type="text"
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., @LibertyCreator"
            required
          />
        </div>
        <div>
          <label htmlFor="avatarURI" className="block text-sm font-medium text-gray-700">
            Avatar URI (IPFS/Arweave)
          </label>
          <input
            type="url"
            id="avatarURI"
            value={avatarURI}
            onChange={(e) => setAvatarURI(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., ipfs://Qm... or arweave://..."
            required
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Tell us about yourself and your content..."
            required
          ></textarea>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

        <div className="flex justify-end space-x-2">
          <Button type="button" onClick={onClose} variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !isConnected}>
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatorRegistrationForm;