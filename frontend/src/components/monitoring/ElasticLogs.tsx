import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { ElasticLog } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface ElasticLogsProps {
  logs: ElasticLog[];
}

export function ElasticLogs({ logs }: ElasticLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // ================= SEVERITY COLOR =================
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-500';
      case 'high':
        return 'bg-orange-500/20 text-orange-500';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'low':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-emerald-500/20 text-emerald-500';
    }
  };

  // ================= FILTER =================
  const filteredLogs = logs.filter((log: any) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      (log.ip || '').toLowerCase().includes(query) ||
      (log.path || '').toLowerCase().includes(query) ||
      (log.method || '').toLowerCase().includes(query);

    const matchesSeverity =
      severityFilter === 'all' ||
      log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  // =============== TIME =============== //
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);

    const formatted = date.toLocaleDateString("en-GB") + 
      " | " + 
      date.toLocaleTimeString("en-US");

    return formatted;
  };

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Minutes Ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} Hours Ago`;

    return `~ ${Math.floor(seconds / 86400)} Days Ago`;
  };

  return (
    <div className="panel-card h-full flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Elastic Security Logs</h2>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-500">
          Live
        </span>
      </div>

      {/* ================= SEARCH + FILTER ================= */}
      <div className="p-4 border-b border-border space-y-2">

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

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="info">Info</option>
        </select>

      </div>

      {/* ================= LOG LIST ================= */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-mono text-sm">
            No logs matching query
          </div>
        ) : (
          filteredLogs.map((log: any) => (
            <div
              key={log.id}
              onClick={() =>
                setExpandedId(expandedId === log.id ? null : log.id)
              }
              className="hover:bg-muted/40 transition p-3 border-b border-border cursor-pointer"
            >

              {/* ===== TOP ROW ===== */}
              <div className="flex items-center justify-between mb-2">

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {log.method || '-'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {log.path || '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2">

                  {/* Status Code */}
                  {typeof log.status === 'number' && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold',
                        log.status >= 500
                          ? 'bg-red-500/20 text-red-500'
                          : log.status >= 400
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-emerald-500/20 text-emerald-500'
                      )}
                    >
                      {log.status}
                    </span>
                  )}

                  {/* Severity Badge */}
                  {log.severity && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold uppercase',
                        getSeverityColor(log.severity)
                      )}
                    >
                      {log.severity}
                    </span>
                  )}

                </div>
              </div>

              {/* ===== BOTTOM ROW ===== */}
             <div className="flex justify-between items-start text-xs text-muted-foreground font-mono mb-2">

               {/* LEFT SIDE */}
               <div>
                 From: {log.ip || '-'}
               </div>

               {/* RIGHT SIDE */}
               <div className="text-right">
                 <div>
                   {log.timestamp ? formatDateTime(log.timestamp) : '-'}
                 </div>
                 <div classname="text-[11px] text-muted-foreground">
                   {log.timestamp ? timeAgo(log.timestamp) : ''}
                </div>
              </div>

            </div>

              {/* ===== EXPAND DETAIL ===== */}
              {expandedId === log.id && (
                <div className="mt-2 text-xs text-muted-foreground space-y-1 font-mono break-words transition-all duration-200">

                  <div>
                    <span className="font-semibold">Attack Type:</span>{' '}
                    {log.attackType || 'normal'}
                  </div>

                  <div>
                    <span className="font-semibold">Outcome:</span>{' '}
                    {log.outcome || '-'}
                  </div>

                  {log.fullUrl && (
                    <div>
                      <span className="font-semibold">Full URL:</span>{' '}
                      {log.fullUrl}
                    </div>
                  )}

                  {typeof log.bytes === 'number' && (
                    <div>
                      <span className="font-semibold">Bytes:</span>{' '}
                      {log.bytes}
                    </div>
                  )}

                  {log.userAgent && (
                    <div>
                      <span className="font-semibold">User Agent:</span>{' '}
                      {log.userAgent}
                    </div>
                  )}
                  
                  {log.os && (
                    <div>
                      <span className="font-semibold">OS:</span> {log.os}
                    </div>
                  )}

                  {log.browser && (
                    <div>
                      <span className="font-semibold">Browser:</span> {log.browser}
                    </div>
                   )}

                  {log.referrer && (
                    <div>
                      <span className="font-semibold">Referrer:</span>{' '}
                      {log.referrer}
                    </div>
                  )}

                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}
