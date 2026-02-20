import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.ZABBIX_URL;

let authToken = null;

// ==============================
// LOGIN
// ==============================
export async function loginZabbix() {

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
// GET HOSTS
// ==============================
export async function getHosts() {

  if (!authToken) await loginZabbix();

  const res = await axios.post(url, {
    jsonrpc: "2.0",
    method: "host.get",
    params: {
      output: [
	"hostid",
	"host",
	"status",
	"available"
      ],

      selectInterfaces: [
        "ip",
        "available"
      ]
    },
    auth: authToken,
    id: 2
  });

  return res.data.result;
}


// ==============================
// GET PROBLEMS (REAL)
// ==============================
export async function getProblems() {

  if (!authToken) await loginZabbix();

  const res = await axios.post(url, {
    jsonrpc: "2.0",
    method: "trigger.get",
    params: {

      output: [
        "triggerid",
        "description",
        "priority",
        "lastchange",
        "value"
      ],

      // 🔥 ambil host name
      selectHosts: ["host"],

      // 🔥 hanya problem aktif
      filter: {
        value: 1
      },

      // hanya yang enabled
      only_true: true,

      expandDescription: true

    },
    auth: authToken,
    id: 3
  });

  return res.data.result;
}


// ==============================
// GET HOST METRICS (CPU / RAM / BW)
// ==============================
export async function getHostMetrics(hostid) {

  if (!authToken) await loginZabbix();

  const res = await axios.post(url, {
    jsonrpc: "2.0",
    method: "item.get",
    params: {
      hostids: hostid,
      output: ["name", "key_", "lastvalue", "lastclock"]
    },
    auth: authToken,
    id: 4
  });

  return res.data.result;
}
