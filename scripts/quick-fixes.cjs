#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying Quick TypeScript Fixes...\n');

// Fix 1: Remove unused imports (common pattern)
const removeUnusedImports = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip lines with unused imports (basic pattern matching)
    if (line.includes('is declared but its value is never read')) {
      continue;
    }
    
    fixedLines.push(line);
  }
  
  fs.writeFileSync(filePath, fixedLines.join('\n'));
};

// Fix 2: Add missing props to test components
const fixTestComponentProps = () => {
  const testFiles = [
    'test/tasks-17-19-comprehensive-audit.test.tsx'
  ];
  
  testFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix CommentSystem contentId prop
    content = content.replace(
      /contentId="test-content-123"/g,
      'contentId={123}'
    );
    
    content = content.replace(
      /contentId="test-123"/g,
      'contentId={123}'
    );
    
    // Fix LiveStreamChat props
    content = content.replace(
      /<LiveStreamChat streamId="stream-123" \/>/g,
      '<LiveStreamChat streamId="stream-123" creatorAddress="0x123" isLive={true} viewerCount={10} />'
    );
    
    content = content.replace(
      /<LiveStreamChat streamId="test" \/>/g,
      '<LiveStreamChat streamId="test" creatorAddress="0x123" isLive={true} viewerCount={5} />'
    );
    
    // Fix CreatorCollaboration props
    content = content.replace(
      /<CreatorCollaboration \/>/g,
      '<CreatorCollaboration creatorAddress="0x123" />'
    );
    
    // Fix CommunityIntegration props
    content = content.replace(
      /<CommunityIntegration \/>/g,
      '<CommunityIntegration creatorAddress="0x123" />'
    );
    
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed props in ${file}`);
  });
};

// Fix 3: Add missing mock implementations
const addMissingMocks = () => {
  const testFile = 'test/tasks-17-19-comprehensive-audit.test.tsx';
  
  if (!fs.existsSync(testFile)) return;
  
  let content = fs.readFileSync(testFile, 'utf8');
  
  // Add useContractManager mock
  const mockSection = `
// Mock useContractManager
vi.mock('../hooks/useContractManager', () => ({
  useContractManager: vi.fn(() => ({
    contracts: {
      libertyToken: { address: '0x123' },
      creatorRegistry: { address: '0x456' },
      contentRegistry: { address: '0x789' },
    },
    executeTransaction: vi.fn().mockResolvedValue({ hash: '0xabc' }),
    isLoading: false,
    error: null,
  })),
}));
`;
  
  // Insert mock after existing mocks
  content = content.replace(
    /vi\.mock\('\.\.\/hooks\/useContractManager'.*?\}\)\);/s,
    mockSection.trim()
  );
  
  fs.writeFileSync(testFile, content);
  console.log(`✅ Added missing mocks in ${testFile}`);
};

// Fix 4: Fix navigator.credentials mock
const fixNavigatorMock = () => {
  const testFile = 'test/tasks-17-19-comprehensive-audit.test.tsx';
  
  if (!fs.existsSync(testFile)) return;
  
  let content = fs.readFileSync(testFile, 'utf8');
  
  // Fix navigator.credentials assignment
  content = content.replace(
    /global\.navigator\.credentials = \{/,
    `Object.defineProperty(global.navigator, 'credentials', {
      value: {`
  );
  
  content = content.replace(
    /\};$/m,
    `},
      writable: true
    });`
  );
  
  fs.writeFileSync(testFile, content);
  console.log(`✅ Fixed navigator mock in ${testFile}`);
};

// Apply all fixes
console.log('Applying component prop fixes...');
fixTestComponentProps();

console.log('Adding missing mocks...');
addMissingMocks();

console.log('Fixing navigator mock...');
fixNavigatorMock();

console.log('\n✅ Quick fixes applied!');
console.log('\n📋 Next steps:');
console.log('1. Run: npx tsc --noEmit --skipLibCheck');
console.log('2. Fix remaining errors manually');
console.log('3. Run: node scripts/pre-github-audit.js');
console.log('4. Push to GitHub when all checks pass');