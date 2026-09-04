import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { TreeInventory, TreeType } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const treeTypeUploadsDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "tree-types",
);

if (!fs.existsSync(treeTypeUploadsDir)) {
  fs.mkdirSync(treeTypeUploadsDir, { recursive: true });
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

const uploadTreeTypeImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imagenes") as any, false);
    }
    cb(null, true);
  },
});

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      : [];
  } catch {
    return [];
  }
};

const toIsoStringOrNull = (value: unknown) => {
  if (!value) {
    return null;
  }

  const dateValue = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  return dateValue.toISOString();
};

const normalizeName = (value: unknown) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const hasTreeTypeWithName = async (name: string, ignoreId?: number) => {
  const normalized = name.toLocaleLowerCase("es");
  const rows = await TreeType.findAll({
    attributes: ["type_id", "name"],
  });

  return rows.some((row) => {
    const rowId = Number(row.getDataValue("type_id"));
    if (ignoreId && rowId === ignoreId) {
      return false;
    }
    const rowName = String(row.getDataValue("name") || "")
      .trim()
      .toLocaleLowerCase("es");
    return rowName === normalized;
  });
};

const serializeTreeType = (row: TreeType) => ({
  id: Number(row.getDataValue("type_id")),
  name: String(row.getDataValue("name") || ""),
  description: String(row.getDataValue("description") || ""),
  referenceImages: parseStringArray(row.getDataValue("reference_images")),
  createdAt: toIsoStringOrNull(row.getDataValue("created_at")),
  updatedAt: toIsoStringOrNull(row.getDataValue("updated_at")),
});

router.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  const rows = await TreeType.findAll({
    order: [
      ["updated_at", "DESC"],
      ["type_id", "DESC"],
    ],
  });

  return res.json(rows.map((row) => serializeTreeType(row as TreeType)));
});

router.post(
  "/images",
  authenticate,
  uploadTreeTypeImages.array("images", 10),
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      return res.status(400).json({ error: "No se recibieron imagenes" });
    }

    try {
      const savedUrls: string[] = [];

      for (const [index, file] of files.entries()) {
        const filename = `tt-${Date.now()}-${index}.jpg`;
        const outputPath = path.join(treeTypeUploadsDir, filename);

        await sharp(file.buffer)
          .resize(1800, 1400, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 84 })
          .toFile(outputPath);

        savedUrls.push(`/uploads/tree-types/${filename}`);
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
    const name = normalizeName(req.body?.name);
    const description = String(req.body?.description || "").trim();
    const referenceImages = parseStringArray(req.body?.referenceImages);

    if (!name) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    if (!description) {
      return res.status(400).json({ error: "La descripcion es obligatoria" });
    }

    if (!referenceImages.length) {
      return res
        .status(400)
        .json({ error: "Debe incluir al menos una imagen referencial" });
    }

    const duplicated = await hasTreeTypeWithName(name);
    if (duplicated) {
      return res
        .status(409)
        .json({ error: "Ya existe un tipo de arbol con ese nombre" });
    }

    const created = await TreeType.create({
      name,
      description,
      reference_images: JSON.stringify(referenceImages),
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json(serializeTreeType(created as TreeType));
  },
);

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const treeTypeId = Number(req.params.id);
    if (!Number.isFinite(treeTypeId)) {
      return res
        .status(400)
        .json({ error: "Identificador de tipo de arbol invalido" });
    }

    const treeType = await TreeType.findByPk(treeTypeId);
    if (!treeType) {
      return res.status(404).json({ error: "Tipo de arbol no encontrado" });
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof req.body?.name !== "undefined") {
      const name = normalizeName(req.body.name);
      if (!name) {
        return res.status(400).json({ error: "El nombre es obligatorio" });
      }

      const duplicated = await hasTreeTypeWithName(name, treeTypeId);
      if (duplicated) {
        return res
          .status(409)
          .json({ error: "Ya existe un tipo de arbol con ese nombre" });
      }

      payload.name = name;
    }

    if (typeof req.body?.description !== "undefined") {
      const description = String(req.body.description || "").trim();
      if (!description) {
        return res.status(400).json({ error: "La descripcion es obligatoria" });
      }
      payload.description = description;
    }

    if (typeof req.body?.referenceImages !== "undefined") {
      const images = parseStringArray(req.body.referenceImages);
      if (!images.length) {
        return res
          .status(400)
          .json({ error: "Debe incluir al menos una imagen referencial" });
      }
      payload.reference_images = JSON.stringify(images);
    }

    await treeType.update(payload);
    return res.json(serializeTreeType(treeType as TreeType));
  },
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const treeTypeId = Number(req.params.id);
    if (!Number.isFinite(treeTypeId)) {
      return res
        .status(400)
        .json({ error: "Identificador de tipo de arbol invalido" });
    }

    const treeType = await TreeType.findByPk(treeTypeId);
    if (!treeType) {
      return res.status(404).json({ error: "Tipo de arbol no encontrado" });
    }

    const totalReferences = await TreeInventory.count({
      where: { type_id: treeTypeId },
    });

    if (totalReferences > 0) {
      return res.status(409).json({
        error:
          "No se puede eliminar el tipo de arbol porque ya esta referenciado por arboles registrados",
      });
    }

    await treeType.destroy();
    return res.status(204).end();
  },
);

export default router;
