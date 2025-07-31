# Contributing to LibertyX

Thank you for your interest in contributing to LibertyX! We're building the future of decentralized content creation, and we welcome contributions from the Web3 community.

## 🌟 Ways to Contribute

### 🔧 **Technical Contributions**
- **Bug Fixes**: Help us improve platform stability
- **Feature Development**: Add new Web3 functionality
- **Performance Optimization**: Enhance Arweave integration
- **Security Improvements**: Strengthen smart contract security
- **Documentation**: Improve guides and tutorials

### 🎨 **Design Contributions**
- **UI/UX Improvements**: Enhance user experience
- **Mobile Responsiveness**: Optimize for all devices
- **Accessibility**: Make the platform inclusive
- **Brand Assets**: Create promotional materials

### 📚 **Content Contributions**
- **Documentation**: Write guides and tutorials
- **Video Tutorials**: Create Web3 onboarding content
- **Blog Posts**: Share insights about decentralized content
- **Community Support**: Help other contributors

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

```bash
# Required Software
- Node.js 18+ 
- npm or yarn
- Git
- MetaMask wallet
- ArConnect extension (for Arweave testing)

# Recommended Tools
- VS Code with TypeScript extension
- Web3 development experience
- Understanding of React/TypeScript
```

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/libertyX.git
   cd libertyX
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Configure your environment variables
   # Add your Arweave wallet key for testing
   # Add Ethereum testnet RPC URLs
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Verify Setup**
   - Open http://localhost:3000
   - Connect your MetaMask wallet
   - Test basic functionality

## 📋 Contribution Guidelines

### Code Standards

#### **TypeScript/JavaScript**
```typescript
// ✅ Good: Type-safe, clear naming
interface VideoMetadata {
  title: string;
  description: string;
  duration: number;
  createdAt: Date;
}

const uploadToArweave = async (
  file: File, 
  metadata: VideoMetadata
): Promise<ArweaveUploadResult> => {
  // Implementation
};

// ❌ Avoid: Any types, unclear naming
const upload = async (f: any, m: any): Promise<any> => {
  // Implementation
};
```

#### **React Components**
```tsx
// ✅ Good: Functional components with proper typing
interface VideoPlayerProps {
  videoUrl: string;
  onPlay?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onPlay,
  className = ''
}) => {
  // Component implementation
};

// ❌ Avoid: Class components, missing types
export class VideoPlayer extends React.Component {
  // Avoid class components for new code
}
```

#### **Web3 Integration**
```typescript
// ✅ Good: Proper error handling, type safety
const connectWallet = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection failed:', error);
    return null;
  }
};

// ❌ Avoid: No error handling, unclear types
const connect = async () => {
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  return accounts[0];
};
```

### Commit Message Format

Use conventional commits for clear history:

```bash
# Format: type(scope): description

# Examples:
feat(arweave): add video upload progress tracking
fix(wallet): resolve MetaMask connection timeout
docs(readme): update installation instructions
style(ui): improve mobile responsiveness
refactor(analytics): optimize performance tracking
test(upload): add Arweave integration tests
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make Changes**
   - Follow code standards
   - Add tests for new functionality
   - Update documentation if needed
   - Test thoroughly on multiple devices

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(feature): add new functionality"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create Pull Request on GitHub
   ```

5. **PR Requirements**
   - [ ] Clear description of changes
   - [ ] Tests pass (if applicable)
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)
   - [ ] Screenshots for UI changes

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "Arweave"
npm test -- --grep "Video Upload"

# Run tests in watch mode
npm test -- --watch
```

### Test Categories

#### **Unit Tests**
```typescript
// Example: Testing Arweave service
describe('ArweaveService', () => {
  it('should upload video successfully', async () => {
    const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    const result = await arweaveService.uploadFile(mockFile, metadata);
    
    expect(result.transactionId).toBeDefined();
    expect(result.status).toBe('pending');
  });
});
```

#### **Integration Tests**
```typescript
// Example: Testing wallet connection
describe('Wallet Integration', () => {
  it('should connect to MetaMask', async () => {
    const address = await connectWallet();
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
```

#### **E2E Tests**
```typescript
// Example: Testing video upload flow
describe('Video Upload Flow', () => {
  it('should upload video to Arweave', async () => {
    // Test complete user journey
    await page.goto('/upload');
    await page.setInputFiles('#video-input', 'test-video.mp4');
    await page.click('#upload-button');
    await expect(page.locator('#success-message')).toBeVisible();
  });
});
```

## 🎯 Priority Areas

We especially welcome contributions in these areas:

### **High Priority**
1. **Mobile Optimization**: Improve mobile user experience
2. **Performance**: Optimize Arweave upload/download speeds
3. **Security**: Enhance smart contract security
4. **Accessibility**: Make platform accessible to all users

### **Medium Priority**
1. **Analytics**: Advanced creator analytics features
2. **UI/UX**: Design improvements and user flow optimization
3. **Documentation**: Comprehensive guides and tutorials
4. **Testing**: Increase test coverage

### **Future Features**
1. **Live Streaming**: Real-time content streaming
2. **Multi-chain**: Support for other blockchains
3. **Mobile App**: Native mobile applications
4. **DAO Governance**: Decentralized platform governance

## 🐛 Bug Reports

### Before Reporting
1. **Search Existing Issues**: Check if bug already reported
2. **Reproduce**: Ensure bug is reproducible
3. **Test Environment**: Try in different browsers/devices

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Wallet: MetaMask 11.5.0
- Network: Ethereum Mainnet

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other solutions you've considered

## Additional Context
Mockups, examples, or references

## Implementation Notes
Technical considerations (if any)
```

## 🏆 Recognition

### Contributor Levels

#### **🌟 Community Contributor**
- First-time contributors
- Bug reports and small fixes
- Documentation improvements

#### **🚀 Core Contributor**
- Regular contributions
- Feature development
- Code reviews and mentoring

#### **💎 Maintainer**
- Significant platform contributions
- Technical leadership
- Community building

### Rewards and Recognition

- **GitHub Profile**: Featured in contributors list
- **Discord Role**: Special contributor roles
- **NFT Badges**: Exclusive contributor NFTs
- **Platform Credits**: Early access to premium features
- **Job Opportunities**: Potential employment opportunities

## 📞 Getting Help

### **Technical Questions**
- **Discord**: Join our developer channel
- **GitHub Issues**: Create discussion issues
- **Email**: Contact lead developer

### **Contribution Questions**
- **Mentorship**: Pair with experienced contributors
- **Code Reviews**: Get feedback on your contributions
- **Best Practices**: Learn Web3 development patterns

### **Contact Information**
- **Lead Developer**: 0x9fAfD8e5EE0FAda57b2118F854D7d7dDd98186A0
- **Discord**: LibertyX Community Server
- **GitHub**: Create issues for technical discussions

## 📚 Resources

### **Learning Resources**
- [Web3 Development Guide](docs/web3-development.md)
- [Arweave Integration Tutorial](docs/arweave-tutorial.md)
- [Smart Contract Development](docs/smart-contracts.md)
- [React/TypeScript Best Practices](docs/frontend-guide.md)

### **Development Tools**
- [VS Code Extensions](docs/development-setup.md#vscode)
- [Testing Framework](docs/testing-guide.md)
- [Deployment Guide](docs/deployment.md)

### **Community**
- **Discord**: Real-time discussions
- **GitHub Discussions**: Long-form technical discussions
- **Twitter**: Platform updates and announcements

## 🤝 Code of Conduct

### Our Standards

- **Respectful**: Treat all community members with respect
- **Inclusive**: Welcome contributors from all backgrounds
- **Collaborative**: Work together toward common goals
- **Professional**: Maintain professional communication
- **Constructive**: Provide helpful, constructive feedback

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks or insults
- Spam or off-topic content
- Sharing private information without consent

### Enforcement

Community leaders will:
1. **Warning**: First offense gets a private warning
2. **Temporary Ban**: Repeated offenses result in temporary ban
3. **Permanent Ban**: Severe or continued violations result in permanent ban

## 🎉 Thank You!

Your contributions help build the future of decentralized content creation. Whether you're fixing a typo, adding a feature, or helping other contributors, every contribution matters.

**Together, we're building something revolutionary. Welcome to the LibertyX community!** 🚀

---

*For questions about contributing, reach out to our development team or join our Discord community. We're here to help you succeed!*