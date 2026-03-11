import express from "express";
import axios from "axios";
import { detectBruteForce } from "../detectors/bruteForceDetector.js";
import { detectDdos } from "../detectors/ddosDetector.js";

const router = express.Router();
const ELASTIC_URL = "http://10.10.10.10:9200";


// =======================
// GET LOGS (VIEWER ONLY)
// =======================
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

    const logs = hits.map(h => {
      const src = h._source;
      const ip = src.source?.ip || "-";

      let severity = "info";
      let attackType = "normal";

      if (src.event?.dataset === "system.auth") {
        const outcome = src.event?.outcome || "";
        const user = src.user?.name || "-";
        const message = src.message || "";

        if (
          outcome === "failure" ||
          message.includes("Failed password")
        ) {
          severity = "high";
          attackType = "ssh_failed_login";
        }

        return {
          id: h._id,
          timestamp: src["@timestamp"],
          ip,
          method: "SSH",
          path: `SSH Login (${user})`,
          status:
            outcome === "failure" || message.includes("Failed password")
              ? 401
              : 200,
          severity,
          attackType
        };
      }

      return {
        id: h._id,
        timestamp: src["@timestamp"],
        ip,
        method: src.http?.request?.method || "-",
        path: src.url?.path || "",
        status: src.http?.response?.status_code || 0,
        severity,
        attackType
      };
    });

    // =====================
    // DETECT BRUTE FORCE
    // =====================
    const aggResponse = await axios.post(
      `${ELASTIC_URL}/filebeat-*/_search`,
      {
        size: 0,
        query: {
          range: {
            "@timestamp": {
              gte: "now-24h",
              lte: "now"
            }
          }
        },
        aggs: {
            ssh_activity: {
                filter: {
                term: { "event.dataset": "system.auth" }
                },
                aggs: {
                by_ip: {
                    terms: {
                    field: "source.ip",
                    size: 100
                    },
                    aggs: {
                    per_minute: {
                        date_histogram: {
                        field: "@timestamp",
                        fixed_interval: "1m"
                        },
                        aggs: {
                        failures: {
                            filter: {
                            bool: {
                                should: [
                                { term: { "event.outcome": "failure" } },
                                { match_phrase: { "message": "Failed password" } }
                                ],
                                minimum_should_match: 1
                            }
                            }
                        },
                        success: {
                            filter: {
                            term: { "event.outcome": "success" }
                            }
                        }
                        }
                    }
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
                    },
                    aggs: {
                        per_minute: {
                        date_histogram: {
                            field: "@timestamp",
                            fixed_interval: "1m"
                        }
                        }
                    }
                    }
                }
              }
           }
        }
    );

    const brute = detectBruteForce(
      aggResponse.data.aggregations,
      5
    );

    const ddos = detectDdos(
      aggResponse.data.aggregations,
      50
    );

    const alertLogs = [];

    // LOOP //
    brute.events.forEach(event => {
      const ip = event.ip;

      alertLogs.push({
        id: `bruteforce-${ip}-${event.timestamp}`,
        timestamp: event.timestamp,
        ip,
        method: "SSH",
        path: "Brute Force Detected",
        status: 401,
        severity: "critical",
        attackType: "ssh_bruteforce"
      });
    });

    ddos.events.forEach(event => {
      alertLogs.push({
        id: `ddos-${event.ip}-${event.timestamp}`,
        timestamp: event.timestamp,
        ip: event.ip,
        method: "HTTP",
        path: "DDoS Detected",
        status: 429,
        severity: "critical",
        attackType: "ddos"
      });
    });

    const filteredLogs = logs.filter(log => {
      if (
        log.attackType === "normal" &&
        log.status === 404 &&
        ddos.events.some(e => e.ip === log.ip)
      ) {
        return false;
      }

      return true;
    });

    const finalLogs = [
      ...alertLogs,
      ...filteredLogs
    ].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json(finalLogs);

  } catch (err) {
    console.error("Elastic error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// =======================
// GET STATS (DETECTION)
// =======================
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
                  { term: { "event.dataset": "system.auth" } }
                ],
                should: [
                  { term: { "event.outcome": "failure" } },
                  { match_phrase: { "message": "Failed password" } }
                ],
                minimum_should_match: 1
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

          ssh_activity: {
            filter: {
              term: { "event.dataset": "system.auth" }
            },
            aggs: {
              by_ip: {
                terms: {
                  field: "source.ip",
                  size: 100
                },
                aggs: {
                  per_minute: {
                    date_histogram: {
                      field: "@timestamp",
                      fixed_interval: "1m"
                    },
                    aggs: {
                      failures: {
                        filter: {
                          bool: {
                            should: [
                              { term: { "event.outcome": "failure" } },
                              { match_phrase: { "message": "Failed password" } }
                            ],
                            minimum_should_match: 1
                          }
                        }
                      },
                      success: {
                        filter: {
                          term: { "event.outcome": "success" }
                        }
                      }
                    }
                  }
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
                },
                aggs: {
                    per_minute: {
                    date_histogram: {
                        field: "@timestamp",
                        fixed_interval: "1m"
                    }
                    }
                }
                }
            }
            }

        }
      }
    );



    const agg = response.data.aggregations;

    const brute = detectBruteForce(agg, 5);
    const ddos = detectDdos(agg, 50);

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
        bruteForce: brute.count,
        ddos: ddos.count,
        zabbixProblems: 0
      }

    });

  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
