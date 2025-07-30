// Core data models for the Product Advertisement System

export interface PromotionalVideo {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  fileSize: number;
  duration: number;
  format: 'mp4' | 'webm';
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  schedule?: VideoSchedule;
  analytics: VideoAnalytics;
}

export interface VideoSchedule {
  startDate: Date;
  endDate: Date;
  timezone: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
}

export interface VideoAnalytics {
  impressions: number;
  completionRate: number;
  clickThroughRate: number;
  averageViewTime: number;
  deviceBreakdown: DeviceStats;
  performanceScore: number;
}

export interface DeviceStats {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface VideoMetadata {
  title: string;
  description: string;
  priority?: number;
  schedule?: VideoSchedule;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface VideoError {
  type: 'network' | 'format' | 'storage' | 'timeout';
  message: string;
  videoId?: string;
}

export class VideoErrorClass extends Error implements VideoError {
  type: 'network' | 'format' | 'storage' | 'timeout';
  videoId?: string;

  constructor(error: VideoError) {
    super(error.message);
    this.name = 'VideoError';
    this.type = error.type;
    this.videoId = error.videoId;
  }
}

// Service interfaces
export interface PromotionalVideoService {
  getCurrentVideo(): Promise<PromotionalVideo | null>;
  getActiveVideos(): Promise<PromotionalVideo[]>;
  uploadVideo(file: File, metadata: VideoMetadata): Promise<PromotionalVideo>;
  updateVideo(id: string, updates: Partial<PromotionalVideo>): Promise<PromotionalVideo>;
  deleteVideo(id: string): Promise<void>;
  toggleVideoStatus(id: string, isActive: boolean): Promise<void>;
}

export interface AnalyticsService {
  trackImpression(videoId: string, deviceType: string): Promise<void>;
  trackInteraction(videoId: string, interactionType: string): Promise<void>;
  getVideoAnalytics(videoId: string, dateRange: DateRange): Promise<VideoAnalytics>;
  exportAnalytics(format: 'csv' | 'json'): Promise<Blob>;
}

export interface PerformanceService {
  getOptimizedVideoUrl(videoId: string, deviceType: string): string;
  preloadNextVideo(): Promise<void>;
  handleVideoError(error: VideoError): Promise<string>; // Returns fallback URL
}

// Fallback strategy configuration
export const FALLBACK_STRATEGY = {
  primary: 'current_promotional_video',
  secondary: 'default_promotional_video', 
  tertiary: 'static_branded_background',
  emergency: 'solid_color_background'
} as const;

export type FallbackLevel = keyof typeof FALLBACK_STRATEGY;