import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { Survey, SurveyResponse, User } from "../models";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

type SurveyType = "yesno" | "scale";

const SCALE_ANSWERS = [
  "too_bad",
  "bad",
  "regular",
  "good",
  "excellent",
] as const;

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

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
  } catch {
    req.user = undefined;
  }

  return next();
};

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
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  return next();
};

const toIsoStringOrNull = (value: unknown) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const isSurveyType = (value: string): value is SurveyType =>
  value === "yesno" || value === "scale";

const parseSurveyAnswer = (type: SurveyType, rawAnswer: unknown) => {
  const answer = String(rawAnswer || "")
    .trim()
    .toLowerCase();

  if (type === "yesno") {
    return answer === "yes" || answer === "no" ? answer : null;
  }

  return SCALE_ANSWERS.includes(answer as (typeof SCALE_ANSWERS)[number])
    ? answer
    : null;
};

const serializeSurvey = (
  survey: Survey,
  surveyResponses: SurveyResponse[],
  viewerUserId: number | null,
  viewerRole: string | null,
) => {
  const surveyId = Number(survey.getDataValue("survey_id"));
  const surveyType = String(survey.getDataValue("type") || "yesno");
  const type: SurveyType = surveyType === "scale" ? "scale" : "yesno";
  const responseRows = surveyResponses.filter(
    (response) => Number(response.getDataValue("survey_id")) === surveyId,
  );

  const currentUserResponse = viewerUserId
    ? responseRows.find(
        (response) => Number(response.getDataValue("user_id")) === viewerUserId,
      )
    : null;
  const canViewResults =
    viewerRole === "admin" || Boolean(currentUserResponse);

  const yesCount = responseRows.filter(
    (response) => String(response.getDataValue("answer") || "") === "yes",
  ).length;
  const noCount = responseRows.filter(
    (response) => String(response.getDataValue("answer") || "") === "no",
  ).length;
  const scaleCounts = SCALE_ANSWERS.reduce(
    (accumulator, answerKey) => ({
      ...accumulator,
      [answerKey]: responseRows.filter(
        (response) => String(response.getDataValue("answer") || "") === answerKey,
      ).length,
    }),
    {} as Record<string, number>,
  );

  return {
    id: surveyId,
    title: String(survey.getDataValue("title") || ""),
    description: String(survey.getDataValue("description") || ""),
    active: Boolean(survey.getDataValue("active")),
    type,
    summary: canViewResults
      ? {
          totalResponses: responseRows.length,
          yesCount: type === "yesno" ? yesCount : undefined,
          noCount: type === "yesno" ? noCount : undefined,
          scaleCounts: type === "scale" ? scaleCounts : undefined,
        }
      : undefined,
    responses: canViewResults
      ? responseRows.map((response) => {
          const responder = response.get("User") as User | undefined;
          return {
            username: String(responder?.getDataValue("username") || "usuario"),
            answer: String(response.getDataValue("answer") || ""),
            respondedAt: toIsoStringOrNull(response.getDataValue("updated_at")),
          };
        })
      : [],
    currentUserAnswer: currentUserResponse
      ? String(currentUserResponse.getDataValue("answer") || "")
      : null,
    updatedAt: toIsoStringOrNull(survey.getDataValue("updated_at")),
  };
};

router.get("/", optionalAuthenticate, async (req: AuthRequest, res: Response) => {
  const adminQueryEnabled = String(req.query.admin || "") === "true";
  if (adminQueryEnabled && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(1000, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  const searchTerm = String(req.query.search || "").trim();
  const sortQuery = String(req.query.sort || "desc").toLowerCase();
  const typeQuery = String(req.query.type || "").trim();
  const statusQuery = String(req.query.status || "").trim();
  const activeOnly = String(req.query.active || "").toLowerCase() === "true";

  const whereClause: Record<string | symbol, unknown> = {};

  if (activeOnly) {
    whereClause.active = true;
  }

  if (adminQueryEnabled) {
    if (typeQuery && isSurveyType(typeQuery)) {
      whereClause.type = typeQuery;
    }
    if (statusQuery === "active") {
      whereClause.active = true;
    } else if (statusQuery === "inactive") {
      whereClause.active = false;
    }
    if (searchTerm) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
      ];
    }
  }

  const [surveys, totalCount] = await Promise.all([
    Survey.findAll({
      where: whereClause,
      order: [["updated_at", sortQuery === "asc" ? "ASC" : "DESC"]],
      limit,
      offset,
    }),
    Survey.count({ where: whereClause }),
  ]);

  const surveyIds = surveys.map((survey) => Number(survey.getDataValue("survey_id")));
  const responses = surveyIds.length
    ? await SurveyResponse.findAll({
        where: { survey_id: surveyIds },
        include: [{ model: User, attributes: ["user_id", "username"] }],
        order: [["updated_at", "DESC"]],
      })
    : [];

  const serializedSurveys = surveys.map((survey) =>
    serializeSurvey(
      survey,
      responses as SurveyResponse[],
      req.user ? req.user.user_id : null,
      req.user ? req.user.role : null,
    ),
  );

  return res.json({
    surveys: serializedSurveys,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    total: totalCount,
  });
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const type = String(req.body?.type || "").trim().toLowerCase();
  const active =
    typeof req.body?.active === "boolean" ? req.body.active : Boolean(req.body?.active);

  if (!title) {
    return res.status(400).json({ error: "El título es obligatorio" });
  }
  if (!description) {
    return res.status(400).json({ error: "La descripción es obligatoria" });
  }
  if (!isSurveyType(type)) {
    return res.status(400).json({ error: "Tipo de encuesta inválido" });
  }

  const now = new Date();
  const created = await Survey.create({
    title,
    description,
    type,
    active,
    created_at: now,
    updated_at: now,
  });

  return res.status(201).json({
    id: Number(created.getDataValue("survey_id")),
    title,
    description,
    type,
    active,
    updatedAt: toIsoStringOrNull(created.getDataValue("updated_at")),
  });
});

router.put(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const surveyId = Number(req.params.id);
    if (!Number.isFinite(surveyId)) {
      return res.status(400).json({ error: "Identificador de encuesta inválido" });
    }

    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ error: "Encuesta no encontrada" });
    }

    const title =
      typeof req.body?.title === "undefined"
        ? String(survey.getDataValue("title") || "")
        : String(req.body.title || "").trim();
    const description =
      typeof req.body?.description === "undefined"
        ? String(survey.getDataValue("description") || "")
        : String(req.body.description || "").trim();

    if (!title) {
      return res.status(400).json({ error: "El título es obligatorio" });
    }
    if (!description) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    const updates: Record<string, unknown> = {
      title,
      description,
      updated_at: new Date(),
    };

    if (typeof req.body?.active !== "undefined") {
      updates.active = Boolean(req.body.active);
    }

    await survey.update(updates);

    return res.json({
      id: Number(survey.getDataValue("survey_id")),
      title: String(survey.getDataValue("title") || ""),
      description: String(survey.getDataValue("description") || ""),
      type: String(survey.getDataValue("type") || "yesno"),
      active: Boolean(survey.getDataValue("active")),
      updatedAt: toIsoStringOrNull(survey.getDataValue("updated_at")),
    });
  },
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    const surveyId = Number(req.params.id);
    if (!Number.isFinite(surveyId)) {
      return res.status(400).json({ error: "Identificador de encuesta inválido" });
    }

    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ error: "Encuesta no encontrada" });
    }

    await SurveyResponse.destroy({ where: { survey_id: surveyId } });
    await survey.destroy();
    return res.status(204).end();
  },
);

router.post(
  "/:id/responses",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const surveyId = Number(req.params.id);
    if (!Number.isFinite(surveyId)) {
      return res.status(400).json({ error: "Identificador de encuesta inválido" });
    }

    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ error: "Encuesta no encontrada" });
    }
    if (!Boolean(survey.getDataValue("active"))) {
      return res.status(400).json({ error: "La encuesta está cerrada" });
    }

    const type = String(survey.getDataValue("type") || "yesno") as SurveyType;
    const answer = parseSurveyAnswer(type, req.body?.answer);
    if (!answer) {
      return res.status(400).json({ error: "Respuesta inválida para esta encuesta" });
    }

    const existing = await SurveyResponse.findOne({
      where: {
        survey_id: surveyId,
        user_id: req.user.user_id,
      },
    });

    const now = new Date();
    if (existing) {
      await existing.update({
        answer,
        updated_at: now,
      });
    } else {
      await SurveyResponse.create({
        survey_id: surveyId,
        user_id: req.user.user_id,
        answer,
        created_at: now,
        updated_at: now,
      });
    }

    return res.status(201).json({ message: "Respuesta registrada correctamente" });
  },
);

export default router;
