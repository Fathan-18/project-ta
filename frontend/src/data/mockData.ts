import { ZabbixProblem, ElasticLog, HostStatus, SecurityMetrics, DashboardStats } from '@/types/monitoring';

export const mockStats: DashboardStats = {
  totalHosts: 48,
  serversUp: 45,
  serversDown: 3,
  upPercentage: 93.75,
};

export const mockSecurityMetrics: SecurityMetrics = {
  bruteForce: 156,
  ddosDetect: 23,
  authFails: 89,
};

export const mockProblems: ZabbixProblem[] = [
  {
    id: '1',
    host: 'worker-node-01',
    problem: 'Host unreachable - No response for 5 minutes',
    severity: 'disaster',
    timestamp: '14:32:15',
    duration: '14m',
  },
  {
    id: '2',
    host: 'db-master-01',
    problem: 'CPU usage exceeded 75% threshold',
    severity: 'high',
    timestamp: '14:28:42',
    duration: '45m',
  },
  {
    id: '3',
    host: 'cache-redis-01',
    problem: 'Memory usage above 85%',
    severity: 'warning',
    timestamp: '14:25:18',
    duration: '1h',
  },
  {
    id: '4',
    host: 'api-gateway-02',
    problem: 'Response time degraded',
    severity: 'warning',
    timestamp: '14:20:05',
    duration: '2h',
  },
];

export const mockLogs: ElasticLog[] = [
  {
    id: '1',
    timestamp: '14:35:28',
    level: 'WARN',
    message: 'Failed password for root from 45.33.32.156 port 22 ssh2',
    source: '45.33.32.156',
    type: 'BRUTE FORCE',
  },
  {
    id: '2',
    timestamp: '14:35:15',
    level: 'CRIT',
    message: 'HTTP flood detected - 5000 requests/sec from single IP',
    source: '192.168.1.30',
    type: 'DDoS',
  },
  {
    id: '3',
    timestamp: '14:34:52',
    level: 'WARN',
    message: 'authentication failure; logname= uid=0 euid=0',
    source: '10.0.0.55',
    type: 'AUTH FAIL',
  },
  {
    id: '4',
    timestamp: '14:34:21',
    level: 'WARN',
    message: 'Failed password for invalid user admin',
    source: '103.21.244.12',
    type: 'BRUTE FORCE',
  },
  {
    id: '5',
    timestamp: '14:33:58',
    level: 'CRIT',
    message: 'HTTP request spike detected - potential DDoS',
    source: '192.168.1.30',
    type: 'DDoS',
  },
  {
    id: '6',
    timestamp: '14:33:12',
    level: 'WARN',
    message: 'Multiple failed login attempts for user root',
    source: '89.45.67.123',
    type: 'BRUTE FORCE',
  },
];

export const mockHosts: HostStatus[] = [
  {
    id: '1',
    hostname: 'web-server-01',
    ip: '192.168.1.10',
    status: 'online',
    cpu: 45,
    ram: 67,
    bwIn: '125.50 Mbps',
    bwOut: '89.30 Mbps',
    lastCheck: '2 sec ago',
  },
  {
    id: '2',
    hostname: 'db-master-01',
    ip: '192.168.1.20',
    status: 'warning',
    cpu: 78,
    ram: 82,
    bwIn: '45.20 Mbps',
    bwOut: '156.80 Mbps',
    lastCheck: '5 sec ago',
  },
  {
    id: '3',
    hostname: 'api-gateway-01',
    ip: '192.168.1.30',
    status: 'online',
    cpu: 23,
    ram: 45,
    bwIn: '890.50 Mbps',
    bwOut: '750.20 Mbps',
    lastCheck: '1 sec ago',
  },
  {
    id: '4',
    hostname: 'cache-redis-01',
    ip: '192.168.1.40',
    status: 'online',
    cpu: 12,
    ram: 34,
    bwIn: '15.80 Mbps',
    bwOut: '22.10 Mbps',
    lastCheck: '3 sec ago',
  },
  {
    id: '5',
    hostname: 'worker-node-01',
    ip: '192.168.1.50',
    status: 'offline',
    cpu: 0,
    ram: 0,
    bwIn: '—',
    bwOut: '—',
    lastCheck: '5 min ago',
  },
];

export const mockSecurityEvents = [
  { hour: '00:00', bruteForce: 8, ddos: 2, authFail: 4 },
  { hour: '02:00', bruteForce: 5, ddos: 0, authFail: 3 },
  { hour: '04:00', bruteForce: 12, ddos: 1, authFail: 6 },
  { hour: '06:00', bruteForce: 18, ddos: 3, authFail: 8 },
  { hour: '08:00', bruteForce: 32, ddos: 8, authFail: 15 },
  { hour: '10:00', bruteForce: 28, ddos: 5, authFail: 12 },
  { hour: '12:00', bruteForce: 22, ddos: 4, authFail: 10 },
  { hour: '14:00', bruteForce: 35, ddos: 12, authFail: 18 },
];
