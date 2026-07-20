import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { GreenSpace, GreenSpaceReview, User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const greenSpaceUploadsDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "green-spaces",
);

if (!fs.existsSync(greenSpaceUploadsDir)) {
  fs.mkdirSync(greenSpaceUploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imagenes") as any, false);
    }
    cb(null, true);
  },
});

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: number;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalido" });
  }
};

const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const user = await User.findByPk(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }

  next();
};

router.get("/", async (_req, res) => {
  const rows = await GreenSpace.findAll({
    order: [
      ["updatedAt", "DESC"],
      ["id", "DESC"],
    ],
  });
  const spaceIds = rows.map((row) => row.id);
  const reviews = spaceIds.length
    ? await GreenSpaceReview.findAll({
        where: { greenSpaceId: spaceIds },
        order: [["updatedAt", "DESC"]],
      })
    : [];

  const reviewStatsBySpace: Record<number, { total: number; sum: number }> = {};
  const recentReviewsBySpace: Record<
    number,
    Array<{
      username: string;
      rating: number;
      comment: string;
      updatedAt?: string;
    }>
  > = {};

  for (const review of reviews) {
    const spaceId = review.greenSpaceId;
    if (!reviewStatsBySpace[spaceId]) {
      reviewStatsBySpace[spaceId] = { total: 0, sum: 0 };
      recentReviewsBySpace[spaceId] = [];
    }
    reviewStatsBySpace[spaceId].total += 1;
    reviewStatsBySpace[spaceId].sum += review.rating;

    if (recentReviewsBySpace[spaceId].length < 3) {
      const reviewUpdatedAt = (review as any).updatedAt;
      recentReviewsBySpace[spaceId].push({
        username: review.username,
        rating: review.rating,
        comment: review.comment,
        updatedAt:
          reviewUpdatedAt instanceof Date
            ? reviewUpdatedAt.toISOString()
            : undefined,
      });
    }
  }

  const spaces = rows.map((row) => {
    const data = row.toJSON() as any;
    let images: string[] = [];
    try {
      images = JSON.parse(data.images || "[]");
    } catch {
      images = [];
    }

    const stats = reviewStatsBySpace[row.id] || { total: 0, sum: 0 };
    const averageRating = stats.total ? stats.sum / stats.total : 0;

    return {
      ...data,
      images,
      reviewSummary: {
        totalReviews: stats.total,
        averageRating,
      },
      recentReviews: recentReviewsBySpace[row.id] || [],
    };
  });

  res.json(spaces);
});

router.post(
  "/images",
  authenticate,
  requireAdmin,
  upload.array("images", 10),
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      return res.status(400).json({ error: "No se recibieron imagenes" });
    }

    try {
      const savedUrls: string[] = [];

      for (const [index, file] of files.entries()) {
        const filename = `gs-${Date.now()}-${index}.jpg`;
        const outputPath = path.join(greenSpaceUploadsDir, filename);

        await sharp(file.buffer)
          .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toFile(outputPath);

        savedUrls.push(`/uploads/green-spaces/${filename}`);
      }

      return res.status(201).json({ images: savedUrls });
    } catch {
      return res
        .status(500)
        .json({ error: "No se pudieron subir las imagenes" });
    }
  },
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const { name, location, totalAreaM2, tallTreeCount, images } = req.body;

    if (!name || !location) {
      return res
        .status(400)
        .json({ error: "Nombre y ubicacion son obligatorios" });
    }

    const imageList = Array.isArray(images)
      ? images.filter((img) => typeof img === "string")
      : [];

    const created = await GreenSpace.create({
      name,
      location,
      totalAreaM2: Number(totalAreaM2) || 0,
      tallTreeCount: Number(tallTreeCount) || 0,
      images: JSON.stringify(imageList),
    });

    res.status(201).json({
      ...created.toJSON(),
      images: imageList,
    });
  },
);

router.post(
  "/:id/reviews",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const greenSpace = await GreenSpace.findByPk(id);
    if (!greenSpace) {
      return res.status(404).json({ error: "Area verde no encontrada" });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const rawRating = Number(req.body.rating);
    if (Number.isNaN(rawRating) || rawRating < 0 || rawRating > 5) {
      return res
        .status(400)
        .json({ error: "La calificacion debe estar entre 0 y 5" });
    }

    const rating = Math.round(rawRating);
    const comment = String(req.body.comment || "").trim();
    if (!comment) {
      return res.status(400).json({ error: "El comentario es obligatorio" });
    }

    const existing = await GreenSpaceReview.findOne({
      where: {
        greenSpaceId: Number(id),
        username: user.username,
      },
    });

    if (existing) {
      await existing.update({ rating, comment });
      return res.json(existing);
    }

    const created = await GreenSpaceReview.create({
      greenSpaceId: Number(id),
      username: user.username,
      rating,
      comment,
    });

    return res.status(201).json(created);
  },
);

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const row = await GreenSpace.findByPk(req.params.id);
    if (!row)
      return res.status(404).json({ error: "Area verde no encontrada" });

    const updates: Record<string, unknown> = {};
    const { name, location, totalAreaM2, tallTreeCount, images } = req.body;

    if (typeof name !== "undefined") updates.name = name;
    if (typeof location !== "undefined") updates.location = location;
    if (typeof totalAreaM2 !== "undefined")
      updates.totalAreaM2 = Number(totalAreaM2) || 0;
    if (typeof tallTreeCount !== "undefined")
      updates.tallTreeCount = Number(tallTreeCount) || 0;
    if (Array.isArray(images)) {
      updates.images = JSON.stringify(
        images.filter((img) => typeof img === "string"),
      );
    }

    await row.update(updates);

    let parsedImages: string[] = [];
    try {
      parsedImages = JSON.parse(row.images || "[]");
    } catch {
      parsedImages = [];
    }

    res.json({
      ...row.toJSON(),
      images: parsedImages,
    });
  },
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const row = await GreenSpace.findByPk(req.params.id);
    if (!row)
      return res.status(404).json({ error: "Area verde no encontrada" });
    await row.destroy();
    res.status(204).end();
  },
);

export default router;
