import React, { useState } from 'react';

const ArweaveFeatureHighlight: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: '♾️',
      title: 'Permanent Storage',
      description: 'Your content is stored forever on Arweave\'s decentralized network',
      detail: 'Unlike traditional cloud storage, Arweave guarantees your content will be accessible for at least 200 years through economic incentives.',
      color: 'from-purple-500 to-blue-500'
    },
    {
      icon: '🔒',
      title: 'Censorship Resistant',
      description: 'No single entity can remove or censor your content',
      detail: 'Your content is distributed across thousands of nodes worldwide, making it impossible for any government or corporation to take down.',
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: '💎',
      title: 'One-Time Payment',
      description: 'Pay once, store forever - no recurring fees',
      detail: 'Traditional storage requires monthly payments forever. With Arweave, you pay once and your content is guaranteed to be stored permanently.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: '🌐',
      title: 'Global Access',
      description: 'Your content is accessible from anywhere in the world',
      detail: 'Arweave\'s global network ensures fast access to your content from any location, with built-in redundancy and reliability.',
      color: 'from-blue-500 to-indigo-500'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-white">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-2">Why Arweave?</h3>
        <p className="text-gray-300">The future of permanent, decentralized storage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`relative p-6 rounded-xl cursor-pointer transition-all duration-300 ${
              activeFeature === index
                ? 'bg-white bg-opacity-10 scale-105 shadow-2xl'
                : 'bg-white bg-opacity-5 hover:bg-opacity-10'
            }`}
            onClick={() => setActiveFeature(index)}
          >
            <div className="flex items-start space-x-4">
              <div className={`text-4xl p-3 rounded-full bg-gradient-to-r ${feature.color} bg-opacity-20`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{feature.description}</p>
                
                {activeFeature === index && (
                  <div className="animate-fadeIn">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {feature.detail}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {activeFeature === index && (
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${feature.color} opacity-10 animate-pulse`} />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-white bg-opacity-10 rounded-full px-6 py-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Powered by Arweave Permaweb</span>
        </div>
      </div>
    </div>
  );
};

export default ArweaveFeatureHighlight;