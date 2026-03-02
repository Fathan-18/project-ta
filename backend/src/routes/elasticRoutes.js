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
              must: [
                {
                  range: {
                    "@timestamp": {
                      gte: "now-24h",
                      lte: "now"
                    }
                  }
                }
              ],
              should: [
                { term: { "event.dataset": "nginx.access" } },
                { term: { "event.dataset": "system.auth" } }
              ],
              minimum_should_match: 1,
              must_not: [
                { wildcard: { "url.path": "/zabbix*" } }
              ]
            }
          }
        }
      );

      const hits = response.data.hits.hits;

      const ipCounter = {};
      const sshFailureCounter = {};

      hits.forEach(h => {
        const src = h._source;
        const ip = src.source?.ip;

        if (!ip) return;

        if (
          src.event?.dataset === "nginx.access" &&
          [404, 429, 403].includes(src.http?.response?.status_code)
        ) {
          ipCounter[ip] = (ipCounter[ip] || 0) + 1;
        }

        if (
          src.event?.dataset === "system.auth" &&
          src.event?.outcome === "failure"
        ) {
          sshFailureCounter[ip] = (sshFailureCounter[ip] || 0) + 1;
        }
      });

      const attackAlerts = [];

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

      const logs = hits.map(h => {

        const src = h._source;
        const ip = src.source?.ip || "-";

        let severity = "info";
        let attackType = "normal";

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

      const finalLogs = [
        ...attackAlerts,
        ...logs
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

            total_nginx: {
              filter: {
                term: { "event.dataset": "nginx.access" }
              }
            },

            total_auth_activity: {
              filter: {
                term: { "event.dataset": "system.auth" }
              }
            },

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

            nginx_errors: {
              filter: {
                bool: {
                  must: [
                    { term: { "event.dataset": "nginx.access" } },
                    {
                      terms: {
                        "http.response.status_code": [404, 429, 403]
                      }
                    }
                  ]
                }
              }
            },

            ssh_fail_by_ip: {
              filter: {
                bool: {
                  must: [
                    { term: { "event.dataset": "system.auth" } },
                    { term: { "event.outcome": "failure" } }
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

            nginx_by_ip: {
              filter: {
                bool: {
                  must: [
                    { term: { "event.dataset": "nginx.access" } },
                    {
                      terms: {
                        "http.response.status_code": [404, 429, 403]
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

            per_hour: {
              date_histogram: {
                field: "@timestamp",
                calendar_interval: "hour"
              }
            }

          }
        }
      );

      const agg = response.data.aggregations;

      const bruteForceIPs =
        agg.ssh_fail_by_ip.by_ip.buckets
          .filter(b => b.doc_count >= 5);

      const bruteForceCount = bruteForceIPs.length;

      const ddosIPs =
        agg.nginx_by_ip.by_ip.buckets
          .filter(b => b.doc_count >= 50);

      const ddosCount = ddosIPs.length;

      res.json({

      traffic: {
        totalRequests: agg.total_nginx.doc_count,
        totalAuthActivity: agg.total_auth_activity.doc_count
      },

      securityEvents: {
        authFailures: agg.auth_failures.doc_count,
        nginxErrors: agg.nginx_errors.doc_count
      },

      incidents: {
        bruteForce: bruteForceCount,
        ddos: ddosCount,
        zabbixProblems: 0
      },

      totalIncidents:
        bruteForceCount +
        ddosCount

    });

    } catch (err) {
      console.error("Stat s error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  export default router;
