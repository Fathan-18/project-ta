import express from "express";
import axios from "axios";

const router = express.Router();
const ELASTIC_URL = "http://10.10.10.10:9200";

router.get("/logs", async (req, res) => {
  try {

    const response = await axios.post(
      `${ELASTIC_URL}/filebeat-*/_search`,
      {
        size: 100,
        sort: [{ "@timestamp": { order: "desc" } }],
        query: {
          bool: {
            should: [   // 🔥 GANTI MUST JADI SHOULD
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

    const logs = hits.map(h => {

      const src = h._source;

      let severity = "info";
      let attackType = "normal";
      let score = 0;

      // =========================================================
      // ===================== SSH LOGIC =========================
      // =========================================================
      if (src.event?.dataset === "system.auth") {

        const outcome = src.event?.outcome || "";
        const user = src.user?.name || "-";
        const ip = src.source?.ip || "-";

        if (outcome === "failure") {
          severity = "high";
          attackType = "ssh_failed_login";
        }

        if (user === "root" && outcome === "failure") {
          severity = "critical";
          attackType = "ssh_root_bruteforce";
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

      // =========================================================
      // ===================== NGINX LOGIC =======================
      // =========================================================

      const status = src.http?.response?.status_code || 0;
      const path = src.url?.path || "";
      const fullUrl = src.url?.original || "";
      const queryString = src.url?.query || "";
      const decodedUrl = decodeURIComponent(fullUrl);
      const decodedQuery = decodeURIComponent(queryString);
      const userAgent = src.user_agent?.original || "";
      const ip = src.source?.ip || "-";

      // ===== STATUS BASED =====
      if (status >= 500) {
        score = 4;
        severity = "critical";
        attackType = "server_error";
      } else if (status === 401) {
        score = 3;
        severity = "high";
        attackType = "possible_bruteforce";
      } else if (status === 403) {
        score = 2;
        severity = "medium";
        attackType = "forbidden_access";
      } else if (status === 404) {
        score = 1;
        severity = "low";
        attackType = "path_scanning";
      }

      // ===== SQL INJECTION =====
      if (
        /union|select|drop|insert|--|or\s+1=1/i.test(decodedUrl) ||
        /union|select|drop|insert|--|or\s+1=1/i.test(decodedQuery)
      ) {
        score = 5;
        severity = "critical";
        attackType = "sql_injection";
      }

      // ===== XSS =====
      if (
        /<script>|alert\(|onerror=|%3Cscript%3E/i.test(decodedUrl)
      ) {
        score = 5;
        severity = "critical";
        attackType = "xss_attempt";
      }

      // ===== LFI =====
      if (
        /\.\.\/|\/etc\/passwd|%2e%2e/i.test(decodedUrl)
      ) {
        score = 5;
        severity = "critical";
        attackType = "lfi_attempt";
      }

      // ===== SCANNER USER AGENT =====
      if (
        /sqlmap|nikto|nmap|masscan/i.test(userAgent)
      ) {
        if (score < 4) {
          score = 4;
          severity = "high";
          attackType = "scanner_detected";
        }
      }

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

    const showAll = req.query.all === "true";

    const finalLogs = showAll
      ? logs
      : logs.filter(log => log.attackType !== "normal");

    res.json(finalLogs);

  } catch (err) {
    console.error("Elastic error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
