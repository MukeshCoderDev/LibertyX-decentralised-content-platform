import React, { useState } from 'react';

interface SimpleRegistrationFormProps {
  onClose: () => void;
}

const SimpleRegistrationForm: React.FC<SimpleRegistrationFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    handle: '',
    avatarURI: '',
    bio: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert(`Form Data:\nHandle: ${formData.handle}\nAvatar: ${formData.avatarURI}\nBio: ${formData.bio}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Simple Registration Test</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creator Handle *
            </label>
            <input
              type="text"
              value={formData.handle}
              onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your handle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL *
            </label>
            <input
              type="text"
              value={formData.avatarURI}
              onChange={(e) => setFormData(prev => ({ ...prev, avatarURI: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p><strong>Current Values:</strong></p>
            <p>Handle: {formData.handle || '(empty)'}</p>
            <p>Avatar: {formData.avatarURI || '(empty)'}</p>
            <p>Bio: {formData.bio || '(empty)'}</p>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleRegistrationForm;