import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import { Event, EventEnrollment, User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const eventUploadsDir = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "events",
);

if (!fs.existsSync(eventUploadsDir)) {
  fs.mkdirSync(eventUploadsDir, { recursive: true });
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
    return res.status(401).json({ error: "Token inválido" });
  }
};

const optionalAuthenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      user_id: number;
      role: string;
    };
    req.user = payload;
    return next();
  } catch {
    req.user = undefined;
    return next();
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  next();
};

const requireRegular = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user || req.user.role !== "regular") {
    return res.status(403).json({ error: "Solo usuarios regulares" });
  }
  next();
};

const uploadEventImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten imágenes") as any, false);
    }
    cb(null, true);
  },
});

const toIsoStringOrNull = (value: unknown) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

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

const serializeEvent = (
  event: Event,
  enrollmentCount: number,
  isEnrolled: boolean,
) => {
  const creator = event.get("CreatedBy") as User | undefined;

  return {
    id: Number(event.getDataValue("event_id")),
    title: String(event.getDataValue("title") || ""),
    description: String(event.getDataValue("description") || ""),
    status: String(event.getDataValue("status") || "open") as "open" | "closed",
    closureDescription:
      String(event.getDataValue("closure_description") || "") || null,
    closureImages: parseStringArray(event.getDataValue("closure_images")),
    enrollmentCount,
    isEnrolled,
    createdByUserId: Number(event.getDataValue("created_by_user_id")),
    createdBy: creator
      ? {
          id: Number(creator.getDataValue("user_id")),
          username: String(creator.getDataValue("username") || ""),
          name: String(creator.getDataValue("name") || ""),
        }
      : null,
    createdAt: toIsoStringOrNull(event.getDataValue("created_at")),
    updatedAt: toIsoStringOrNull(event.getDataValue("updated_at")),
  };
};

const serializeEnrollment = (enrollment: EventEnrollment) => {
  const participant = enrollment.get("Participant") as User | undefined;

  return {
    id: participant ? Number(participant.getDataValue("user_id")) : 0,
    username: participant
      ? String(participant.getDataValue("username") || "")
      : "",
    name: participant ? String(participant.getDataValue("name") || "") : "",
    enrolledAt: toIsoStringOrNull(enrollment.getDataValue("created_at")),
  };
};

router.post(
  "/images",
  authenticate,
  requireAdmin,
  uploadEventImages.array("images", 10),
  async (_req: AuthRequest, res: Response) => {
    const files = (_req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      return res.status(400).json({ error: "No se recibieron imágenes" });
    }

    try {
      const savedUrls: string[] = [];

      for (const [index, file] of files.entries()) {
        const filename = `event-${Date.now()}-${index}.jpg`;
        const outputPath = path.join(eventUploadsDir, filename);

        await sharp(file.buffer)
          .resize(1800, 1400, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 84 })
          .toFile(outputPath);

        savedUrls.push(`/uploads/events/${filename}`);
      }

      return res.status(201).json({ images: savedUrls });
    } catch {
      return res
        .status(500)
        .json({ error: "No se pudieron subir las imágenes" });
    }
  },
);

router.get(
  "/",
  optionalAuthenticate,
  async (req: AuthRequest, res: Response) => {
    const rows = await Event.findAll({
      include: [
        {
          model: User,
          as: "CreatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
      order: [
        ["updated_at", "DESC"],
        ["event_id", "DESC"],
      ],
    });

    const currentUserId = req.user?.user_id;

    const serialized = await Promise.all(
      rows.map(async (event) => {
        const eventId = Number(event.getDataValue("event_id"));
        const enrollmentCount = await EventEnrollment.count({
          where: { event_id: eventId },
        });

        let isEnrolled = false;
        if (currentUserId) {
          const myEnrollment = await EventEnrollment.findOne({
            where: {
              event_id: eventId,
              user_id: currentUserId,
            },
          });
          isEnrolled = Boolean(myEnrollment);
        }

        return serializeEvent(event as Event, enrollmentCount, isEnrolled);
      }),
    );

    return res.json(serialized);
  },
);

router.get(
  "/:id",
  optionalAuthenticate,
  async (req: AuthRequest, res: Response) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "Evento inválido" });
    }

    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: User,
          as: "CreatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const currentUserId = req.user?.user_id;
    const enrollmentCount = await EventEnrollment.count({
      where: { event_id: eventId },
    });

    let isEnrolled = false;
    if (currentUserId) {
      const myEnrollment = await EventEnrollment.findOne({
        where: {
          event_id: eventId,
          user_id: currentUserId,
        },
      });
      isEnrolled = Boolean(myEnrollment);
    }

    let participants: Array<{
      id: number;
      username: string;
      name: string;
      enrolledAt: string | null;
    }> | null = null;

    if (req.user?.role === "admin") {
      const enrollmentRows = await EventEnrollment.findAll({
        where: { event_id: eventId },
        include: [
          {
            model: User,
            as: "Participant",
            attributes: ["user_id", "username", "name"],
          },
        ],
        order: [["created_at", "ASC"]],
      });

      participants = enrollmentRows
        .map((entry) => serializeEnrollment(entry as EventEnrollment))
        .filter((entry) => entry.id > 0);
    }

    return res.json({
      ...serializeEvent(event as Event, enrollmentCount, isEnrolled),
      participants,
    });
  },
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!title || !description) {
      return res.status(400).json({
        error: "Debes completar título y descripción del evento",
      });
    }

    const created = await Event.create({
      title,
      description,
      status: "open",
      closure_description: null,
      closure_images: "[]",
      created_by_user_id: req.user!.user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(201).json(serializeEvent(created as Event, 0, false));
  },
);

router.post(
  "/:id/enroll",
  authenticate,
  requireRegular,
  async (req: AuthRequest, res: Response) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "Evento inválido" });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (String(event.getDataValue("status")) !== "open") {
      return res.status(409).json({
        error: "Solo puedes inscribirte en eventos abiertos",
      });
    }

    const existing = await EventEnrollment.findOne({
      where: {
        event_id: eventId,
        user_id: req.user!.user_id,
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "Ya estás inscrito en este evento" });
    }

    await EventEnrollment.create({
      event_id: eventId,
      user_id: req.user!.user_id,
      created_at: new Date(),
    });

    const enrollmentCount = await EventEnrollment.count({
      where: { event_id: eventId },
    });

    return res.status(201).json({
      ok: true,
      eventId,
      enrollmentCount,
    });
  },
);

router.delete(
  "/:id/enroll",
  authenticate,
  requireRegular,
  async (req: AuthRequest, res: Response) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "Evento inválido" });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (String(event.getDataValue("status")) !== "open") {
      return res.status(409).json({
        error: "No puedes cancelar inscripción en eventos cerrados",
      });
    }

    const enrollment = await EventEnrollment.findOne({
      where: {
        event_id: eventId,
        user_id: req.user!.user_id,
      },
    });

    if (!enrollment) {
      return res
        .status(404)
        .json({ error: "No estabas inscrito en este evento" });
    }

    await enrollment.destroy();

    const enrollmentCount = await EventEnrollment.count({
      where: { event_id: eventId },
    });

    return res.json({
      ok: true,
      eventId,
      enrollmentCount,
    });
  },
);

router.patch(
  "/:id/close",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "Evento inválido" });
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (String(event.getDataValue("status")) === "closed") {
      return res.status(409).json({ error: "El evento ya está cerrado" });
    }

    const closureDescription = String(
      req.body?.closureDescription || "",
    ).trim();
    const closureImages = Array.isArray(req.body?.closureImages)
      ? req.body.closureImages
          .filter(
            (entry: unknown): entry is string => typeof entry === "string",
          )
          .map((entry: string) => entry.trim())
          .filter((entry: string) => entry.length > 0)
      : [];

    if (!closureDescription) {
      return res.status(400).json({
        error: "Debes registrar una descripción de cierre",
      });
    }

    await event.update({
      status: "closed",
      closure_description: closureDescription,
      closure_images: JSON.stringify(closureImages),
      updated_at: new Date(),
    });

    const enrollmentCount = await EventEnrollment.count({
      where: { event_id: eventId },
    });

    return res.json(serializeEvent(event as Event, enrollmentCount, false));
  },
);

export default router;
