import express from "express";
import path from "path";
import cors from "cors";
import { initializeDatabase } from "./models";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import greenSpaceRoutes from "./routes/greenSpaces";
import suggestionRoutes from "./routes/suggestions";
import proposalRoutes from "./routes/proposals";
import projectsRoutes from "./routes/projects";
import treeTypeRoutes from "./routes/treeTypes";
import treeRoutes from "./routes/trees";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "127.0.0.1";
const publicDir = path.resolve(process.cwd(), "public");
const uploadsDir = path.join(publicDir, "uploads");

app.use(cors());
app.use(express.json());

// Serve public assets (default avatar and uploaded images)
app.use(express.static(publicDir));
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/green-spaces", greenSpaceRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tree-types", treeTypeRoutes);
app.use("/api/trees", treeRoutes);

initializeDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server listening on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });
