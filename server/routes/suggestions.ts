import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { GreenSpace, ReportOfGreenArea, User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const reportsUploadsDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "reports",
);

if (!fs.existsSync(reportsUploadsDir)) {
  fs.mkdirSync(reportsUploadsDir, { recursive: true });
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

const uploadReportImages = multer({
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

const normalizeState = (value: unknown): "open" | "closed" => {
  const state = String(value || "open").trim().toLowerCase();
  return state === "closed" || state === "close" ? "closed" : "open";
};

const serializeReport = (report: ReportOfGreenArea) => {
  const creator = report.get("User") as User | undefined;
  const space = report.get("GreenSpace") as GreenSpace | undefined;

  return {
    id: report.getDataValue("report_of_green_area_id"),
    title: String(report.getDataValue("title") || ""),
    description: String(report.getDataValue("description") || ""),
    images: parseStringArray(report.getDataValue("url_images")),
    state: normalizeState(report.getDataValue("state")),
    userId: report.getDataValue("user_id"),
    spaceId: report.getDataValue("space_id"),
    createdBy: creator
      ? {
          id: creator.getDataValue("user_id"),
          username: String(creator.getDataValue("username") || ""),
          name: String(creator.getDataValue("name") || ""),
        }
      : null,
    spaceName: space ? String(space.getDataValue("name") || "") : "",
    createdAt: toIsoStringOrNull(report.getDataValue("created_at")),
    updatedAt: toIsoStringOrNull(report.getDataValue("updated_at")),
  };
};

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const requestedState = String(req.query.state || "open").toLowerCase();
  const whereClause: Record<string, unknown> = {};
  if (requestedState === "open" || requestedState === "closed") {
    whereClause.state = requestedState;
  }

  const reports = await ReportOfGreenArea.findAll({
    where: whereClause,
    include: [
      { model: User, attributes: ["user_id", "username", "name"] },
      { model: GreenSpace, attributes: ["space_id", "name"] },
    ],
    order: [
      ["updated_at", "DESC"],
      ["report_of_green_area_id", "DESC"],
    ],
  });

  return res.json(reports.map((report) => serializeReport(report as ReportOfGreenArea)));
});

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const reportId = Number(req.params.id);
  if (!Number.isFinite(reportId)) {
    return res.status(400).json({ error: "Identificador de reporte invalido" });
  }

  const report = await ReportOfGreenArea.findByPk(reportId, {
    include: [
      { model: User, attributes: ["user_id", "username", "name"] },
      { model: GreenSpace, attributes: ["space_id", "name"] },
    ],
  });

  if (!report) {
    return res.status(404).json({ error: "Reporte no encontrado" });
  }

  return res.json(serializeReport(report as ReportOfGreenArea));
});

router.post(
  "/images",
  authenticate,
  uploadReportImages.array("images", 10),
  async (req: AuthRequest, res: Response) => {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      return res.status(400).json({ error: "No se recibieron imagenes" });
    }

    try {
      const savedUrls: string[] = [];

      for (const [index, file] of files.entries()) {
        const filename = `report-${Date.now()}-${index}.jpg`;
        const outputPath = path.join(reportsUploadsDir, filename);

        await sharp(file.buffer)
          .resize(1800, 1400, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 84 })
          .toFile(outputPath);

        savedUrls.push(`/uploads/reports/${filename}`);
      }

      return res.status(201).json({ images: savedUrls });
    } catch {
      return res.status(500).json({ error: "No se pudieron subir las imagenes" });
    }
  },
);

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const spaceId = Number(req.body?.spaceId);
  const images = parseStringArray(req.body?.images || []);

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Titulo y descripcion son obligatorios" });
  }

  if (!Number.isFinite(spaceId) || spaceId <= 0) {
    return res.status(400).json({ error: "Area verde invalida" });
  }

  const space = await GreenSpace.findByPk(spaceId);
  if (!space) {
    return res.status(404).json({ error: "Area verde no encontrada" });
  }

  const created = await ReportOfGreenArea.create({
    title,
    description,
    url_images: JSON.stringify(images),
    state: "open",
    user_id: req.user.user_id,
    space_id: spaceId,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const createdWithRelations = await ReportOfGreenArea.findByPk(
    created.getDataValue("report_of_green_area_id"),
    {
      include: [
        { model: User, attributes: ["user_id", "username", "name"] },
        { model: GreenSpace, attributes: ["space_id", "name"] },
      ],
    },
  );

  return res.status(201).json(
    serializeReport(
      (createdWithRelations as ReportOfGreenArea | null) ||
        (created as ReportOfGreenArea),
    ),
  );
});

router.put("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const reportId = Number(req.params.id);
  if (!Number.isFinite(reportId)) {
    return res.status(400).json({ error: "Identificador de reporte invalido" });
  }

  const report = await ReportOfGreenArea.findByPk(reportId);
  if (!report) {
    return res.status(404).json({ error: "Reporte no encontrado" });
  }

  const currentState = normalizeState(report.getDataValue("state"));
  if (currentState !== "open") {
    return res.status(409).json({ error: "Solo se pueden editar reportes abiertos" });
  }

  if (Number(report.getDataValue("user_id")) !== req.user.user_id) {
    return res.status(403).json({ error: "Solo el creador puede editar este reporte" });
  }

  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const nextState = normalizeState(req.body?.state);
  const images = parseStringArray(req.body?.images || []);

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Titulo y descripcion son obligatorios" });
  }

  await report.update({
    title,
    description,
    state: nextState,
    url_images: JSON.stringify(images),
    updated_at: new Date(),
  });

  const updated = await ReportOfGreenArea.findByPk(reportId, {
    include: [
      { model: User, attributes: ["user_id", "username", "name"] },
      { model: GreenSpace, attributes: ["space_id", "name"] },
    ],
  });

  return res.json(
    serializeReport((updated as ReportOfGreenArea | null) || (report as ReportOfGreenArea)),
  );
});

router.patch(
  "/:id/complete",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Solo administradores" });
    }

    const reportId = Number(req.params.id);
    if (!Number.isFinite(reportId)) {
      return res
        .status(400)
        .json({ error: "Identificador de reporte invalido" });
    }

    const report = await ReportOfGreenArea.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }

    const currentState = normalizeState(report.getDataValue("state"));
    if (currentState === "closed") {
      return res.status(409).json({ error: "El reporte ya esta cerrado" });
    }

    await report.update({
      state: "closed",
      updated_at: new Date(),
    });

    const updated = await ReportOfGreenArea.findByPk(reportId, {
      include: [
        { model: User, attributes: ["user_id", "username", "name"] },
        { model: GreenSpace, attributes: ["space_id", "name"] },
      ],
    });

    return res.json(
      serializeReport(
        (updated as ReportOfGreenArea | null) || (report as ReportOfGreenArea),
      ),
    );
  },
);

router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }

  const reportId = Number(req.params.id);
  if (!Number.isFinite(reportId)) {
    return res.status(400).json({ error: "Identificador de reporte invalido" });
  }

  const report = await ReportOfGreenArea.findByPk(reportId);
  if (!report) {
    return res.status(404).json({ error: "Reporte no encontrado" });
  }

  const currentState = normalizeState(report.getDataValue("state"));
  if (currentState !== "closed") {
    return res
      .status(409)
      .json({ error: "Solo se pueden eliminar reportes cerrados" });
  }

  await report.destroy();
  return res.status(204).end();
});

export default router;
