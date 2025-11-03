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
      color: 'accent',
      gradient: 'from-accent/15 to-transparent'
    },
    {
      icon: TrendingUp,
      value: stats.todayEntries,
      label: "Today's Entries",
      color: 'success',
      gradient: 'from-success/15 to-transparent'
    },
    {
      icon: Activity,
      value: stats.lastSync,
      label: 'Last Sync',
      color: 'info',
      gradient: 'from-info/15 to-transparent'
    },
    {
      icon: Server,
      value: stats.cacheStatus,
      label: 'Cache Status',
      color: 'warning',
      gradient: 'from-warning/15 to-transparent',
      capitalize: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const colorClasses = {
          accent: 'text-accent',
          success: 'text-success',
          info: 'text-info',
          warning: 'text-warning'
        };

        return (
          <div
            key={index}
            className="bg-bg-card border border-border-card rounded-xl p-6 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-full blur-2xl`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${colorClasses[card.color as keyof typeof colorClasses]}`} />
                {isLoading && (
                  <RefreshCw className="w-4 h-4 text-text-secondary animate-spin" />
                )}
              </div>
              <p className={`text-3xl font-bold text-text-primary mb-1 ${card.capitalize ? 'capitalize' : ''}`}>
                {card.value}
              </p>
              <p className="text-sm text-text-secondary">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
