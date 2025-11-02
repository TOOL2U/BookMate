'use client';

import { Database, TrendingUp, Activity, Server, RefreshCw } from 'lucide-react';

interface SystemStats {
  totalEntries: number;
  todayEntries: number;
  lastSync: string;
  cacheStatus: 'active' | 'expired' | 'empty';
}

interface SystemStatsCardsProps {
  stats: SystemStats;
  isLoading: boolean;
}

export default function SystemStatsCards({ stats, isLoading }: SystemStatsCardsProps) {
  const statCards = [
    {
      icon: Database,
      value: stats.totalEntries,
      label: 'Total Entries',
      color: 'blue',
      gradient: 'from-blue-500/20 to-transparent'
    },
    {
      icon: TrendingUp,
      value: stats.todayEntries,
      label: "Today's Entries",
      color: 'green',
      gradient: 'from-green-500/20 to-transparent'
    },
    {
      icon: Activity,
      value: stats.lastSync,
      label: 'Last Sync',
      color: 'purple',
      gradient: 'from-purple-500/20 to-transparent'
    },
    {
      icon: Server,
      value: stats.cacheStatus,
      label: 'Cache Status',
      color: 'orange',
      gradient: 'from-orange-500/20 to-transparent',
      capitalize: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const colorClasses = {
          blue: 'text-blue-500',
          green: 'text-green-500',
          purple: 'text-purple-500',
          orange: 'text-orange-500'
        };

        return (
          <div
            key={index}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-full blur-2xl`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${colorClasses[card.color as keyof typeof colorClasses]}`} />
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                )}
              </div>
              <p className={`text-3xl font-bold text-white mb-1 ${card.capitalize ? 'capitalize' : ''}`}>
                {card.value}
              </p>
              <p className="text-sm text-slate-400">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

