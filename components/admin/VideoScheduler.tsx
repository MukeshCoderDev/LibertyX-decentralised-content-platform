import React, { useState, useEffect } from 'react';
import { PromotionalVideo, VideoSchedule, RecurringPattern } from '../../types/promotional-video';
import { promotionalVideoService } from '../../lib/promotionalVideoService';

interface VideoSchedulerProps {
  video: PromotionalVideo;
  onClose: () => void;
  onSave: () => void;
}

const VideoScheduler: React.FC<VideoSchedulerProps> = ({ video, onClose, onSave }) => {
  const [schedule, setSchedule] = useState<VideoSchedule | undefined>(video.schedule);
  const [isRecurring, setIsRecurring] = useState(video.schedule?.isRecurring || false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
  });
  const [priority, setPriority] = useState(video.priority);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    if (video.schedule?.recurringPattern) {
      setRecurringPattern(video.schedule.recurringPattern);
    }
    checkScheduleConflicts();
  }, [schedule]);

  const checkScheduleConflicts = async () => {
    if (!schedule) return;
    
    try {
      // Get all videos to check for conflicts
      const allVideos = await promotionalVideoService.getAllVideos();
      const conflictingVideos = allVideos.filter(v => {
        if (v.id === video.id || !v.schedule || !v.isActive) return false;
        
        // Check for date range overlap
        const hasOverlap = (
          schedule.startDate <= v.schedule.endDate &&
          schedule.endDate >= v.schedule.startDate
        );
        
        return hasOverlap;
      });
      
      setConflicts(conflictingVideos.map(v => v.title));
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    }
  };

  const handleSave = async () => {
    try {
      const updatedSchedule = isRecurring && recurringPattern 
        ? { ...schedule!, isRecurring: true, recurringPattern }
        : { ...schedule!, isRecurring: false };

      await promotionalVideoService.updateVideo(video.id, {
        schedule: updatedSchedule,
        priority
      });
      
      onSave();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const handleRemoveSchedule = async () => {
    try {
      await promotionalVideoService.updateVideo(video.id, {
        schedule: undefined
      });
      onSave();
    } catch (error) {
      console.error('Failed to remove schedule:', error);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  const parseDateTime = (dateString: string): Date => {
    return new Date(dateString);
  };

  const getDayName = (dayIndex: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--background-secondary, #1f2937)',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--border, #374151)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary, #fff)' }}>
            Schedule Video: {video.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #888)',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Priority Section */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
            Priority
          </label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
            style={{
              width: '100px',
              padding: '8px 12px',
              backgroundColor: 'var(--background, #111827)',
              border: '1px solid var(--border, #374151)',
              borderRadius: '6px',
              color: 'var(--text-primary, #fff)'
            }}
          />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #888)', marginTop: '4px' }}>
            Higher numbers have higher priority when multiple videos are scheduled
          </p>
        </div>

        {/* Schedule Toggle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!schedule}
              onChange={(e) => {
                if (e.target.checked) {
                  const now = new Date();
                  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                  setSchedule({
                    startDate: now,
                    endDate: tomorrow,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    isRecurring: false
                  });
                } else {
                  setSchedule(undefined);
                  setIsRecurring(false);
                }
              }}
              style={{ marginRight: '8px' }}
            />
            <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
              Enable Scheduling
            </span>
          </label>
        </div>

        {schedule && (
          <>
            {/* Date Range */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDateTime(schedule.startDate)}
                    onChange={(e) => setSchedule(prev => prev ? {
                      ...prev,
                      startDate: parseDateTime(e.target.value)
                    } : undefined)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background, #111827)',
                      border: '1px solid var(--border, #374151)',
                      borderRadius: '6px',
                      color: 'var(--text-primary, #fff)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formatDateTime(schedule.endDate)}
                    onChange={(e) => setSchedule(prev => prev ? {
                      ...prev,
                      endDate: parseDateTime(e.target.value)
                    } : undefined)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background, #111827)',
                      border: '1px solid var(--border, #374151)',
                      borderRadius: '6px',
                      color: 'var(--text-primary, #fff)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recurring Pattern */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span style={{ color: 'var(--text-primary, #fff)', fontWeight: 'bold' }}>
                  Recurring Schedule
                </span>
              </label>

              {isRecurring && (
                <div style={{ paddingLeft: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary, #fff)' }}>
                      Repeat Pattern
                    </label>
                    <select
                      value={recurringPattern.type}
                      onChange={(e) => setRecurringPattern(prev => ({
                        ...prev,
                        type: e.target.value as 'daily' | 'weekly' | 'monthly'
                      }))}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--background, #111827)',
                        border: '1px solid var(--border, #374151)',
                        borderRadius: '6px',
                        color: 'var(--text-primary, #fff)'
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {recurringPattern.type === 'weekly' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary, #fff)' }}>
                        Days of Week
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => (
                          <label key={dayIndex} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={recurringPattern.daysOfWeek?.includes(dayIndex) || false}
                              onChange={(e) => {
                                const currentDays = recurringPattern.daysOfWeek || [];
                                const newDays = e.target.checked
                                  ? [...currentDays, dayIndex]
                                  : currentDays.filter(d => d !== dayIndex);
                                setRecurringPattern(prev => ({
                                  ...prev,
                                  daysOfWeek: newDays.sort()
                                }));
                              }}
                            />
                            <span style={{ color: 'var(--text-primary, #fff)', fontSize: '14px' }}>
                              {getDayName(dayIndex).slice(0, 3)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '24px'
              }}>
                <h4 style={{ color: '#dc2626', marginBottom: '8px', fontWeight: 'bold' }}>
                  ⚠️ Schedule Conflicts Detected
                </h4>
                <p style={{ color: 'var(--text-primary, #fff)', fontSize: '14px', marginBottom: '8px' }}>
                  This schedule overlaps with the following videos:
                </p>
                <ul style={{ color: 'var(--text-secondary, #888)', fontSize: '14px', paddingLeft: '20px' }}>
                  {conflicts.map((title, index) => (
                    <li key={index}>{title}</li>
                  ))}
                </ul>
                <p style={{ color: 'var(--text-secondary, #888)', fontSize: '12px', marginTop: '8px' }}>
                  Higher priority videos will be shown when conflicts occur.
                </p>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {schedule && (
            <button
              onClick={handleRemoveSchedule}
              style={{
                backgroundColor: 'transparent',
                color: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Remove Schedule
            </button>
          )}
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary, #888)',
              border: '1px solid var(--border, #374151)',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSave}
            style={{
              backgroundColor: 'var(--primary, #007bff)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoScheduler;