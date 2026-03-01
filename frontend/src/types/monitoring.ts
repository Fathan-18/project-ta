export type SeverityLevel = 'disaster' | 'high' | 'warning' | 'info' | 'ok';
export type LogType = 'BRUTE FORCE' | 'DDoS' | 'AUTH FAIL' | 'INFO';

export interface ZabbixProblem {
  id: string;
  host: string;
  problem: string;
  severity: SeverityLevel;
  timestamp: string;
  duration: string;
}

export interface ElasticLog {
  id: string;
  timestamp: string;
  ip?: string;
  method?: string;
  path?: string;
  status?: number;
  type?: LogType;
}

export interface HostStatus {
  id: string;
  hostname: string;
  ip?: string;
  status: 'online' | 'offline' | 'warning';
  cpu: number;
  ram: number;
  bwIn?: string;
  bwOut?: string;
  uptime?: string;
  lastCheck?: string;
}

export interface SecurityMetrics {
  bruteForce: number;
  ddosDetect: number;
  authFails: number;
}

export interface DashboardStats {
  totalHosts: number;
  serversUp: number;
  serversDown: number;
  upPercentage: number;
}
