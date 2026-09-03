import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import suggestionsRoutes from "./suggestions";
import { GreenSpace, ReportOfGreenArea } from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  GreenSpace: {
    findByPk: vi.fn(),
  },
  ReportOfGreenArea: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  User: {},
}));

const app = express();
app.use(express.json());
app.use("/api/suggestions", suggestionsRoutes);

const makeReportRow = (overrides?: Record<string, unknown>) => {
  const values: Record<string, unknown> = {
    report_of_green_area_id: 11,
    title: "Ramas en sendero",
    description: "Hay ramas bloqueando el paso",
    url_images: JSON.stringify(["/uploads/reports/a.jpg"]),
    state: "open",
    user_id: 3,
    space_id: 10,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T01:00:00.000Z",
    ...overrides,
  };

  return {
    getDataValue: (key: string) => values[key],
    get: (key: string) => {
      if (key === "User") {
        return {
          getDataValue: (field: string) => {
            if (field === "user_id") return values.user_id;
            if (field === "username") return "regular.user";
            if (field === "name") return "Regular User";
            return undefined;
          },
        };
      }
      if (key === "GreenSpace") {
        return {
          getDataValue: (field: string) => {
            if (field === "space_id") return values.space_id;
            if (field === "name") return "Jardín Central";
            return undefined;
          },
        };
      }
      return undefined;
    },
    update: vi.fn(async () => null),
    destroy: vi.fn(async () => null),
  };
};

describe("suggestions routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jwt.verify).mockReturnValue({ user_id: 3, role: "regular" } as never);
    vi.mocked(ReportOfGreenArea.findAll).mockResolvedValue([] as never);
  });

  it("defaults to open reports on list", async () => {
    vi.mocked(ReportOfGreenArea.findAll).mockResolvedValue([
      makeReportRow(),
    ] as never);

    const response = await request(app)
      .get("/api/suggestions")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(ReportOfGreenArea.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { state: "open" } }),
    );
  });

  it("returns a single report by id", async () => {
    vi.mocked(ReportOfGreenArea.findByPk).mockResolvedValue(
      makeReportRow({ report_of_green_area_id: 22 }) as never,
    );

    const response = await request(app)
      .get("/api/suggestions/22")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(22);
  });

  it("creates report for authenticated user", async () => {
    vi.mocked(GreenSpace.findByPk).mockResolvedValue({} as never);
    vi.mocked(ReportOfGreenArea.create).mockResolvedValue(
      makeReportRow() as never,
    );
    vi.mocked(ReportOfGreenArea.findByPk).mockResolvedValue(
      makeReportRow() as never,
    );

    const response = await request(app)
      .post("/api/suggestions")
      .set("Authorization", "Bearer token")
      .send({
        title: "Ramas",
        description: "Retirar ramas secas",
        spaceId: 10,
        images: ["/uploads/reports/a.jpg"],
      });

    expect(response.status).toBe(201);
    expect(response.body.state).toBe("open");
    expect(ReportOfGreenArea.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 3, state: "open", space_id: 10 }),
    );
  });

  it("prevents edition by non-creator", async () => {
    vi.mocked(jwt.verify).mockReturnValue({ user_id: 9, role: "regular" } as never);
    vi.mocked(ReportOfGreenArea.findByPk).mockResolvedValue(
      makeReportRow({ user_id: 3, state: "open" }) as never,
    );

    const response = await request(app)
      .put("/api/suggestions/11")
      .set("Authorization", "Bearer token")
      .send({ title: "Nuevo", description: "Texto", images: [] });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: "Solo el creador puede editar este reporte",
    });
  });

  it("prevents edition when report is closed", async () => {
    vi.mocked(ReportOfGreenArea.findByPk).mockResolvedValue(
      makeReportRow({ user_id: 3, state: "closed" }) as never,
    );

    const response = await request(app)
      .put("/api/suggestions/11")
      .set("Authorization", "Bearer token")
      .send({ title: "Nuevo", description: "Texto", images: [] });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: "Solo se pueden editar reportes abiertos",
    });
  });

  it("allows admin to mark report as completed", async () => {
    vi.mocked(jwt.verify).mockReturnValue({ user_id: 1, role: "admin" } as never);

    const openReport = makeReportRow({ state: "open" });
    vi.mocked(ReportOfGreenArea.findByPk)
      .mockResolvedValueOnce(openReport as never)
      .mockResolvedValueOnce(makeReportRow({ state: "closed" }) as never);

    const response = await request(app)
      .patch("/api/suggestions/11/complete")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.state).toBe("closed");
    expect(openReport.update).toHaveBeenCalledWith(
      expect.objectContaining({ state: "closed" }),
    );
  });

  it("prevents non-admin from marking report as completed", async () => {
    vi.mocked(jwt.verify).mockReturnValue({ user_id: 3, role: "regular" } as never);

    const response = await request(app)
      .patch("/api/suggestions/11/complete")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Solo administradores" });
  });

  it("allows deletion only for admin and closed reports", async () => {
    vi.mocked(jwt.verify).mockReturnValue({ user_id: 1, role: "admin" } as never);

    const openReport = makeReportRow({ state: "open" });
    vi.mocked(ReportOfGreenArea.findByPk).mockResolvedValue(openReport as never);

    const openDelete = await request(app)
      .delete("/api/suggestions/11")
      .set("Authorization", "Bearer token");

    expect(openDelete.status).toBe(409);
    expect(openDelete.body).toEqual({
      error: "Solo se pueden eliminar reportes cerrados",
    });

    const closedReport = makeReportRow({ state: "closed" });
    vi.mocked(ReportOfGreenArea.findByPk).mockResolvedValue(closedReport as never);

    const closedDelete = await request(app)
      .delete("/api/suggestions/11")
      .set("Authorization", "Bearer token");

    expect(closedDelete.status).toBe(204);
    expect(closedReport.destroy).toHaveBeenCalled();
  });
});
