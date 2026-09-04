import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { Op } from "sequelize";
import { GreenSpace, TreeInventory, TreeType, User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const treeUploadsDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "trees",
);

if (!fs.existsSync(treeUploadsDir)) {
  fs.mkdirSync(treeUploadsDir, { recursive: true });
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

const uploadTreeImages = multer({
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

const applyTreeCountDelta = async (spaceId: number, delta: number) => {
  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    return;
  }

  const space = await GreenSpace.findByPk(spaceId);
  if (!space) {
    return;
  }

  const currentCount = Number(space.getDataValue("trees_count")) || 0;
  const nextCount = Math.max(0, currentCount + delta);

  await space.update({
    trees_count: nextCount,
    updated_at: new Date(),
  });
};

const serializeTree = (row: TreeInventory) => {
  const treeType = row.get("TreeType") as TreeType | undefined;
  const greenSpace = row.get("GreenSpace") as GreenSpace | undefined;
  const submittedBy = row.get("SubmittedBy") as User | undefined;
  const validatedBy = row.get("ValidatedBy") as User | undefined;
  const rawTypeId = row.getDataValue("type_id");

  return {
    id: Number(row.getDataValue("tree_id")),
    name: String(row.getDataValue("name") || ""),
    healthStatus: String(row.getDataValue("health_status") || "healthy"),
    typeId: rawTypeId ? Number(rawTypeId) : null,
    spaceId: Number(row.getDataValue("space_id")),
    status: String(row.getDataValue("status") || "approved"),
    submittedByUserId: Number(row.getDataValue("submitted_by_user_id")),
    validatedByUserId: row.getDataValue("validated_by_user_id")
      ? Number(row.getDataValue("validated_by_user_id"))
      : null,
    imageUrls: parseStringArray(row.getDataValue("images")),
    treeType: treeType
      ? {
          id: Number(treeType.getDataValue("type_id")),
          name: String(treeType.getDataValue("name") || ""),
        }
      : null,
    greenSpace: greenSpace
      ? {
          id: Number(greenSpace.getDataValue("space_id")),
          name: String(greenSpace.getDataValue("name") || ""),
        }
      : null,
    submittedBy: submittedBy
      ? {
          id: Number(submittedBy.getDataValue("user_id")),
          username: String(submittedBy.getDataValue("username") || ""),
          name: String(submittedBy.getDataValue("name") || ""),
        }
      : null,
    validatedBy: validatedBy
      ? {
          id: Number(validatedBy.getDataValue("user_id")),
          username: String(validatedBy.getDataValue("username") || ""),
          name: String(validatedBy.getDataValue("name") || ""),
        }
      : null,
    createdAt: toIsoStringOrNull(row.getDataValue("created_at")),
    updatedAt: toIsoStringOrNull(row.getDataValue("updated_at")),
  };
};

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const rawSpaceId = Number(req.query.spaceId);
  const rawTypeId = Number(req.query.typeId);
  const rawStatus = String(req.query.status || "all")
    .trim()
    .toLowerCase();
  const whereClause: Record<string | symbol, unknown> = {};

  if (req.user.role !== "admin") {
    whereClause[Op.or] = [
      { status: "approved" },
      { submitted_by_user_id: req.user.user_id },
    ];
  }

  if (req.user.role === "admin") {
    if (["pending", "approved", "rejected"].includes(rawStatus)) {
      whereClause.status = rawStatus;
    }
  }

  if (Number.isFinite(rawSpaceId) && rawSpaceId > 0) {
    whereClause.space_id = rawSpaceId;
  }

  if (Number.isFinite(rawTypeId) && rawTypeId > 0) {
    whereClause.type_id = rawTypeId;
  }

  const rows = await TreeInventory.findAll({
    where: whereClause,
    include: [
      { model: TreeType, attributes: ["type_id", "name"] },
      { model: GreenSpace, attributes: ["space_id", "name"] },
      {
        model: User,
        as: "SubmittedBy",
        attributes: ["user_id", "username", "name"],
      },
      {
        model: User,
        as: "ValidatedBy",
        attributes: ["user_id", "username", "name"],
      },
    ],
    order: [
      ["updated_at", "DESC"],
      ["tree_id", "DESC"],
    ],
  });

  return res.json(rows.map((row) => serializeTree(row as TreeInventory)));
});

router.post(
  "/images",
  authenticate,
  uploadTreeImages.array("images", 10),
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      return res.status(400).json({ error: "No se recibieron imagenes" });
    }

    try {
      const savedUrls: string[] = [];

      for (const [index, file] of files.entries()) {
        const filename = `tree-${Date.now()}-${index}.jpg`;
        const outputPath = path.join(treeUploadsDir, filename);

        await sharp(file.buffer)
          .resize(1800, 1400, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 84 })
          .toFile(outputPath);

        savedUrls.push(`/uploads/trees/${filename}`);
      }

      return res.status(201).json({ images: savedUrls });
    } catch {
      return res
        .status(500)
        .json({ error: "No se pudieron guardar las imagenes" });
    }
  },
);

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const treeId = Number(req.params.id);
  if (!Number.isFinite(treeId)) {
    return res.status(400).json({ error: "Identificador de arbol invalido" });
  }

  const row = await TreeInventory.findByPk(treeId, {
    include: [
      { model: TreeType, attributes: ["type_id", "name"] },
      { model: GreenSpace, attributes: ["space_id", "name"] },
      {
        model: User,
        as: "SubmittedBy",
        attributes: ["user_id", "username", "name"],
      },
      {
        model: User,
        as: "ValidatedBy",
        attributes: ["user_id", "username", "name"],
      },
    ],
  });

  if (!row) {
    return res.status(404).json({ error: "Arbol no encontrado" });
  }

  if (
    req.user.role !== "admin" &&
    String(row.getDataValue("status") || "approved") !== "approved" &&
    Number(row.getDataValue("submitted_by_user_id")) !== req.user.user_id
  ) {
    return res.status(404).json({ error: "Arbol no encontrado" });
  }

  return res.json(serializeTree(row as TreeInventory));
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const name = String(req.body?.name || "").trim();
  const healthStatus = String(req.body?.healthStatus || "healthy")
    .trim()
    .toLowerCase();
  const typeId = Number(req.body?.typeId);
  const hasTypeId = Number.isFinite(typeId) && typeId > 0;
  const spaceId = Number(req.body?.spaceId);
  const imageUrls = parseStringArray(req.body?.imageUrls);

  if (!name) {
    return res
      .status(400)
      .json({ error: "El nombre del arbol es obligatorio" });
  }

  if (!["healthy", "regular", "sick", "dead"].includes(healthStatus)) {
    return res.status(400).json({ error: "Estado de salud invalido" });
  }

  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    return res.status(400).json({ error: "Area verde invalida" });
  }

  if (hasTypeId) {
    const treeType = await TreeType.findByPk(typeId);
    if (!treeType) {
      return res.status(404).json({ error: "Tipo de arbol no encontrado" });
    }
  }

  const greenSpace = await GreenSpace.findByPk(spaceId);
  if (!greenSpace) {
    return res.status(404).json({ error: "Area verde no encontrada" });
  }

  const created = await TreeInventory.create({
    name,
    health_status: healthStatus,
    type_id: hasTypeId ? typeId : null,
    space_id: spaceId,
    status: req.user.role === "admin" ? "approved" : "pending",
    submitted_by_user_id: req.user.user_id,
    validated_by_user_id: req.user.role === "admin" ? req.user.user_id : null,
    images: JSON.stringify(imageUrls),
    created_at: new Date(),
    updated_at: new Date(),
  });

  if (req.user.role === "admin") {
    await applyTreeCountDelta(spaceId, 1);
  }

  const withRelations = await TreeInventory.findByPk(
    created.getDataValue("tree_id"),
    {
      include: [
        { model: TreeType, attributes: ["type_id", "name"] },
        { model: GreenSpace, attributes: ["space_id", "name"] },
        {
          model: User,
          as: "SubmittedBy",
          attributes: ["user_id", "username", "name"],
        },
        {
          model: User,
          as: "ValidatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
    },
  );

  return res.status(201).json({
    message:
      req.user.role === "admin"
        ? "Arbol registrado correctamente"
        : "Arbol enviado para validacion de administrador",
    tree: serializeTree((withRelations || created) as TreeInventory),
  });
});

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const treeId = Number(req.params.id);
    if (!Number.isFinite(treeId)) {
      return res.status(400).json({ error: "Identificador de arbol invalido" });
    }

    const row = await TreeInventory.findByPk(treeId);
    if (!row) {
      return res.status(404).json({ error: "Arbol no encontrado" });
    }

    const previousSpaceId = Number(row.getDataValue("space_id"));
    const payload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (typeof req.body?.name !== "undefined") {
      const name = String(req.body.name || "").trim();
      if (!name) {
        return res
          .status(400)
          .json({ error: "El nombre del arbol es obligatorio" });
      }
      payload.name = name;
    }

    if (typeof req.body?.healthStatus !== "undefined") {
      const healthStatus = String(req.body.healthStatus || "")
        .trim()
        .toLowerCase();

      if (!["healthy", "regular", "sick", "dead"].includes(healthStatus)) {
        return res.status(400).json({ error: "Estado de salud invalido" });
      }

      payload.health_status = healthStatus;
    }

    if (typeof req.body?.typeId !== "undefined") {
      const typeId = Number(req.body.typeId);
      if (!Number.isFinite(typeId) || typeId <= 0) {
        payload.type_id = null;
      } else {
        const treeType = await TreeType.findByPk(typeId);
        if (!treeType) {
          return res.status(404).json({ error: "Tipo de arbol no encontrado" });
        }

        payload.type_id = typeId;
      }
    }

    if (typeof req.body?.spaceId !== "undefined") {
      const spaceId = Number(req.body.spaceId);
      if (!Number.isFinite(spaceId) || spaceId <= 0) {
        return res.status(400).json({ error: "Area verde invalida" });
      }

      const greenSpace = await GreenSpace.findByPk(spaceId);
      if (!greenSpace) {
        return res.status(404).json({ error: "Area verde no encontrada" });
      }

      payload.space_id = spaceId;
    }

    if (typeof req.body?.imageUrls !== "undefined") {
      payload.images = JSON.stringify(parseStringArray(req.body.imageUrls));
    }

    await row.update(payload);

    const currentSpaceId = Number(row.getDataValue("space_id"));
    if (currentSpaceId !== previousSpaceId) {
      await applyTreeCountDelta(previousSpaceId, -1);
      await applyTreeCountDelta(currentSpaceId, 1);
    }

    const withRelations = await TreeInventory.findByPk(treeId, {
      include: [
        { model: TreeType, attributes: ["type_id", "name"] },
        { model: GreenSpace, attributes: ["space_id", "name"] },
        {
          model: User,
          as: "SubmittedBy",
          attributes: ["user_id", "username", "name"],
        },
        {
          model: User,
          as: "ValidatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
    });

    return res.json(serializeTree((withRelations || row) as TreeInventory));
  },
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const treeId = Number(req.params.id);
    if (!Number.isFinite(treeId)) {
      return res.status(400).json({ error: "Identificador de arbol invalido" });
    }

    const row = await TreeInventory.findByPk(treeId);
    if (!row) {
      return res.status(404).json({ error: "Arbol no encontrado" });
    }

    const spaceId = Number(row.getDataValue("space_id"));
    const currentStatus = String(row.getDataValue("status") || "approved");
    await row.destroy();
    if (currentStatus === "approved") {
      await applyTreeCountDelta(spaceId, -1);
    }

    return res.status(204).end();
  },
);

router.patch(
  "/:id/approve",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const treeId = Number(req.params.id);
    if (!Number.isFinite(treeId)) {
      return res.status(400).json({ error: "Identificador de arbol invalido" });
    }

    const row = await TreeInventory.findByPk(treeId);
    if (!row) {
      return res.status(404).json({ error: "Arbol no encontrado" });
    }

    const previousStatus = String(row.getDataValue("status") || "approved");
    const spaceId = Number(row.getDataValue("space_id"));

    await row.update({
      status: "approved",
      validated_by_user_id: req.user.user_id,
      updated_at: new Date(),
    });

    if (previousStatus !== "approved") {
      await applyTreeCountDelta(spaceId, 1);
    }

    const withRelations = await TreeInventory.findByPk(treeId, {
      include: [
        { model: TreeType, attributes: ["type_id", "name"] },
        { model: GreenSpace, attributes: ["space_id", "name"] },
        {
          model: User,
          as: "SubmittedBy",
          attributes: ["user_id", "username", "name"],
        },
        {
          model: User,
          as: "ValidatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
    });

    return res.json(serializeTree((withRelations || row) as TreeInventory));
  },
);

router.patch(
  "/:id/reject",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const treeId = Number(req.params.id);
    if (!Number.isFinite(treeId)) {
      return res.status(400).json({ error: "Identificador de arbol invalido" });
    }

    const row = await TreeInventory.findByPk(treeId);
    if (!row) {
      return res.status(404).json({ error: "Arbol no encontrado" });
    }

    const previousStatus = String(row.getDataValue("status") || "approved");
    const spaceId = Number(row.getDataValue("space_id"));

    await row.update({
      status: "rejected",
      validated_by_user_id: req.user.user_id,
      updated_at: new Date(),
    });

    if (previousStatus === "approved") {
      await applyTreeCountDelta(spaceId, -1);
    }

    const withRelations = await TreeInventory.findByPk(treeId, {
      include: [
        { model: TreeType, attributes: ["type_id", "name"] },
        { model: GreenSpace, attributes: ["space_id", "name"] },
        {
          model: User,
          as: "SubmittedBy",
          attributes: ["user_id", "username", "name"],
        },
        {
          model: User,
          as: "ValidatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
    });

    return res.json(serializeTree((withRelations || row) as TreeInventory));
  },
);

export default router;
