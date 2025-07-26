import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Clock, Users, Zap, Star } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  timeRemaining: string;
  participants: number;
  totalRewards: number;
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  completed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string;
  score: number;
  reward: string;
}

export const SeasonalEvents: React.FC = () => {
  const { getSeasonalEvents, isLoading } = useGamification();
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      // Mock seasonal events data
      const mockEvents: SeasonalEvent[] = [
        {
          id: 'winter_creator_fest_2024',
          name: 'Winter Creator Festival 2024',
          description: 'Join the biggest creator event of the year with massive rewards!',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-31'),
          timeRemaining: '15 days, 8 hours',
          participants: 2847,
          totalRewards: 50000,
          challenges: [
            {
              id: 'winter_uploads',
              name: 'Winter Content Creator',
              description: 'Upload 10 winter-themed videos',
              progress: 6,
              maxProgress: 10,
              reward: '500 LIB + Winter Creator Badge',
              completed: false
            },
            {
              id: 'holiday_collaboration',
              name: 'Holiday Collaboration',
              description: 'Collaborate with 3 different creators',
              progress: 1,
              maxProgress: 3,
              reward: '300 LIB + Collaboration Master Badge',
              completed: false
            },
            {
              id: 'community_engagement',
              name: 'Community Champion',
              description: 'Get 1000 total interactions on your content',
              progress: 750,
              maxProgress: 1000,
              reward: '750 LIB + Community Champion Badge',
              completed: false
            }
          ],
          leaderboard: [
            { rank: 1, address: '0x1234...5678', username: 'WinterKing', score: 15420, reward: '5000 LIB' },
            { rank: 2, address: '0x2345...6789', username: 'SnowQueen', score: 14890, reward: '3000 LIB' },
            { rank: 3, address: '0x3456...7890', username: 'FrostByte', score: 13560, reward: '2000 LIB' },
            { rank: 4, address: '0x4567...8901', username: 'IceCreator', score: 12340, reward: '1500 LIB' },
            { rank: 5, address: '0x5678...9012', username: 'ChillVibes', score: 11890, reward: '1000 LIB' }
          ]
        },
        {
          id: 'new_year_challenge_2025',
          name: 'New Year Resolution Challenge',
          description: 'Start 2025 strong with consistent content creation!',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
          timeRemaining: 'Starts in 16 days',
          participants: 0,
          totalRewards: 25000,
          challenges: [
            {
              id: 'daily_creator',
              name: 'Daily Creator',
              description: 'Upload content every day for 31 days',
              progress: 0,
              maxProgress: 31,
              reward: '1000 LIB + Consistency Master Badge',
              completed: false
            },
            {
              id: 'resolution_content',
              name: 'Resolution Inspiration',
              description: 'Create 5 motivational/educational videos',
              progress: 0,
              maxProgress: 5,
              reward: '400 LIB + Inspiration Badge',
              completed: false
            }
          ],
          leaderboard: []
        }
      ];

      setEvents(mockEvents);
      if (mockEvents.length > 0) {
        setSelectedEvent(mockEvents[0].id);
      }
    } catch (error) {
      console.error('Failed to load seasonal events:', error);
    }
  };

  const selectedEventData = events.find(event => event.id === selectedEvent);

  const getEventStatus = (event: SeasonalEvent) => {
    const now = new Date();
    if (now < event.startDate) return 'upcoming';
    if (now > event.endDate) return 'ended';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'upcoming': return 'text-blue-600 bg-blue-100';
      case 'ended': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Seasonal Events</h2>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Active Events</h3>
          <p className="text-gray-500">Check back soon for exciting seasonal challenges and competitions!</p>
        </div>
      ) : (
        <>
          {/* Event Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const status = getEventStatus(event);
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedEvent === event.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{event.timeRemaining}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{event.participants.toLocaleString()} participants</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-gray-500" />
                      <span>{event.totalRewards.toLocaleString()} LIB rewards</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4 text-gray-500" />
                      <span>{event.challenges.length} challenges</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Event Details */}
          {selectedEventData && (
            <div className="space-y-6">
              {/* Event Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{selectedEventData.name}</h2>
                <p className="text-purple-100 mb-4">{selectedEventData.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedEventData.timeRemaining}</div>
                    <p className="text-purple-100 text-sm">Time Remaining</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedEventData.participants.toLocaleString()}</div>
                    <p className="text-purple-100 text-sm">Participants</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedEventData.totalRewards.toLocaleString()}</div>
                    <p className="text-purple-100 text-sm">Total Rewards (LIB)</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedEventData.challenges.length}</div>
                    <p className="text-purple-100 text-sm">Challenges</p>
                  </div>
                </div>
              </div>

              {/* Challenges */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-xl font-bold mb-4">Event Challenges</h3>
                <div className="grid gap-4">
                  {selectedEventData.challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-lg border-2 ${
                        challenge.completed
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">{challenge.name}</h4>
                            {challenge.completed && (
                              <Trophy className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{challenge.description}</p>
                          <div className="text-sm text-purple-600 font-medium">
                            Reward: {challenge.reward}
                          </div>
                        </div>
                      </div>
                      
                      {!challenge.completed && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{challenge.progress} / {challenge.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                              style={{ 
                                width: `${(challenge.progress / challenge.maxProgress) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              {selectedEventData.leaderboard.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
                  <div className="space-y-2">
                    {selectedEventData.leaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            entry.rank === 1 ? 'bg-yellow-500 text-white' :
                            entry.rank === 2 ? 'bg-gray-400 text-white' :
                            entry.rank === 3 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-medium">{entry.username}</div>
                            <div className="text-xs text-gray-500">{entry.address}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">{entry.score.toLocaleString()} pts</div>
                          <div className="text-sm text-green-600">{entry.reward}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};