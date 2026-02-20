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
                {/* Severity + Time */}
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

                    <span className="text-xs text-muted-foreground ml-auto font-mono">
                    {problem.timestamp}
                    </span>
                </div>

                {/* Host + Status */}
                <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">
                    {problem.host || "Unknown Host"}
                    </p>

                    <span
                    className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-semibold",
                        problem.duration === "resolved"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-red-500/15 text-red-500"
                    )}
                    >
                    {problem.duration === "resolved"
                        ? "RESOLVED"
                        : "ACTIVE"}
                    </span>
                </div>

                {/* Problem Text */}
                <p className="text-sm text-muted-foreground mt-0.5">
                    {problem.problem}
                </p>
                </div>
            );
          })
        )}
      </div>
    </div>
  );
}
