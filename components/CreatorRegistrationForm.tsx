import React, { useState } from 'react';
import { useCreatorRegistry } from '../hooks/useCreatorRegistry';
import { useWallet } from '../lib/WalletProvider';
import Button from './ui/Button';

interface CreatorRegistrationFormProps {
  onRegistrationSuccess?: () => void;
  onClose?: () => void;
}

const CreatorRegistrationForm: React.FC<CreatorRegistrationFormProps> = ({
  onRegistrationSuccess,
  onClose,
}) => {
  const { account, isConnected } = useWallet();
  const { registerCreator, isLoading, error, clearError } = useCreatorRegistry();

  const [formData, setFormData] = useState({
    handle: '',
    avatarURI: '',
    bio: '',
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.handle.trim()) {
      errors.handle = 'Handle is required';
    } else if (formData.handle.length < 3) {
      errors.handle = 'Handle must be at least 3 characters';
    } else if (formData.handle.length > 20) {
      errors.handle = 'Handle must be less than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.handle)) {
      errors.handle = 'Handle can only contain letters, numbers, and underscores';
    }

    if (!formData.avatarURI.trim()) {
      errors.avatarURI = 'Avatar URL is required';
    } else if (!isValidURL(formData.avatarURI)) {
      errors.avatarURI = 'Please enter a valid URL';
    }

    if (!formData.bio.trim()) {
      errors.bio = 'Bio is required';
    } else if (formData.bio.length < 10) {
      errors.bio = 'Bio must be at least 10 characters';
    } else if (formData.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // URL validation helper
  const isValidURL = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted - starting registration process');
    
    if (!isConnected) {
      console.error('Wallet not connected');
      alert('Please connect your wallet first');
      return;
    }

    if (!account) {
      console.error('No account available');
      alert('No wallet account detected. Please reconnect your wallet.');
      return;
    }

    console.log('Connected account:', account);
    console.log('Form validation starting...');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed');
    clearError();

    try {
      console.log('Starting creator registration with data:', formData);
      console.log('Account address:', account);
      
      const result = await registerCreator(
        formData.handle,
        formData.avatarURI,
        formData.bio
      );

      console.log('Registration result:', result);

      if (result) {
        console.log('Creator registration successful:', result);
        alert(`Creator registration successful! Transaction hash: ${result.hash}`);
        
        if (onRegistrationSuccess) {
          onRegistrationSuccess();
        }
      } else {
        console.error('Registration returned null/undefined result');
        alert('Registration failed - no transaction result received');
      }
    } catch (error: any) {
      console.error('Registration failed with error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        stack: error.stack
      });
      
      // Show user-friendly error message
      let userMessage = 'Registration failed: ';
      if (error.message?.includes('user rejected')) {
        userMessage += 'Transaction was rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        userMessage += 'Insufficient funds for gas fees';
      } else if (error.message?.includes('taken')) {
        userMessage += 'This handle is already taken';
      } else if (error.message?.includes('empty handle')) {
        userMessage += 'Handle cannot be empty';
      } else {
        userMessage += error.message || 'Unknown error occurred';
      }
      
      alert(userMessage);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({ handle: '', avatarURI: '', bio: '' });
    setValidationErrors({});
    clearError();
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register as Creator</h2>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Handle Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creator Handle *
            </label>
            <input
              type="text"
              value={formData.handle}
              onChange={(e) => handleInputChange('handle', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                validationErrors.handle ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., creator123"
              disabled={isLoading}
            />
            {validationErrors.handle && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.handle}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Your unique identifier on the platform (3-20 characters, letters, numbers, underscore only)
            </p>
          </div>

          {/* Avatar URI Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL *
            </label>
            <input
              type="url"
              value={formData.avatarURI}
              onChange={(e) => handleInputChange('avatarURI', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                validationErrors.avatarURI ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com/avatar.jpg"
              disabled={isLoading}
            />
            {validationErrors.avatarURI && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.avatarURI}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              URL to your profile picture (HTTPS recommended)
            </p>
          </div>

          {/* Bio Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white ${
                validationErrors.bio ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Tell us about yourself and your content..."
              disabled={isLoading}
            />
            {validationErrors.bio && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.bio}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.bio.length}/500 characters (minimum 10 characters)
            </p>
          </div>

          {/* Avatar Preview */}
          {formData.avatarURI && isValidURL(formData.avatarURI) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar Preview
              </label>
              <img
                src={formData.avatarURI}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Wallet Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Connected Wallet:</strong> {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Registration will be stored on the blockchain and requires a transaction fee.
            </p>
          </div>

          {/* Debug Info (remove in production) */}
          <div className="bg-yellow-50 p-3 rounded-lg text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
            <p>Account: {account || 'None'}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || !isConnected}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
              ) : (
                'Register as Creator'
              )}
            </Button>
          </div>
        </form>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Processing registration...</p>
              <p className="text-xs text-gray-500">Please confirm the transaction in your wallet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorRegistrationForm;