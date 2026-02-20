import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/health", async (req, res) => {

  let zabbix = false;
  let elasticsearch = false;

  // ================= ZABBIX =================
  try {
    await axios.post(
      process.env.ZABBIX_URL,
      {
        jsonrpc: "2.0",
        method: "apiinfo.version",
        params: [],
        id: 1
      }
    );

    zabbix = true;

  } catch {
    zabbix = false;
  }

  // ================= ELASTIC =================
  try {
    await axios.get(
      "http://10.10.10.10:9200"
    );

    elasticsearch = true;

  } catch {
    elasticsearch = false;
  }

  res.json({
    zabbix,
    elasticsearch
  });

});

export default router;
