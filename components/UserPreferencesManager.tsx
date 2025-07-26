import React, { useState, useEffect } from 'react';
import { useAIRecommendations, UserPreferences } from '../hooks/useAIRecommendations';
import { useWallet } from '../lib/WalletProvider';
import Button from './ui/Button';

const UserPreferencesManager: React.FC = () => {
  const { account } = useWallet();
  const {
    userPreferences,
    updateUserPreferences,
    isLoading
  } = useAIRecommendations();

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userPreferences) {
      setPreferences({ ...userPreferences });
    }
  }, [userPreferences]);

  const handleCategoryToggle = (category: string) => {
    if (!preferences) return;

    const updatedCategories = preferences.categories.includes(category)
      ? preferences.categories.filter(c => c !== category)
      : [...preferences.categories, category];

    setPreferences({
      ...preferences,
      categories: updatedCategories
    });
    setHasChanges(true);
  };

  const handleContentTypeToggle = (contentType: string) => {
    if (!preferences) return;

    const updatedTypes = preferences.contentTypes.includes(contentType)
      ? preferences.contentTypes.filter(t => t !== contentType)
      : [...preferences.contentTypes, contentType];

    setPreferences({
      ...preferences,
      contentTypes: updatedTypes
    });
    setHasChanges(true);
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: number) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      priceRange: {
        ...preferences.priceRange,
        [field]: value
      }
    });
    setHasChanges(true);
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await updateUserPreferences(preferences);
      setHasChanges(false);
      alert('Preferences saved successfully!');
    } catch (err) {
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPreferences = () => {
    if (!userPreferences) return;
    
    setPreferences({ ...userPreferences });
    setHasChanges(false);
  };

  const getViewingStats = () => {
    if (!preferences?.viewingHistory) return null;

    const totalViews = preferences.viewingHistory.length;
    const totalWatchTime = preferences.viewingHistory.reduce((sum, session) => sum + session.duration, 0);
    const averageCompletion = preferences.viewingHistory.reduce((sum, session) => sum + session.completionRate, 0) / totalViews;
    const likeRate = preferences.viewingHistory.filter(session => session.liked).length / totalViews;

    return {
      totalViews,
      totalWatchTime: Math.floor(totalWatchTime / 60), // Convert to minutes
      averageCompletion: averageCompletion * 100,
      likeRate: likeRate * 100
    };
  };

  const getCategoryStats = () => {
    if (!preferences?.viewingHistory) return [];

    const categoryViews: { [key: string]: number } = {};
    preferences.viewingHistory.forEach(session => {
      // In a real implementation, we'd get category from content metadata
      const category = 'DeFi'; // Mock category
      categoryViews[category] = (categoryViews[category] || 0) + 1;
    });

    return Object.entries(categoryViews)
      .map(([category, views]) => ({ category, views }))
      .sort((a, b) => b.views - a.views);
  };

  if (!account) {
    return (
      <div className="bg-card p-6 rounded-2xl text-center">
        <p className="text-text-secondary">Connect your wallet to manage your preferences</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-card p-6 rounded-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-1/3"></div>
          <div className="h-32 bg-border rounded"></div>
          <div className="h-32 bg-border rounded"></div>
        </div>
      </div>
    );
  }

  const viewingStats = getViewingStats();
  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-satoshi font-bold">AI Preferences</h2>
          <p className="text-text-secondary text-sm mt-1">
            Customize your content recommendations and discovery experience
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="secondary"
              onClick={handleResetPreferences}
              disabled={saving}
              className="text-sm"
            >
              Reset
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleSavePreferences}
            disabled={!hasChanges || saving}
            className="text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Viewing Statistics */}
      {viewingStats && (
        <div className="bg-card p-6 rounded-2xl">
          <h3 className="text-lg font-satoshi font-bold mb-4">Your Viewing Statistics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{viewingStats.totalViews}</div>
              <div className="text-sm text-text-secondary">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{viewingStats.totalWatchTime}m</div>
              <div className="text-sm text-text-secondary">Watch Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{viewingStats.averageCompletion.toFixed(1)}%</div>
              <div className="text-sm text-text-secondary">Avg Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{viewingStats.likeRate.toFixed(1)}%</div>
              <div className="text-sm text-text-secondary">Like Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Category Preferences */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Preferred Categories</h3>
        <p className="text-text-secondary text-sm mb-4">
          Select categories you're interested in to get better recommendations
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            'DeFi', 'NFTs', 'Trading', 'Blockchain', 'Crypto News',
            'Education', 'Technical Analysis', 'Market Updates', 'Project Reviews', 'Tutorials'
          ].map(category => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`p-3 rounded-lg border transition-all ${
                preferences.categories.includes(category)
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border bg-background/30 text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="text-sm font-medium">{category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Type Preferences */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Content Types</h3>
        <p className="text-text-secondary text-sm mb-4">
          Choose the types of content you prefer to see
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            'Video', 'Article', 'Live Stream', 'Podcast', 'Course', 'Analysis'
          ].map(contentType => (
            <button
              key={contentType}
              onClick={() => handleContentTypeToggle(contentType)}
              className={`p-3 rounded-lg border transition-all ${
                preferences.contentTypes.includes(contentType)
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border bg-background/30 text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="text-sm font-medium">{contentType}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Preferences */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Price Range</h3>
        <p className="text-text-secondary text-sm mb-4">
          Set your preferred price range for content recommendations
        </p>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Minimum Price (LIB)
              </label>
              <input
                type="number"
                min="0"
                value={preferences.priceRange.min}
                onChange={(e) => handlePriceRangeChange('min', parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Maximum Price (LIB)
              </label>
              <input
                type="number"
                min="0"
                value={preferences.priceRange.max}
                onChange={(e) => handlePriceRangeChange('max', parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          
          <div className="bg-background/30 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Current Range:</span>
              <span className="text-primary font-medium">
                {preferences.priceRange.min} - {preferences.priceRange.max} LIB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Learning Insights */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">AI Learning Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">What AI Has Learned About You</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">You prefer educational DeFi content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm">You watch videos during evening hours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-sm">You engage more with technical analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm">You prefer mid-range pricing (10-50 LIB)</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Recommendation Accuracy</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Content Match</span>
                  <span>87%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Creator Match</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Price Match</span>
                  <span>78%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Privacy & Data</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Allow AI Learning</h4>
              <p className="text-sm text-text-secondary">
                Let AI analyze your behavior to improve recommendations
              </p>
            </div>
            <button className="w-12 h-6 bg-primary rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Share Anonymous Analytics</h4>
              <p className="text-sm text-text-secondary">
                Help improve the platform with anonymous usage data
              </p>
            </div>
            <button className="w-12 h-6 bg-primary rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Personalized Notifications</h4>
              <p className="text-sm text-text-secondary">
                Receive notifications about content matching your interests
              </p>
            </div>
            <button className="w-12 h-6 bg-border rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card p-6 rounded-2xl">
        <h3 className="text-lg font-satoshi font-bold mb-4">Data Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="secondary" className="text-sm">
            Export My Data
          </Button>
          <Button variant="secondary" className="text-sm">
            Clear Viewing History
          </Button>
          <Button variant="secondary" className="text-sm text-red-400 border-red-500/50 hover:bg-red-500/10">
            Reset All Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesManager;