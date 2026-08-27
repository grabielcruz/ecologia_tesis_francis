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
    return res.status(401).json({ error: "Token invalido" });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imagenes") as any, false);
    }
    cb(null, true);
  },
});

const parseImages = (value: string) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const serializeGreenSpace = (row: GreenSpace) => ({
  id: row.getDataValue("space_id"),
  name: row.getDataValue("name"),
  location: row.getDataValue("location"),
  totalAreaM2: row.getDataValue("total_area_m2"),
  tallTreeCount: row.getDataValue("trees_count"),
  images: parseImages(String(row.getDataValue("images") || "[]")),
  updatedAt: row.getDataValue("updated_at"),
});

router.get("/", async (_req, res) => {
  const rows = await GreenSpace.findAll({
    order: [
      ["updated_at", "DESC"],
      ["space_id", "DESC"],
    ],
  });

  const spaceIds = rows.map((row) => row.getDataValue("space_id"));
  const reviews = spaceIds.length
    ? await GreenSpaceReview.findAll({
        where: {
          space_id: spaceIds,
        },
        include: [{ model: User, attributes: ["username"] }],
        order: [["updated_at", "DESC"]],
      })
    : [];

  const reviewsBySpace: Record<
    number,
    Array<{ username: string; rating: number; comment: string; updatedAt?: string }>
  > = {};

  for (const review of reviews) {
    const spaceId = Number(review.getDataValue("space_id"));
    const rating = Number(review.getDataValue("rating")) || 0;
    const comment = String(review.getDataValue("review_notes") || "");
    const user = review.get("User") as User | undefined;
    const username = String(user?.getDataValue("username") || "anonimo");
    const updatedAt = review.getDataValue("updated_at");

    if (!reviewsBySpace[spaceId]) {
      reviewsBySpace[spaceId] = [];
    }

    reviewsBySpace[spaceId].push({
      username,
      rating,
      comment,
      updatedAt: updatedAt ? String(updatedAt) : undefined,
    });
  }

  res.json(
    rows.map((row) => {
      const base = serializeGreenSpace(row);
      const rowReviews = reviewsBySpace[base.id] || [];
      const totalReviews = rowReviews.length;
      const averageRating =
        totalReviews > 0
          ? rowReviews.reduce((acc, item) => acc + item.rating, 0) / totalReviews
          : 0;

      return {
        ...base,
        reviewSummary: {
          totalReviews,
          averageRating,
        },
        recentReviews: rowReviews.slice(0, 3),
      };
    }),
  );
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
          .resize(1800, 1400, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 84 })
          .toFile(outputPath);

        savedUrls.push(`/uploads/green-spaces/${filename}`);
      }

      return res.status(201).json({ images: savedUrls });
    } catch {
      return res.status(500).json({ error: "No se pudieron subir las imagenes" });
    }
  },
);

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, location, totalAreaM2, tallTreeCount, images } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: "Nombre y ubicacion son obligatorios" });
  }

  const imageList = Array.isArray(images)
    ? images.filter((img) => typeof img === "string" && img.trim().length > 0)
    : [];

  if (!imageList.length) {
    return res.status(400).json({ error: "Debes incluir al menos una imagen" });
  }

  const created = await GreenSpace.create({
    name,
    location,
    total_area_m2: Number(totalAreaM2) || 0,
    trees_count: Number(tallTreeCount) || 0,
    images: JSON.stringify(imageList),
    updated_at: new Date(),
  });

  return res.status(201).json(serializeGreenSpace(created));
});

router.put("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const row = await GreenSpace.findByPk(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Area verde no encontrada" });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date(),
  };
  const { name, location, totalAreaM2, tallTreeCount, images } = req.body;

  if (typeof name !== "undefined") updates.name = name;
  if (typeof location !== "undefined") updates.location = location;
  if (typeof totalAreaM2 !== "undefined") {
    updates.total_area_m2 = Number(totalAreaM2) || 0;
  }
  if (typeof tallTreeCount !== "undefined") {
    updates.trees_count = Number(tallTreeCount) || 0;
  }
  if (Array.isArray(images)) {
    updates.images = JSON.stringify(
      images.filter((img) => typeof img === "string" && img.trim().length > 0),
    );
  }

  await row.update(updates);
  return res.json(serializeGreenSpace(row));
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const row = await GreenSpace.findByPk(req.params.id);
  if (!row) {
    return res.status(404).json({ error: "Area verde no encontrada" });
  }

  await row.destroy();
  return res.status(204).end();
});

router.post("/:id/reviews", authenticate, async (req: AuthRequest, res: Response) => {
  const spaceId = Number(req.params.id);
  if (!Number.isFinite(spaceId)) {
    return res.status(400).json({ error: "Identificador de area verde invalido" });
  }

  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const greenSpace = await GreenSpace.findByPk(spaceId);
  if (!greenSpace) {
    return res.status(404).json({ error: "Area verde no encontrada" });
  }

  const rawRating = Number(req.body?.rating);
  if (Number.isNaN(rawRating) || rawRating < 0 || rawRating > 5) {
    return res.status(400).json({ error: "La calificacion debe estar entre 0 y 5" });
  }

  const rating = Math.round(rawRating);
  const comment = String(req.body?.comment || "").trim();
  if (!comment) {
    return res.status(400).json({ error: "El comentario es obligatorio" });
  }

  const existing = await GreenSpaceReview.findOne({
    where: {
      user_id: req.user.user_id,
      space_id: spaceId,
    },
  });

  const payload = {
    review_notes: comment,
    rating,
    user_id: req.user.user_id,
    space_id: spaceId,
    updated_at: new Date(),
  };

  if (existing) {
    await existing.update(payload);
    return res.json({ ok: true });
  }

  await GreenSpaceReview.create({
    ...payload,
    created_at: new Date(),
  });
  return res.status(201).json({ ok: true });
});

export default router;
