import { Shield, Zap, KeyRound, Activity } from 'lucide-react';
import { SecurityMetrics as SecurityMetricsType } from '@/types/monitoring';

interface SecurityMetricsProps {
  metrics: SecurityMetricsType;
}

export function SecurityMetrics({ metrics }: SecurityMetricsProps) {
  const totalEvents = metrics.bruteForce + metrics.ddosDetect + metrics.authFails;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="metric-card">
        <Shield className="w-5 h-5 text-red-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-red-500">{metrics.bruteForce}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Brute Force</p>
      </div>

      <div className="metric-card">
        <Zap className="w-5 h-5 text-purple-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-purple-500">{metrics.ddosDetect}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">DDoS Attacks</p>
      </div>

      <div className="metric-card">
        <KeyRound className="w-5 h-5 text-orange-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-orange-500">{metrics.authFails}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Auth Failures</p>
      </div>

      <div className="metric-card">
        <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-3xl font-bold text-primary">{totalEvents}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Total Events</p>
      </div>
    </div>
  );
}
