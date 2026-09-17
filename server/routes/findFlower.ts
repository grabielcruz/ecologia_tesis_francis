import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { FindFlowerScore, User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      user_id: number;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

const toIsoStringOrNull = (value: unknown) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

router.get("/ranking", async (_req: AuthRequest, res: Response) => {
  const rows = await FindFlowerScore.findAll({
    include: [
      {
        model: User,
        attributes: ["user_id", "name", "username"],
      },
    ],
    order: [
      ["max_score", "DESC"],
      ["best_time_seconds", "ASC"],
      ["updated_at", "ASC"],
    ],
    limit: 20,
  });

  return res.json(
    rows.map((row) => {
      const user = row.get("User") as User | undefined;
      return {
        id: Number(row.getDataValue("find_flower_score_id")),
        maxScore: Number(row.getDataValue("max_score")) || 0,
        bestTimeSeconds:
          row.getDataValue("best_time_seconds") == null
            ? null
            : Number(row.getDataValue("best_time_seconds")),
        bestMoves:
          row.getDataValue("best_moves") == null
            ? null
            : Number(row.getDataValue("best_moves")),
        updatedAt: toIsoStringOrNull(row.getDataValue("updated_at")),
        user: user
          ? {
              id: Number(user.getDataValue("user_id")),
              name: String(user.getDataValue("name") || ""),
              username: String(user.getDataValue("username") || ""),
            }
          : null,
      };
    }),
  );
});

router.post("/score", authenticate, async (req: AuthRequest, res: Response) => {
  const score = Math.max(0, Math.trunc(Number(req.body?.score || 0)));
  const timeSeconds = Math.max(0, Math.trunc(Number(req.body?.timeSeconds || 0)));
  const moves = Math.max(0, Math.trunc(Number(req.body?.moves || 0)));

  if (!Number.isFinite(score) || score <= 0) {
    return res.status(400).json({ error: "Puntaje inválido" });
  }

  const userId = req.user!.user_id;
  const existing = await FindFlowerScore.findOne({ where: { user_id: userId } });

  if (!existing) {
    const created = await FindFlowerScore.create({
      user_id: userId,
      max_score: score,
      best_time_seconds: timeSeconds > 0 ? timeSeconds : null,
      best_moves: moves > 0 ? moves : null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json({
      updated: true,
      maxScore: Number(created.getDataValue("max_score")) || 0,
    });
  }

  const currentMax = Number(existing.getDataValue("max_score")) || 0;
  const currentBestTime =
    existing.getDataValue("best_time_seconds") == null
      ? null
      : Number(existing.getDataValue("best_time_seconds"));

  const shouldUpdateByScore = score > currentMax;
  const shouldUpdateByTime =
    score === currentMax && timeSeconds > 0 && (currentBestTime == null || timeSeconds < currentBestTime);

  if (!shouldUpdateByScore && !shouldUpdateByTime) {
    return res.json({ updated: false, maxScore: currentMax });
  }

  await existing.update({
    max_score: Math.max(currentMax, score),
    best_time_seconds: timeSeconds > 0 ? timeSeconds : currentBestTime,
    best_moves: moves > 0 ? moves : existing.getDataValue("best_moves"),
    updated_at: new Date(),
  });

  return res.json({
    updated: true,
    maxScore: Number(existing.getDataValue("max_score")) || Math.max(currentMax, score),
  });
});

export default router;
