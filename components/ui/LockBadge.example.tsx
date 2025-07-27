/**
 * Example usage of the LockBadge component
 * This file demonstrates how to use the unified access control badge
 */

import React from 'react';
import { LockBadge, LockBadgeText, useAccessRequirementText } from './LockBadge';

export const LockBadgeExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">LockBadge Component Examples</h1>

      {/* Subscription Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Subscription Access</h2>
        <div className="flex gap-4 items-center">
          <LockBadge
            accessType="subscription"
            hasAccess={false}
          />
          <LockBadge
            accessType="subscription"
            hasAccess={true}
          />
          <LockBadge
            accessType="subscription"
            hasAccess={false}
            isLoading={true}
          />
        </div>
      </section>

      {/* NFT Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">NFT Access</h2>
        <div className="flex gap-4 items-center">
          <LockBadge
            accessType="nft"
            hasAccess={false}
            tier={1}
          />
          <LockBadge
            accessType="nft"
            hasAccess={false}
            tier={2}
          />
          <LockBadge
            accessType="nft"
            hasAccess={true}
            tier={3}
          />
        </div>
      </section>

      {/* Premium Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Premium Access</h2>
        <div className="flex gap-4 items-center">
          <LockBadge
            accessType="premium"
            hasAccess={false}
          />
          <LockBadge
            accessType="premium"
            hasAccess={true}
          />
        </div>
      </section>

      {/* Size Variants */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
        <div className="flex gap-4 items-center">
          <LockBadge
            accessType="subscription"
            hasAccess={false}
            size="small"
          />
          <LockBadge
            accessType="subscription"
            hasAccess={false}
            size="medium"
          />
          <LockBadge
            accessType="subscription"
            hasAccess={false}
            size="large"
          />
        </div>
      </section>

      {/* Without Icons */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Without Icons</h2>
        <div className="flex gap-4 items-center">
          <LockBadge
            accessType="subscription"
            hasAccess={false}
            showIcon={false}
          />
          <LockBadge
            accessType="nft"
            hasAccess={false}
            tier={2}
            showIcon={false}
          />
          <LockBadge
            accessType="premium"
            hasAccess={true}
            showIcon={false}
          />
        </div>
      </section>

      {/* Text-only Badges */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Text-only Badges (for under creator names)</h2>
        <div className="space-y-2">
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold">Creator Name</h3>
            <LockBadgeText
              accessType="subscription"
              hasAccess={false}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold">Creator Name</h3>
            <LockBadgeText
              accessType="nft"
              hasAccess={false}
              tier={2}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold">Creator Name</h3>
            <LockBadgeText
              accessType="premium"
              hasAccess={false}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="font-bold">Creator Name</h3>
            <LockBadgeText
              accessType="subscription"
              hasAccess={true}
            />
            <p className="text-xs text-gray-400">No text shown when user has access</p>
          </div>
        </div>
      </section>

      {/* Hook Usage Example */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Access Requirement Text Hook</h2>
        <AccessTextExample />
      </section>
    </div>
  );
};

const AccessTextExample: React.FC = () => {
  const subscriptionText = useAccessRequirementText('subscription');
  const nftText = useAccessRequirementText('nft', 2);
  const premiumText = useAccessRequirementText('premium');

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold">Subscription</h4>
        <p className="text-sm text-gray-300">Full: {subscriptionText.fullText}</p>
        <p className="text-sm text-gray-300">Short: {subscriptionText.shortText}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold">NFT Tier #2</h4>
        <p className="text-sm text-gray-300">Full: {nftText.fullText}</p>
        <p className="text-sm text-gray-300">Short: {nftText.shortText}</p>
      </div>
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold">Premium</h4>
        <p className="text-sm text-gray-300">Full: {premiumText.fullText}</p>
        <p className="text-sm text-gray-300">Short: {premiumText.shortText}</p>
      </div>
    </div>
  );
};

export default LockBadgeExamples;