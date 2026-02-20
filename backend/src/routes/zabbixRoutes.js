import express from "express";
import axios from "axios";
import {
  getHosts,
  getHostMetrics,
  getProblems
} from "../services/zabbixService.js";

const router = express.Router();
const url = process.env.ZABBIX_URL;

let authToken = null;


// ==============================
// LOGIN ZABBIX
// ==============================
async function loginZabbix() {

  const res = await axios.post(url, {
    jsonrpc: "2.0",
    method: "user.login",
    params: {
      username: process.env.ZABBIX_USER,
      password: process.env.ZABBIX_PASS
    },
    id: 1
  });

  authToken = res.data.result;
}


// ==============================
// GET INTERFACE (REAL STATUS)
// ==============================
async function getInterface(hostid) {

  if (!authToken) await loginZabbix();

  const res = await axios.post(url, {
    jsonrpc: "2.0",
    method: "hostinterface.get",
    params: {
      output: ["ip","available"],
      hostids: hostid
    },
    auth: authToken,
    id: 2
  });

  return res.data.result[0];
}


// ==============================
// GET HOSTS + METRICS
// ==============================
router.get("/hosts", async (req, res) => {

  try {

    const hosts = await getHosts();

    const finalHosts = await Promise.all(

      hosts.map(async (h) => {

        const iface = await getInterface(h.hostid);
        const metrics = await getHostMetrics(h.hostid);

        let cpu = 0;
        let ram = 0;
        let bwIn = "0 bps";
        let bwOut = "0 bps";
        let lastCheck = 0;

        metrics.forEach(m => {

          if (m.key_ === "system.cpu.util")
            cpu = parseFloat(m.lastvalue);

          if (m.key_ === "vm.memory.utilization")
            ram = parseFloat(m.lastvalue);

          if (m.key_.includes("net.if.in"))
            bwIn = (parseFloat(m.lastvalue)/1024).toFixed(2)+" Kbps";

          if (m.key_.includes("net.if.out"))
            bwOut = (parseFloat(m.lastvalue)/1024).toFixed(2)+" Kbps";

          if (m.lastclock)
            lastCheck = m.lastclock;
        });

        return {
          hostid: h.hostid,
          host: h.host,
          ip: iface?.ip || "-",

          // 🔥 REAL STATUS
          available: Number(iface?.available || 0),

          cpu: Number(cpu.toFixed(1)),
          ram: Number(ram.toFixed(1)),
          bwIn,
          bwOut,
          lastCheck
        };
      })
    );

    res.json(finalHosts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==============================
// GET PROBLEMS
// ==============================
router.get("/problems", async (req, res) => {
  try {

    const data = await getProblems();

    if (!Array.isArray(data))
      return res.json([]);

    const mapped = data.map(p => ({

      // ================= ID =================
      id: p.triggerid,

      // ================= HOST =================
      host: p.hosts?.[0]?.host || "Unknown",

      // ================= PROBLEM TEXT =================
      problem: p.description || "No description",

      // ================= SEVERITY =================
      severity:
        p.priority == 5 ? "disaster" :
        p.priority == 4 ? "high" :
        p.priority == 3 ? "warning" :
        p.priority == 2 ? "average" :
        p.priority == 1 ? "info" :
        "unknown",

      // ================= LAST CHANGE =================
      lastchange: p.lastchange,

      // ================= STATUS =================
      status:
        p.value == "0"
          ? "RESOLVED"
          : "PROBLEM"

    }));

    res.json(mapped);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


// ==============================
// DASHBOARD (REAL DATA)
// ==============================
router.get("/dashboard", async (req, res) => {

  try {

    // 🔥 Ambil data final dari endpoint hosts
    const hostsRes = await axios.get(
      "http://localhost:3001/api/zabbix/hosts"
    );

    const hosts = hostsRes.data;

    if (!Array.isArray(hosts))
      return res.json({
        stats: {},
        hosts: [],
        problems: []
      });

    // ================= STATS =================
    const totalHosts = hosts.length;

    const serversUp = hosts.filter(
      h => Number(h.available) === 1
    ).length;

    const serversDown = hosts.filter(
      h => Number(h.available) === 2
    ).length;

    const upPercentage =
      totalHosts > 0
        ? Number(((serversUp / totalHosts) * 100).toFixed(2))
        : 0;

    // ================= PROBLEMS =================
    const problems = await getProblems();

    res.json({
      stats: {
        totalHosts,
        serversUp,
        serversDown,
        upPercentage
      },
      hosts,
      problems
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


export default router;
