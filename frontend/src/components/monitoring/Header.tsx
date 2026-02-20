import { useState, useEffect } from 'react';
import { Server, Sun, Moon, RefreshCw, LayoutGrid } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const Header = ({
onIntervalChange,
onManualRefresh
}: any) => {

const [time, setTime] = useState(new Date());
const { theme, toggleTheme } = useTheme();
const [apiStatus, setApiStatus] = useState({
  zabbix: false,
  elasticsearch: false
});

// ================= CLOCK =================
// ================= CLOCK =================
useEffect(() => {

  const timer = setInterval(() => {
    setTime(new Date());
  }, 1000);

  return () => clearInterval(timer);

}, []);


// ================= HEALTH CHECK =================
useEffect(() => {

  const fetchHealth = async () => {
    try {

      const res = await fetch(
        "http://10.10.10.1:3001/api/health"
      );

      const data = await res.json();

      setApiStatus({
        zabbix: data.zabbix,
        elasticsearch: data.elasticsearch
      });

    } catch {

      setApiStatus({
        zabbix: false,
        elasticsearch: false
      });

    }
  };

  // first load
  fetchHealth();

  // auto refresh
  const timer = setInterval(fetchHealth, 10000);

  return () => clearInterval(timer);

}, []);

const formatTime = (date: Date) => {
return date.toLocaleTimeString('id-ID', {
hour12: false,
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
}).replace(/:/g, '.');
};

const formatDate = (date: Date) => {
return date.toLocaleDateString('id-ID', {
weekday: 'long',
day: 'numeric',
month: 'long',
year: 'numeric',
});
};

return ( <header className="flex items-center justify-between py-4 mb-6">

  {/* ===== LEFT ===== */}
  <div className="flex items-center gap-6">

    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Server className="w-5 h-5 text-primary" />
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Server Monitor
        </h1>
        <p className="text-xs text-muted-foreground">
          Real-time Infrastructure Monitoring
        </p>
      </div>
    </div>

    {/* STATUS API */}
    <div className="flex items-center gap-4 ml-6">
      <div className="flex items-center gap-2 text-sm">
        <span
        className={`status-dot ${
            apiStatus.elasticsearch
            ? "status-online"
            : "status-offline"
        }`}
        />
        <span className="text-muted-foreground">Elasticsearch</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
        className={`status-dot ${
            apiStatus.zabbix
            ? "status-online"
            : "status-offline"
        }`}
        />
        <span className="text-muted-foreground">Zabbix API</span>
      </div>
    </div>

  </div>

  {/* ===== RIGHT ===== */}
  <div className="flex items-center gap-4">

    {/* INTERVAL DROPDOWN */}
    <select
      onChange={(e) => onIntervalChange(e.target.value)}
      className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
    >
      <option value="30s">30s</option>
      <option value="1m">1m</option>
      <option value="5m">5m</option>
    </select>

    {/* REFRESH + LAYOUT */}
    <div className="flex items-center gap-1 border border-border rounded-lg p-1">

      <button className="p-2 hover:bg-accent rounded-md transition-colors">
        <LayoutGrid className="w-4 h-4 text-muted-foreground" />
      </button>

      <button
        onClick={onManualRefresh}
        className="p-2 hover:bg-accent rounded-md transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-muted-foreground" />
      </button>

    </div>

    {/* THEME TOGGLE */}
    <button
      onClick={toggleTheme}
      className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>

  </div>
</header>
);
};
