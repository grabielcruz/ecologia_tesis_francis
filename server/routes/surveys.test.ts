import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import surveyRoutes from "./surveys";
import { Survey, SurveyResponse, User } from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  Survey: {
    findAll: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
  },
  SurveyResponse: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
  },
  User: {},
}));

const app = express();
app.use(express.json());
app.use("/api/surveys", surveyRoutes);

const makeSurveyRow = ({
  id = 1,
  type = "yesno",
  active = true,
}: {
  id?: number;
  type?: "yesno" | "scale";
  active?: boolean;
} = {}) => {
  const values: Record<string, unknown> = {
    survey_id: id,
    title: "Encuesta de prueba",
    description: "Descripcion",
    type,
    active,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
    destroy: vi.fn(async () => null),
  };
};

const makeResponseRow = ({
  surveyId = 1,
  userId = 2,
  answer = "yes",
}: {
  surveyId?: number;
  userId?: number;
  answer?: string;
} = {}) => {
  const values: Record<string, unknown> = {
    survey_response_id: 1,
    survey_id: surveyId,
    user_id: userId,
    answer,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    get: vi.fn((key: string) => {
      if (key === "User") {
        return {
          getDataValue: (nestedKey: string) => {
            if (nestedKey === "username") return "regular.user";
            if (nestedKey === "user_id") return userId;
            return undefined;
          },
        } as User;
      }
      return undefined;
    }),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
  };
};

describe("survey routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Survey.count).mockResolvedValue(1 as never);
    vi.mocked(Survey.findAll).mockResolvedValue([makeSurveyRow()] as never);
    vi.mocked(SurveyResponse.findAll).mockResolvedValue([makeResponseRow()] as never);
    vi.mocked(Survey.findByPk).mockResolvedValue(makeSurveyRow() as never);
  });

  it("hides poll results when viewer has not answered", async () => {
    const response = await request(app).get("/api/surveys?active=true");

    expect(response.status).toBe(200);
    expect(response.body.surveys).toHaveLength(1);
    expect(response.body.surveys[0].summary).toBeUndefined();
    expect(response.body.surveys[0].responses).toEqual([]);
  });

  it("returns poll results for answered regular users", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);

    const response = await request(app)
      .get("/api/surveys?active=true")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.surveys[0].summary.totalResponses).toBe(1);
    expect(response.body.surveys[0].responses).toHaveLength(1);
  });

  it("rejects survey creation for regular users", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);

    const response = await request(app)
      .post("/api/surveys")
      .set("Authorization", "Bearer token")
      .send({
        title: "Nueva encuesta",
        description: "Descripción",
        type: "yesno",
        active: true,
      });

    expect(response.status).toBe(403);
    expect(Survey.create).not.toHaveBeenCalled();
  });

  it("rejects responses on closed surveys", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);
    vi.mocked(Survey.findByPk).mockResolvedValue(
      makeSurveyRow({ active: false }) as never,
    );

    const response = await request(app)
      .post("/api/surveys/1/responses")
      .set("Authorization", "Bearer token")
      .send({ answer: "yes" });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("cerrada");
  });

  it("creates or updates a survey response", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);
    vi.mocked(SurveyResponse.findOne).mockResolvedValue(null as never);

    const response = await request(app)
      .post("/api/surveys/1/responses")
      .set("Authorization", "Bearer token")
      .send({ answer: "yes" });

    expect(response.status).toBe(201);
    expect(SurveyResponse.create).toHaveBeenCalledTimes(1);
  });
});
