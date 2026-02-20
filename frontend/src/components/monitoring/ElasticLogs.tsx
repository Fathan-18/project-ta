import { useState } from 'react';
import { Search, FileText, Shield, Zap, KeyRound } from 'lucide-react';
import { ElasticLog, LogType } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface ElasticLogsProps {
  logs: ElasticLog[];
}

const logTypeConfig: Record<string, { className: string; icon: typeof Shield; color: string }> = {
  'BRUTE FORCE': { className: 'log-brute-force', icon: Shield, color: 'text-red-500' },
  'DDoS': { className: 'log-ddos', icon: Zap, color: 'text-purple-500' },
  'AUTH FAIL': { className: 'log-auth-fail', icon: KeyRound, color: 'text-orange-500' },
  'INFO': { className: 'log-info', icon: FileText, color: 'text-blue-500' },
};

export function ElasticLogs({ logs }: ElasticLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.type && log.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="panel-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Elastic Security Logs</h2>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-500">
          Live
        </span>
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input pl-10 font-mono"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">
            No logs matching query
          </div>
        ) : (
          filteredLogs.map((log) => {
            const typeConfig = log.type ? logTypeConfig[log.type] : logTypeConfig['INFO'];
            const Icon = typeConfig.icon;

            return (
              <div key={log.id} className={cn('log-entry', typeConfig.className)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-current" style={{ color: typeConfig.color.replace('text-', '') }} />
                    <span className="text-xs text-muted-foreground font-mono">{log.timestamp}</span>
                    <div className="flex items-center gap-1">
                      <Icon className={cn('w-3.5 h-3.5', typeConfig.color)} />
                      <span className={cn('text-xs font-semibold', typeConfig.color)}>{log.type}</span>
                    </div>
                  </div>
                  {log.source && (
                    <span className="text-xs font-mono text-primary">{log.source}</span>
                  )}
                </div>
                <p className="text-sm text-foreground/90">{log.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
