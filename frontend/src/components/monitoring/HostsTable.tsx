import { useState } from 'react';
import { Search, Server, Cpu, HardDrive, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { HostStatus } from '@/types/monitoring';
import { cn } from '@/lib/utils';

interface HostsTableProps {
  hosts: HostStatus[];
}

export function HostsTable({ hosts }: HostsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHosts = hosts.filter(
    (host) =>
      host.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (host.ip && host.ip.includes(searchQuery))
  );

  const getStatusDot = (status: HostStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'offline':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
	return 'bg-gray-400';
    }
  };

  const getUsageColor = (value: number) => {
    if (value >= 80) return 'bg-red-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="panel-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Zabbix Hosts</h2>
        </div>
        <span className="text-sm text-muted-foreground">{hosts.length} hosts</span>
      </div>

      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search hosts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Host
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> CPU
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" /> RAM
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <ArrowDownToLine className="w-3.5 h-3.5" /> BW IN
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <ArrowUpFromLine className="w-3.5 h-3.5" /> BW OUT
                </div>
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Check
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHosts.map((host) => (
              <tr
                key={host.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className={cn('w-2 h-2 rounded-full', getStatusDot(host.status))} />
                    <div>
                      <p className="font-medium">{host.hostname}</p>
                      {host.ip && <p className="text-xs text-muted-foreground">{host.ip}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {host.status === 'offline' ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-sm">{host.cpu}%</span>
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', getUsageColor(host.cpu))}
                          style={{ width: `${Math.min(host.cpu || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  {host.status === 'offline' ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-sm">{host.ram}%</span>
                      <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', getUsageColor(host.ram))}
                          style={{ width: `${Math.min(host.ram || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-emerald-500">
		    {host.status === 'offline' ? '—' : host.bwIn}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-primary">
		    {host.status === 'offline' ? '—' : host.bwOut}
		  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-muted-foreground">{host.lastCheck || 'unknown'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
