import { useEffect, useState, useRef } from "react";

import { Header } from '@/components/monitoring/Header';
import { StatsCards } from '@/components/monitoring/StatsCards';
import { SecurityMetrics } from '@/components/monitoring/SecurityMetrics';
import { ZabbixProblems } from '@/components/monitoring/ZabbixProblems';
import { ElasticLogs } from '@/components/monitoring/ElasticLogs';
import { SecurityChart } from '@/components/monitoring/SecurityChart';
import { HostsTable } from '@/components/monitoring/HostsTable';

import {
  mockSecurityMetrics,
  mockLogs,
  mockSecurityEvents,
} from '@/data/mockData';

const Index = () => {

  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const [realElasticLogs, setRealElasticLogs] = useState<any[]>([]);
  const [realHosts, setRealHosts] = useState<any[]>([]);
  const [realProblems, setRealProblems] = useState<any[]>([]);

  const [realStats, setRealStats] = useState({
    totalHosts: 0,
    serversUp: 0,
    serversDown: 0,
    upPercentage: 0,
  });

  const [refreshInterval, setRefreshInterval] = useState(30000);

  const intervalRef = useRef<any>(null);

  // ================= TIME FORMAT =================
  const formatTimeAgo = (unix: number | string) => {

    if (!unix) return "now";

    const seconds = Math.floor(
      Date.now() / 1000 - Number(unix)
    );

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

    return `${Math.floor(seconds / 86400)}d ago`;
  };


  // ================= DASHBOARD FETCH =================
  const fetchDashboard = async () => {
    try {

      const res = await fetch(
        "http://10.10.10.1:3001/api/zabbix/dashboard"
      );

      const data = await res.json();

      console.log("DASHBOARD API:", data);

      if (!data?.hosts) return;

      // ===== HOSTS =====
      const mappedHosts = data.hosts.map((h: any) => ({

        id: h.hostid,
        hostname: h.host,
        ip: h.ip || "-",

        status:
          Number(h.available) === 1
            ? "online"
            : Number(h.available) === 2
            ? "offline"
            : "unknown",

        cpu: Number(h.cpu || 0),
        ram: Number(h.ram || 0),

        bwIn: h.bwIn || "0 bps",
        bwOut: h.bwOut || "0 bps",

        lastCheck: formatTimeAgo(h.lastCheck),

      }));

      setRealHosts(mappedHosts);

      // ===== STATS =====
      setRealStats(data.stats);

      // ===== PROBLEMS =====
      const mappedProblems = (data.problems || []).map((p: any) => ({

        id: p.triggerid,

        host: p.hosts?.[0]?.host || "Unknown",

        problem: p.description || "No description",

        severity:
          p.priority == 5 ? "disaster" :
          p.priority == 4 ? "high" :
          p.priority == 3 ? "warning" :
          p.priority == 2 ? "average" :
          p.priority == 1 ? "info" :
          "info",

        timestamp: formatTimeAgo(p.lastchange),

        duration:
          p.value == "0"
            ? "resolved"
            : "active",

      }));

      setRealProblems(mappedProblems);

      // ===== LAST UPDATE =====
      setLastUpdate(Date.now());

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const fetchElasticLogs = async () => {
    try {

      const res = await fetch(
        "http://10.10.10.1:3001/api/elastic/logs"
      );

      const data = await res.json();

      const mapped = data.map((l: any) => ({

        id: l.timestamp,

        host: l.host,

        message: l.message,

        ip: l.ip,

        timestamp: formatTimeAgo(
          Date.parse(l.timestamp) / 1000
        )

      }));

      setRealElasticLogs(mapped);
 
    } catch (err) {
      console.error("Elastic fetch error:", err);
    }
  };

  // ================= AUTO REFRESH =================
  useEffect(() => {

    fetchDashboard();
    fetchElasticLogs();

    intervalRef.current = setInterval(() => {
      fetchDashboard();
      fetchElasticLogs();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

  }, [refreshInterval]);


  // ================= INTERVAL HANDLER =================
  const handleIntervalChange = (value: string) => {

    if (value === "30s") setRefreshInterval(30000);
    if (value === "1m") setRefreshInterval(60000);
    if (value === "5m") setRefreshInterval(300000);

  };


  return (
    <div className="min-h-screen bg-background px-4 lg:px-6 py-4">
      <div className="max-w-[1600px] mx-auto">

        <Header
          onIntervalChange={handleIntervalChange}
          onManualRefresh={() => {
            fetchDashboard();
          }}
        />

        <StatsCards stats={realStats} />

        <SecurityMetrics metrics={mockSecurityMetrics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          <div className="h-[400px]">
            <ZabbixProblems problems={realProblems} />
          </div>

          <div className="h-[400px]">
            <ElasticLogs logs={realElasticLogs} />
          </div>

          <div className="h-[400px]">
            <SecurityChart data={mockSecurityEvents} />
          </div>

        </div>

        <HostsTable hosts={realHosts} />

      </div>
    </div>
  );
};

export default Index;
