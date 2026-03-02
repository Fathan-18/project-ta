  import express from "express";
  import axios from "axios";

  const router = express.Router();
  const ELASTIC_URL = "http://10.10.10.10:9200";

  router.get("/logs", async (req, res) => {
    try {

      const response = await axios.post(
        `${ELASTIC_URL}/filebeat-*/_search`,
        {
          size: 200,
          sort: [{ "@timestamp": { order: "desc" } }],
          query: {
            bool: {
              should: [
                { term: { "event.dataset": "nginx.access" } },
                { term: { "event.dataset": "system.auth" } }
              ],
              must_not: [
                { wildcard: { "url.path": "/zabbix*" } }
              ]
            }
          }
        }
      );

      const hits = response.data.hits.hits;

      const oneMinuteAgo = Date.now() - 60 * 1000;

      // ================= COUNTING LOGIC =================
      const ipCounter = {};
      const sshFailureCounter = {};

      hits.forEach(h => {
        const src = h._source;
        const ip = src.source?.ip;
        const timestamp = new Date(src["@timestamp"]).getTime();

        if (!ip) return;

        if (timestamp >= oneMinuteAgo) {

          ipCounter[ip] = (ipCounter[ip] || 0) + 1;

        if (
          src.event?.dataset === "system.auth" &&
          src.event?.outcome === "failure"
        ) {
          sshFailureCounter[ip] = (sshFailureCounter[ip] || 0) + 1;
        }
      }
      });

      // DDOS
      const attackAlerts = [];

      // DDoS Alert
      Object.entries(ipCounter).forEach(([ip, count]) => {
        if (count >= 50) {
          attackAlerts.push({
            id: `ddos-${ip}`,
            timestamp: new Date().toISOString(),
            ip,
            method: "MULTI",
            path: "DDoS Attack Detected",
            status: 429,
            severity: "critical",
            attackType: "ddos_attack",
            bytes: 0,
            userAgent: "-",
            referrer: "-",
            outcome: "failure",
            os: "-",
            browser: "-",
            device: "-"
          });
        }
      });

      // SSH Bruteforce Alert
      Object.entries(sshFailureCounter).forEach(([ip, count]) => {
        if (count >= 5) {
          attackAlerts.push({
            id: `ssh-bruteforce-${ip}`,
            timestamp: new Date().toISOString(),
            ip,
            method: "SSH",
            path: `SSH Bruteforce (${count} attempts)`,
            status: 401,
            severity: "critical",
            attackType: "ssh_bruteforce",
            bytes: 0,
            userAgent: "SSH",
            referrer: "-",
            outcome: "failure",
            os: "-",
            browser: "-",
            device: "-"
          });
        }
      });

      // ================= MAP LOGS =================
      const logs = hits.map(h => {

        const src = h._source;
        const ip = src.source?.ip || "-";

        let severity = "info";
        let attackType = "normal";

        // ================= SSH LOGIC =================
        if (src.event?.dataset === "system.auth") {

          const outcome = src.event?.outcome || "";
          const user = src.user?.name || "-";

          if (outcome === "failure") {
            severity = "high";
            attackType = "ssh_failed_login";
          }

          return {
            id: h._id,
            timestamp: src["@timestamp"],
            ip,
            method: "SSH",
            path: `SSH Login (${user})`,
            fullUrl: "SSH",
            status: outcome === "failure" ? 401 : 200,
            bytes: 0,
            userAgent: "SSH",
            referrer: "-",
            outcome,
            os: "-",
            browser: "-",
            device: "-",
            severity,
            attackType
          };
        }

        // ================= NGINX LOGIC =================

        const status = src.http?.response?.status_code || 0;
        const path = src.url?.path || "";
        const fullUrl = src.url?.original || "";
        const userAgent = src.user_agent?.original || "";

        return {
          id: h._id,
          timestamp: src["@timestamp"],
          ip,
          method: src.http?.request?.method || "-",
          path,
          fullUrl,
          status,
          bytes: src.http?.response?.body?.bytes || 0,
          userAgent,
          referrer: src.http?.request?.referrer || "-",
          outcome: src.event?.outcome || "-",
          os: src.user_agent?.os?.name || "-",
          browser: src.user_agent?.name || "-",
          device: src.user_agent?.device?.name || "-",
          severity,
          attackType
        };

      });

      const normalLogs = logs.filter(log => log.attackType !== "normal");

      // Jangan tampilkan event individual kalau sudah ada aggregated alert
      const attackedIPs = new Set(
        attackAlerts.map(alert => alert.ip)
      );

      const cleanLogs = normalLogs.filter(log => !attackedIPs.has(log.ip));

      const finalLogs = [
        ...attackAlerts,
        ...cleanLogs
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      res.json(finalLogs);

    } catch (err) {
      console.error("Elastic error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/stats", async (req, res) => {
    try {

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last5min = new Date(now.getTime() - 5 * 60 * 1000);
      const last1min = new Date(now.getTime() - 60 * 1000);

      const response = await axios.post(
        `${ELASTIC_URL}/filebeat-*/_search`,
        {
          size: 0,
          query: {
            range: {
              "@timestamp": {
                gte: last24h.toISOString(),
                lte: now.toISOString()
              }
            }
          },
          aggs: {

            // ================= AUTH FAILURES =================
            auth_failures: {
              filter: {
                bool: {
                  must: [
                    { term: { "event.dataset": "system.auth" } },
                    { term: { "event.outcome": "failure" } }
                  ]
                }
              }
            },

            // ================= SSH FAIL PER IP (5 MIN WINDOW) =================
            ssh_fail_by_ip: {
              filter: {
                bool: {
                  must: [
                    { term: { "event.dataset": "system.auth" } },
                    { term: { "event.outcome": "failure" } },
                    {
                      range: {
                        "@timestamp": {
                          gte: last5min.toISOString(),
                          lte: now.toISOString()
                        }
                      }
                    }
                  ]
                }
              },
              aggs: {
                by_ip: {
                  terms: {
                    field: "source.ip",
                    size: 100
                  }
                }
              }
            },

            // ================= NGINX PER IP (1 MIN WINDOW) =================
            nginx_by_ip: {
              filter: {
                bool: {
                  must: [
                    { term: { "event.dataset": "nginx.access" } },
                    {
                      range: {
                        "@timestamp": {
                          gte: last1min.toISOString(),
                          lte: now.toISOString()
                        }
                      }
                    }
                  ]
                }
              },
              aggs: {
                by_ip: {
                  terms: {
                    field: "source.ip",
                    size: 100
                  }
                }
              }
            },

            // ================= TOTAL EVENTS =================
            total_events: {
              value_count: { field: "@timestamp" }
            },

            // ================= PER HOUR BREAKDOWN =================
            per_hour: {
              date_histogram: {
                field: "@timestamp",
                calendar_interval: "hour"
              },
              aggs: {
                ssh_failures: {
                  filter: {
                    bool: {
                      must: [
                        { term: { "event.dataset": "system.auth" } },
                        { term: { "event.outcome": "failure" } }
                      ]
                    }
                  }
                },
                nginx_requests: {
                  filter: {
                    term: { "event.dataset": "nginx.access" }
                  }
                }
              }
            }

          }
        }
      );

      const agg = response.data.aggregations;

      // ================= CALCULATE BRUTE FORCE =================
      const bruteForceIPs =
        agg.ssh_fail_by_ip.by_ip.buckets
          .filter(b => b.doc_count >= 5);

      const bruteForceCount = bruteForceIPs.length;

      // ================= CALCULATE DDOS =================
      const ddosIPs =
        agg.nginx_by_ip.by_ip.buckets
          .filter(b => b.doc_count >= 50);

      const ddosCount = ddosIPs.length;

      res.json({
        bruteForce: bruteForceCount,
        ddos: ddosCount,
        authFailures: agg.auth_failures.doc_count,
        totalEvents: agg.total_events.value,
        eventsPerHour: agg.per_hour.buckets
      });

    } catch (err) {
      console.error("Stats error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  export default router;
