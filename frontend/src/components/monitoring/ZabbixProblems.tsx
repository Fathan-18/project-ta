import { useState } from 'react';
import { AlertTriangle, Search, XCircle, AlertCircle, Info } from 'lucide-react';
import { ZabbixProblem } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface ZabbixProblemsProps {
  problems: ZabbixProblem[];
}

const severityConfig: any = {
  disaster: {
    label: 'DISASTER',
    icon: XCircle,
    className: 'severity-disaster',
    textClass: 'text-red-500'
  },
  high: {
    label: 'HIGH',
    icon: AlertTriangle,
    className: 'severity-high',
    textClass: 'text-orange-500'
  },
  warning: {
    label: 'WARNING',
    icon: AlertCircle,
    className: 'severity-warning',
    textClass: 'text-yellow-500'
  },
  average: {   // 🔥 TAMBAH (Zabbix default)
    label: 'AVERAGE',
    icon: AlertCircle,
    className: 'severity-warning',
    textClass: 'text-yellow-500'
  },
  info: {
    label: 'INFO',
    icon: Info,
    className: 'severity-info',
    textClass: 'text-blue-500'
  },
  resolved: {   // 🔥 TAMBAH
    label: 'RESOLVED',
    icon: Info,
    className: 'severity-ok',
    textClass: 'text-emerald-500'
  }
};

export function ZabbixProblems({ problems }: ZabbixProblemsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProblems = problems.filter(
    (p) =>
      p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problem.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalCount = problems.filter(
    (p) =>
      p.severity === 'disaster' ||
      p.severity === 'high' ||
      p.severity === 'average'
  ).length;

  const formatDateTime = (unix: number | string) => {
    const date = new Date(Number(unix) * 1000);

    return (
      date.toLocaleDateString("en-GB") +
      "  |  " +
      date.toLocaleTimeString("en-US")
    );
  };

  const timeAgo = (unix: number | string) => {
    const seconds = Math.floor(
      Date.now() / 1000 - Number(unix)
    );

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} Minutes Ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} Hours Ago`;

    return `${Math.floor(seconds / 86400)} Days Ago`;
  };

   return (
   <div className="panel-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="font-semibold">Zabbix Problems</h2>
        </div>
        {criticalCount > 0 && (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/15 text-red-500">
            {criticalCount} Critical
          </span>
        )}
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredProblems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No problems found
          </div>
        ) : (
          filteredProblems.map((problem) => {
            const config =
                severityConfig[problem.severity] ||
                severityConfig['info'];

            const Icon = config.icon;

            return (
              <div
                key={problem.id}
                className={cn(
                  'p-4 border-b border-border last:border-b-0',
                  config.className
                )}
              >
                <div className="flex justify-between items-start">

                  {/* LEFT SIDE */}
                  <div>

                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn('w-4 h-4', config.textClass)} />

                      <span
                        className={cn(
                          'text-xs font-semibold uppercase',
                          config.textClass
                        )}
                      >
                        {config.label}
                      </span>
                    </div>

                    <div className="font-semibold">
                      {problem.host}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {problem.problem}
                    </div>

                  </div>

                  {/* RIGHT SIDE */}
                  <div className="text-right">

                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-500">
                      ACTIVE
                    </span>

                    <div className="mt-2 text-xs text-muted-foreground">
                      <div>
                        {formatDateTime(problem.rawTimestamp)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {timeAgo(problem.rawTimestamp)}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
