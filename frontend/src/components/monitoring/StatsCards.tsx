import { useState, useEffect } from 'react';
import { Server, ArrowUp, ArrowDown, Clock, Target } from 'lucide-react';
import { DashboardStats } from '@/types/monitoring';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/:/g, '.');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* System Time */}
      <div className="stat-card">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          System Time
        </div>
        <p className="text-4xl font-bold font-mono tracking-tight">{formatTime(time)}</p>
        <p className="text-sm text-muted-foreground mt-1">{formatDate(time)}</p>
      </div>

      {/* Total Servers */}
      <div className="stat-card">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
          <Server className="w-3.5 h-3.5" />
          Total Servers
        </div>
        <p className="text-5xl font-bold">{stats.totalHosts}</p>
      </div>

      {/* Servers Up */}
      <div className="stat-card-highlight-green text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-center gap-1">
          <ArrowUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-500">UP</span>
        </div>
        <p className="text-5xl font-bold text-emerald-500">{stats.serversUp}</p>
        <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mt-3" />
      </div>

      {/* Servers Down */}
      <div className="stat-card-highlight-red text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-center gap-1">
          <ArrowDown className="w-3.5 h-3.5 text-red-500" />
          <span className="text-red-500">DOWN</span>
        </div>
        <p className="text-5xl font-bold text-red-500">{stats.serversDown}</p>
        <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-3" />
      </div>

      {/* Uptime Today */}
      <div className="stat-card">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          Infrastructure Availability
        </div>
        <p className="text-4xl font-bold text-emerald-500">{Number(stats.upPercentage || 0).toFixed(2)}%</p>
        <div className="mt-3">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(stats.upPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span className="text-muted-foreground">Target: 99.9%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
