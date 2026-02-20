import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import zabbixRoutes from "./routes/zabbixRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import elasticRoutes from "./routes/elasticRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
origin: "*"}));
app.use(express.json());

app.use("/api/zabbix", zabbixRoutes);

app.use("/api/elastic", elasticRoutes);

app.listen(process.env.PORT, () => {
  console.log(`API running on port ${process.env.PORT}`);
});

app.use("/api", healthRoutes);

console.log("PORT:", process.env.PORT);
