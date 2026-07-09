import express from "express";
import path from "path";
import cors from "cors";
import { initializeDatabase } from "./models";
import { seedDatabase } from "./seeds";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import surveyRoutes from "./routes/surveys";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve public assets (default avatar and uploaded images)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/surveys", surveyRoutes);

initializeDatabase()
  .then(seedDatabase)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });
