import React from 'react';
import { Target, Trophy, Unlock, TrendingUp, Star } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

interface CreatorGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: {
    featureUnlock?: string;
    revenueShareIncrease?: number;
    tokens?: number;
  };
  completed: boolean;
}

export const CreatorGoals: React.FC = () => {
  const { creatorGoals, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  const getRewardIcon = (reward: CreatorGoal['reward']) => {
    if (reward.featureUnlock) return <Unlock className="w-4 h-4" />;
    if (reward.revenueShareIncrease) return <TrendingUp className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  const getRewardText = (reward: CreatorGoal['reward']) => {
    const rewards = [];
    if (reward.featureUnlock) rewards.push(`Unlock: ${reward.featureUnlock}`);
    if (reward.revenueShareIncrease) rewards.push(`+${reward.revenueShareIncrease}% Revenue Share`);
    if (reward.tokens) rewards.push(`${reward.tokens} LIB`);
    return rewards.join(' + ');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Target className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Creator Goals</h2>
      </div>

      {creatorGoals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Goals</h3>
          <p className="text-gray-500">Complete your creator registration to unlock goals!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {creatorGoals.map((goal) => (
            <div
              key={goal.id}
              className={`bg-white rounded-xl p-6 border-2 transition-all ${
                goal.completed
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{goal.name}</h3>
                    {goal.completed && (
                      <Trophy className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{goal.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{goal.currentValue} / {goal.targetValue}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`rounded-full h-2 transition-all duration-300 ${
                          goal.completed ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1 text-purple-600">
                      {getRewardIcon(goal.reward)}
                      <span className="font-medium">Reward:</span>
                    </div>
                    <span className="text-gray-700">{getRewardText(goal.reward)}</span>
                  </div>
                </div>

                {goal.completed && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                    Claim Reward
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};