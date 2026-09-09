import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { GreenMetricQuarterlyRecord, User } from "../models";

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
    return res.status(401).json({ error: "Token invalido" });
  }
};

const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
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
    return res.status(401).json({ error: "Token invalido" });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }
  next();
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

const computeMetrics = (payload: {
  totalCampusAreaM2: number;
  greenAreaM2: number;
  campusPopulation: number;
  denseVegetationAreaM2: number;
  rainwaterAbsorptionAreaM2: number;
  sustainabilityBudget: number;
  conservationOperationBudget: number;
}) => {
  const toPercent = (numerator: number, denominator: number) =>
    denominator > 0 ? (numerator / denominator) * 100 : 0;

  const totalBudget =
    payload.sustainabilityBudget + payload.conservationOperationBudget;

  return {
    metric1GreenAreaRatio: toPercent(
      payload.greenAreaM2,
      payload.totalCampusAreaM2,
    ),
    metric2GreenAreaPerCapita:
      payload.campusPopulation > 0
        ? payload.greenAreaM2 / payload.campusPopulation
        : 0,
    metric3DenseVegetationRatio: toPercent(
      payload.denseVegetationAreaM2,
      payload.totalCampusAreaM2,
    ),
    metric4RainwaterAbsorptionRatio: toPercent(
      payload.rainwaterAbsorptionAreaM2,
      payload.totalCampusAreaM2,
    ),
    metric5SustainabilityBudgetShare: toPercent(
      payload.sustainabilityBudget,
      totalBudget,
    ),
    metric6ConservationOperationShare: toPercent(
      payload.conservationOperationBudget,
      totalBudget,
    ),
  };
};

const resolveQuarterPeriod = (year: number, quarter: number) => {
  const startMonthIndex = (quarter - 1) * 3;
  const periodStart = new Date(Date.UTC(year, startMonthIndex, 1));
  const periodEnd = new Date(Date.UTC(year, startMonthIndex + 3, 0, 23, 59, 59));

  return {
    periodStart,
    periodEnd,
  };
};

const serializeRecord = (record: GreenMetricQuarterlyRecord) => {
  const createdBy = record.get("CreatedBy") as User | undefined;

  return {
    id: Number(record.getDataValue("record_id")),
    year: Number(record.getDataValue("year")),
    quarter: Number(record.getDataValue("quarter")),
    periodStart: toIsoStringOrNull(record.getDataValue("period_start")),
    periodEnd: toIsoStringOrNull(record.getDataValue("period_end")),
    totalCampusAreaM2: Number(record.getDataValue("total_campus_area_m2")) || 0,
    greenAreaM2: Number(record.getDataValue("green_area_m2")) || 0,
    campusPopulation: Number(record.getDataValue("campus_population")) || 0,
    denseVegetationAreaM2:
      Number(record.getDataValue("dense_vegetation_area_m2")) || 0,
    rainwaterAbsorptionAreaM2:
      Number(record.getDataValue("rainwater_absorption_area_m2")) || 0,
    sustainabilityBudget: Number(record.getDataValue("sustainability_budget")) || 0,
    conservationOperationBudget:
      Number(record.getDataValue("conservation_operation_budget")) || 0,
    metrics: {
      metric1GreenAreaRatio:
        Number(record.getDataValue("metric_1_green_area_ratio")) || 0,
      metric2GreenAreaPerCapita:
        Number(record.getDataValue("metric_2_green_area_per_capita")) || 0,
      metric3DenseVegetationRatio:
        Number(record.getDataValue("metric_3_dense_vegetation_ratio")) || 0,
      metric4RainwaterAbsorptionRatio:
        Number(record.getDataValue("metric_4_rainwater_absorption_ratio")) || 0,
      metric5SustainabilityBudgetShare:
        Number(record.getDataValue("metric_5_sustainability_budget_share")) || 0,
      metric6ConservationOperationShare:
        Number(record.getDataValue("metric_6_conservation_operation_share")) || 0,
    },
    createdBy: createdBy
      ? {
          id: Number(createdBy.getDataValue("user_id")),
          username: String(createdBy.getDataValue("username") || ""),
          name: String(createdBy.getDataValue("name") || ""),
        }
      : null,
    createdAt: toIsoStringOrNull(record.getDataValue("created_at")),
    updatedAt: toIsoStringOrNull(record.getDataValue("updated_at")),
  };
};

router.get("/", optionalAuthenticate, async (_req: AuthRequest, res: Response) => {
  const rows = await GreenMetricQuarterlyRecord.findAll({
    include: [{ model: User, as: "CreatedBy", attributes: ["user_id", "username", "name"] }],
    order: [
      ["year", "DESC"],
      ["quarter", "DESC"],
      ["record_id", "DESC"],
    ],
  });

  return res.json(rows.map((row) => serializeRecord(row as GreenMetricQuarterlyRecord)));
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const year = Math.trunc(toNumber(req.body?.year));
  const quarter = Math.trunc(toNumber(req.body?.quarter));

  if (year < 2000 || year > 2200) {
    return res.status(400).json({ error: "Ano invalido" });
  }

  if (![1, 2, 3, 4].includes(quarter)) {
    return res.status(400).json({ error: "Trimestre invalido" });
  }

  const payload = {
    totalCampusAreaM2: Math.max(0, toNumber(req.body?.totalCampusAreaM2)),
    greenAreaM2: Math.max(0, toNumber(req.body?.greenAreaM2)),
    campusPopulation: Math.max(0, Math.trunc(toNumber(req.body?.campusPopulation))),
    denseVegetationAreaM2: Math.max(0, toNumber(req.body?.denseVegetationAreaM2)),
    rainwaterAbsorptionAreaM2: Math.max(
      0,
      toNumber(req.body?.rainwaterAbsorptionAreaM2),
    ),
    sustainabilityBudget: Math.max(0, toNumber(req.body?.sustainabilityBudget)),
    conservationOperationBudget: Math.max(
      0,
      toNumber(req.body?.conservationOperationBudget),
    ),
  };

  const { periodStart, periodEnd } = resolveQuarterPeriod(year, quarter);
  const metrics = computeMetrics(payload);

  const upsertPayload = {
    year,
    quarter,
    period_start: periodStart,
    period_end: periodEnd,
    total_campus_area_m2: payload.totalCampusAreaM2,
    green_area_m2: payload.greenAreaM2,
    campus_population: payload.campusPopulation,
    dense_vegetation_area_m2: payload.denseVegetationAreaM2,
    rainwater_absorption_area_m2: payload.rainwaterAbsorptionAreaM2,
    sustainability_budget: payload.sustainabilityBudget,
    conservation_operation_budget: payload.conservationOperationBudget,
    metric_1_green_area_ratio: metrics.metric1GreenAreaRatio,
    metric_2_green_area_per_capita: metrics.metric2GreenAreaPerCapita,
    metric_3_dense_vegetation_ratio: metrics.metric3DenseVegetationRatio,
    metric_4_rainwater_absorption_ratio: metrics.metric4RainwaterAbsorptionRatio,
    metric_5_sustainability_budget_share: metrics.metric5SustainabilityBudgetShare,
    metric_6_conservation_operation_share: metrics.metric6ConservationOperationShare,
    created_by_user_id: req.user!.user_id,
    updated_at: new Date(),
  };

  const existing = await GreenMetricQuarterlyRecord.findOne({
    where: { year, quarter },
  });

  if (existing) {
    await existing.update(upsertPayload);
    const updated = await GreenMetricQuarterlyRecord.findByPk(
      existing.getDataValue("record_id"),
      {
        include: [
          {
            model: User,
            as: "CreatedBy",
            attributes: ["user_id", "username", "name"],
          },
        ],
      },
    );

    return res.json(
      serializeRecord(
        (updated as GreenMetricQuarterlyRecord | null) ||
          (existing as GreenMetricQuarterlyRecord),
      ),
    );
  }

  const created = await GreenMetricQuarterlyRecord.create({
    ...upsertPayload,
    created_at: new Date(),
  });

  const createdWithRelations = await GreenMetricQuarterlyRecord.findByPk(
    created.getDataValue("record_id"),
    {
      include: [
        {
          model: User,
          as: "CreatedBy",
          attributes: ["user_id", "username", "name"],
        },
      ],
    },
  );

  return res.status(201).json(
    serializeRecord(
      (createdWithRelations as GreenMetricQuarterlyRecord | null) ||
        (created as GreenMetricQuarterlyRecord),
    ),
  );
});

export default router;
