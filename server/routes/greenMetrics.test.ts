import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import greenMetricsRoutes from "./greenMetrics";
import { GreenMetricQuarterlyRecord } from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  GreenMetricQuarterlyRecord: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  User: {},
}));

const app = express();
app.use(express.json());
app.use("/api/green-metrics", greenMetricsRoutes);

const makeRecordRow = (overrides?: Record<string, unknown>) => {
  const values: Record<string, unknown> = {
    record_id: 7,
    year: 2026,
    quarter: 2,
    period_start: "2026-04-01T00:00:00.000Z",
    period_end: "2026-06-30T23:59:59.000Z",
    total_campus_area_m2: 25000,
    green_area_m2: 8200,
    campus_population: 6100,
    dense_vegetation_area_m2: 4300,
    rainwater_absorption_area_m2: 5100,
    sustainability_budget: 140000,
    conservation_operation_budget: 70000,
    metric_1_green_area_ratio: 32.8,
    metric_2_green_area_per_capita: 1.344,
    metric_3_dense_vegetation_ratio: 17.2,
    metric_4_rainwater_absorption_ratio: 20.4,
    metric_5_sustainability_budget_share: 66.666,
    metric_6_conservation_operation_share: 33.333,
    created_by_user_id: 1,
    created_at: "2026-06-30T23:59:59.000Z",
    updated_at: "2026-06-30T23:59:59.000Z",
    ...overrides,
  };

  return {
    getDataValue: (key: string) => values[key],
    get: (key: string) => {
      if (key === "CreatedBy") {
        return {
          getDataValue: (field: string) => {
            if (field === "user_id") return 1;
            if (field === "username") return "admin";
            if (field === "name") return "Admin User";
            return undefined;
          },
        };
      }
      return undefined;
    },
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
  };
};

describe("green metrics routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);
    vi.mocked(GreenMetricQuarterlyRecord.findAll).mockResolvedValue([] as never);
  });

  it("lists quarterly records", async () => {
    vi.mocked(GreenMetricQuarterlyRecord.findAll).mockResolvedValue([
      makeRecordRow(),
    ] as never);

    const response = await request(app).get("/api/green-metrics");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      year: 2026,
      quarter: 2,
    });
  });

  it("blocks non-admin users from creating records", async () => {
    const response = await request(app)
      .post("/api/green-metrics")
      .set("Authorization", "Bearer any-token")
      .send({
        year: 2026,
        quarter: 2,
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Solo administradores" });
  });

  it("creates a quarterly record with computed metrics for admin", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    vi.mocked(GreenMetricQuarterlyRecord.findOne).mockResolvedValue(null as never);
    vi.mocked(GreenMetricQuarterlyRecord.create).mockResolvedValue(
      makeRecordRow() as never,
    );
    vi.mocked(GreenMetricQuarterlyRecord.findByPk).mockResolvedValue(
      makeRecordRow() as never,
    );

    const response = await request(app)
      .post("/api/green-metrics")
      .set("Authorization", "Bearer any-token")
      .send({
        year: 2026,
        quarter: 2,
        totalCampusAreaM2: 25000,
        greenAreaM2: 10000,
        campusPopulation: 5000,
        denseVegetationAreaM2: 3500,
        rainwaterAbsorptionAreaM2: 4500,
        sustainabilityBudget: 120000,
        conservationOperationBudget: 80000,
      });

    expect(response.status).toBe(201);
    expect(GreenMetricQuarterlyRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metric_1_green_area_ratio: 40,
        metric_2_green_area_per_capita: 2,
      }),
    );
  });

  it("updates existing quarter when record already exists", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const existing = makeRecordRow();
    vi.mocked(GreenMetricQuarterlyRecord.findOne).mockResolvedValue(
      existing as never,
    );
    vi.mocked(GreenMetricQuarterlyRecord.findByPk).mockResolvedValue(
      makeRecordRow() as never,
    );

    const response = await request(app)
      .post("/api/green-metrics")
      .set("Authorization", "Bearer any-token")
      .send({
        year: 2026,
        quarter: 2,
        totalCampusAreaM2: 25000,
        greenAreaM2: 9500,
        campusPopulation: 4800,
        denseVegetationAreaM2: 3200,
        rainwaterAbsorptionAreaM2: 4300,
        sustainabilityBudget: 110000,
        conservationOperationBudget: 70000,
      });

    expect(response.status).toBe(200);
    expect(existing.update).toHaveBeenCalled();
  });
});
