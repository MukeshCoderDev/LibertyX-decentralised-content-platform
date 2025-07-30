# Product Advertisement System

A comprehensive promotional video management system for the LibertyX landing page.

## 🚀 Quick Start

### Basic Usage

Replace your current landing page video background with the promotional video system:

```tsx
import React from 'react';
import { PromotionalVideoBackground } from './components/promotional-video';

const LandingPage = () => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <PromotionalVideoBackground 
        onVideoLoad={(video) => console.log('Loaded:', video.title)}
        onVideoError={(error) => console.warn('Error:', error.message)}
      />
      {/* Your content here */}
    </div>
  );
};
```

### Simple Version (No Dependencies)

If you want to start with a basic version without all the advanced features:

```tsx
import { SimplePromotionalVideo } from './components/promotional-video';

const LandingPage = () => {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <SimplePromotionalVideo />
      {/* Your content here */}
    </div>
  );
};
```

## 📁 Components

### User-Facing Components

- **`PromotionalVideoBackground`** - Main video background component with full features
- **`SimplePromotionalVideo`** - Basic video background without dependencies
- **`VideoPreferenceToggle`** - User control to enable/disable video backgrounds
- **`ErrorBoundary`** - General error boundary for graceful error handling
- **`VideoErrorBoundary`** - Video-specific error boundary

### Admin Components

- **`AdminPanel`** - Complete admin interface with tabs
- **`AdminVideoManager`** - Video upload and management interface
- **`VideoScheduler`** - Video scheduling and priority management
- **`AnalyticsDashboard`** - Analytics visualization and reporting

## 🛠️ Services

### PromotionalVideoService

```tsx
import { promotionalVideoService } from './lib/promotionalVideoService';

// Get current video
const currentVideo = await promotionalVideoService.getCurrentVideo();

// Upload new video
const uploadedVideo = await promotionalVideoService.uploadVideo(file, {
  title: 'My Video',
  description: 'Description',
  priority: 10
});

// Get all videos
const allVideos = await promotionalVideoService.getAllVideos();
```

### AnalyticsService

```tsx
import { analyticsService } from './lib/analyticsService';

// Track impression
await analyticsService.trackImpression('video-id', 'desktop');

// Track interaction
await analyticsService.trackInteraction('video-id', 'play');

// Get analytics
const analytics = await analyticsService.getVideoAnalytics('video-id', {
  startDate: new Date('2024-01-01'),
  endDate: new Date()
});
```

### PerformanceService

```tsx
import { performanceService } from './lib/performanceService';

// Get optimized video URL
const optimizedUrl = performanceService.getOptimizedVideoUrl('video-id', 'mobile');

// Check if video should be used
const shouldUseVideo = performanceService.shouldUseVideoBackground();

// Get performance settings
const settings = performanceService.getOptimalVideoSettings();
```

## 🎯 Features

### ✅ Video Management
- Drag-and-drop video upload
- Video validation (format, size)
- Thumbnail generation
- Priority-based display
- Active/inactive status control

### ✅ Smart Scheduling
- Time-based content display
- Recurring patterns (daily, weekly, monthly)
- Conflict detection and resolution
- Timezone support

### ✅ Performance Optimization
- Device detection (mobile, tablet, desktop)
- Network speed adaptation
- Data saver mode support
- Progressive loading
- Multiple fallback levels

### ✅ Analytics Tracking
- Impression tracking
- Interaction monitoring
- Completion rate calculation
- Click-through rate measurement
- Real-time metrics
- Export capabilities (CSV, JSON)

### ✅ Error Handling
- Graceful fallbacks
- Error boundaries
- Timeout protection
- Network error recovery

## 🔧 Configuration

### Environment Variables

```env
NODE_ENV=development  # Enables sample data
```

### CSS Variables

```css
:root {
  --primary: #007bff;
  --background: #111827;
  --background-secondary: #1f2937;
  --text-primary: #fff;
  --text-secondary: #888;
  --border: #374151;
}
```

## 📊 Admin Interface

Access the admin panel to manage videos:

```tsx
import { AdminPanel } from './components/promotional-video';

const AdminPage = () => {
  return <AdminPanel />;
};
```

### Admin Features:
- **Video Management**: Upload, edit, delete videos
- **Scheduling**: Set display times and recurring patterns
- **Analytics**: View performance metrics and export data
- **Priority Control**: Manage video display order

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Test files included:
- `__tests__/promotionalVideoService.test.ts`
- `__tests__/analyticsService.test.ts`
- `__tests__/PromotionalVideoBackground.test.tsx`
- `__tests__/integration/videoUploadWorkflow.test.ts`

## 🚨 Troubleshooting

### Common Issues

1. **Video not loading**: Check network connection and video URL
2. **Import errors**: Ensure all dependencies are installed
3. **Styling issues**: Include the CSS file: `import './styles/promotional-video.css'`
4. **Performance issues**: Enable data saver mode or use SimplePromotionalVideo

### Error Messages

- `VideoError: File size exceeds maximum` - Reduce video file size
- `VideoError: File type not supported` - Use MP4 or WebM format
- `Video loading timeout` - Check network connection

## 📱 Mobile Support

The system automatically optimizes for mobile devices:
- Smaller video files for mobile
- Data saver mode detection
- Reduced motion support
- Touch-friendly controls

## 🔒 Privacy & Security

- No personal data collection
- Local storage for preferences
- Secure video upload validation
- CORS-compliant requests

## 🎨 Customization

### Styling

Override CSS variables or component styles:

```css
.promotional-video-background {
  filter: blur(2px); /* Less blur */
}
```

### Fallback Strategy

Customize fallback levels in `types/promotional-video.ts`:

```typescript
export const FALLBACK_STRATEGY = {
  primary: 'your_promotional_video',
  secondary: 'your_default_video', 
  tertiary: 'your_static_background',
  emergency: 'your_solid_color'
} as const;
```

## 📈 Analytics

Track video performance with built-in analytics:
- Impression counts
- Completion rates
- Click-through rates
- Device breakdowns
- Performance scores

Export data for external analysis or integrate with your existing analytics platform.

## 🔄 Updates

The system supports hot-swapping videos without page refresh and automatic rotation based on priority and scheduling rules.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error messages in browser console
3. Test with SimplePromotionalVideo for basic functionality
4. Check network connectivity and video file formats