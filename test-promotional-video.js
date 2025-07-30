// Simple test to check if the promotional video system is working
import { promotionalVideoService } from './lib/promotionalVideoService.js';

console.log('Testing promotional video service...');

// Test getting current video
promotionalVideoService.getCurrentVideo()
  .then(video => {
    console.log('Current video:', video);
  })
  .catch(error => {
    console.error('Error getting current video:', error);
  });

// Test getting all videos
promotionalVideoService.getAllVideos()
  .then(videos => {
    console.log('All videos:', videos.length);
  })
  .catch(error => {
    console.error('Error getting all videos:', error);
  });