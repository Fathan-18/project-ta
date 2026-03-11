import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";

import { Header } from '@/components/monitoring/Header';
import { StatsCards } from '@/components/monitoring/StatsCards';
import { SecurityMetrics } from '@/components/monitoring/SecurityMetrics';
import { ZabbixProblems } from '@/components/monitoring/ZabbixProblems';
import { ElasticLogs } from '@/components/monitoring/ElasticLogs';
import { HostsTable } from '@/components/monitoring/HostsTable';
import { AttackChart } from "@/components/monitoring/AttackChart";

const Index = () => {

  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const [realElasticLogs, setRealElasticLogs] = useState<any[]>([]);
  const [realHosts, setRealHosts] = useState<any[]>([]);
  const [realProblems, setRealProblems] = useState<any[]>([]);
  const [securitySummary, setSecuritySummary] = useState<any>(null);

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

      setRealStats({
        totalHosts: data?.stats?.totalHosts || 0,
        serversUp: data?.stats?.serversUp || 0,
        serversDown: data?.stats?.serversDown || 0,
        upPercentage: data?.stats?.upPercentage || 0,
      });

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

        rawTimestamp: p.lastchange
      }));

      setRealProblems(mappedProblems);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const fetchHosts = async () => {
    try {
      const res = await fetch(
        "http://10.10.10.1:3001/api/zabbix/hosts"
      );

      const data = await res.json();

      const mappedHosts = data.map((h: any) => ({
        id: h.hostid,
        hostname: h.host,
        ip: h.ip || "-",

        status:
          Number(h.available) === 1
            ? "online"
            : Number(h.available) === 2
            ? "offline"
            : "unknown",

        cpu: h.cpu,
        ram: h.ram,
        bwIn: h.bwIn,
        bwOut: h.bwOut,
        lastCheck: formatTimeAgo(h.lastCheck),
      }));

      setRealHosts(mappedHosts);

    } catch (err) {
      console.error("Hosts fetch error:", err);
    }
  };

  const fetchElasticLogs = async () => {
    try {
      const res = await fetch(
        "http://10.10.10.1:3001/api/elastic/logs?all=true"
      );

      const data = await res.json();

      setRealElasticLogs(data);

    } catch (err) {
      console.error("Elastic fetch error:", err);
    }
  };

  const fetchSecuritySummary = async () => {
    try {
      const res = await fetch(
        "http://10.10.10.1:3001/api/elastic/stats"
      );

      const data = await res.json();

      setSecuritySummary({
        traffic: data?.traffic || {},
        securityEvents: data?.securityEvents || {},
        incidents: data?.incidents || {},
        eventsPerHour: data?.eventsPerHour || [],
      });

    } catch (err) {
      console.error("Security summary fetch error:", err);
    }
  };

  const refreshAll = () => {
    fetchHosts();
    fetchDashboard();
    fetchElasticLogs();
    fetchSecuritySummary();
  };

  // ================= AUTO REFRESH =================
  useEffect(() => {
    refreshAll();

    intervalRef.current = setInterval(refreshAll, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        window.location.href = "/";
      }
    };

    checkSession();
  }, []);

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
          onManualRefresh={refreshAll}
        />

        <StatsCards stats={realStats} />

        <SecurityMetrics
          bruteForce={securitySummary?.incidents?.bruteForce || 0}
          ddos={securitySummary?.incidents?.ddos || 0}
          authFailures={securitySummary?.securityEvents?.authFailures || 0}
        />

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Zabbix */}
          <div className="h-[400px]">
            <ZabbixProblems problems={realProblems} />
          </div>

          {/* Elastic Section */}

          <div className="h-[400px]">

            <ElasticLogs logs={realElasticLogs} />

          </div>

        </div>

        <HostsTable hosts={realHosts} />

      </div>
    </div>
      );
    };

export default Index;
