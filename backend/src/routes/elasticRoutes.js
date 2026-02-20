import express from "express";
import axios from "axios";

const router = express.Router();

const ELASTIC_URL = "http://10.10.10.10:9200";

// ================= GET LOGS =================
router.get("/logs", async (req, res) => {
  try {

    const response = await axios.post(
      `${ELASTIC_URL}/filebeat-*/_search`,
      {
        size: 50,
        sort: [
          { "@timestamp": { order: "desc" } }
        ]
      }
    );

    const hits = response.data.hits.hits;

    const logs = hits.map(h => ({

      timestamp: h._source["@timestamp"],

      host: h._source.host?.hostname || "-",

      message: h._source.message || "-",

      ip:
        h._source.host?.ip?.[0] ||
        "unknown",

      logfile:
        h._source.log?.file?.path ||
        "-"

    }));

    res.json(logs);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

export default router;
