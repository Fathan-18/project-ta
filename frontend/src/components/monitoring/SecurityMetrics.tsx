import { Shield, Zap, KeyRound, Activity } from 'lucide-react';

interface SecurityMetricsProps {
  bruteForce: number;
  ddos: number;
  authFailures: number;
  totalIncidents: number;
}

export function SecurityMetrics({
  bruteForce,
  ddos,
  authFailures,
  totalIncidents,
}: SecurityMetricsProps) {

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

      <div className="metric-card">
        <Shield className="w-5 h-5 text-red-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-red-500">{bruteForce}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          Brute Force
        </p>
      </div>

      <div className="metric-card">
        <Zap className="w-5 h-5 text-purple-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-purple-500">{ddos}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          DDoS Attacks
        </p>
      </div>

      <div className="metric-card">
        <KeyRound className="w-5 h-5 text-orange-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-orange-500">{authFailures}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          Auth Failures
        </p>
      </div>

      <div className="metric-card">
        <Activity className="w-5 h-5 text-red-500 mx-auto mb-2" />
        <p className="text-3xl font-bold text-red-500">{totalIncidents}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          Total Incidents
        </p>
     </div>

    </div>
  );
}
