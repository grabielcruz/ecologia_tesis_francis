import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import treeTypeRoutes from "./treeTypes";
import { TreeInventory, TreeType } from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  TreeType: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  TreeInventory: {
    count: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/tree-types", treeTypeRoutes);

const makeTreeTypeRow = (id = 5, name = "Araguaney") => {
  const values: Record<string, unknown> = {
    type_id: id,
    name,
    description: "Arbol de referencia",
    reference_images: JSON.stringify(["/uploads/tree-types/a.jpg"]),
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

describe("tree type routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);
    vi.mocked(TreeType.findAll).mockResolvedValue([] as never);
  });

  it("returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/tree-types");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token no proporcionado" });
  });

  it("returns tree type list for authenticated users", async () => {
    vi.mocked(TreeType.findAll).mockResolvedValue([makeTreeTypeRow()] as never);

    const response = await request(app)
      .get("/api/tree-types")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 5,
      name: "Araguaney",
    });
  });

  it("blocks regular users from creating official tree types", async () => {
    const response = await request(app)
      .post("/api/tree-types")
      .set("Authorization", "Bearer any-token")
      .send({
        name: "Naranjo",
        description: "Arbol frutal",
        referenceImages: ["https://example.com/tree.jpg"],
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Solo administradores" });
  });

  it("allows admin users to create tree types", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    vi.mocked(TreeType.findAll).mockResolvedValue([] as never);
    vi.mocked(TreeType.create).mockResolvedValue(
      makeTreeTypeRow(9, "Ceiba") as never,
    );

    const response = await request(app)
      .post("/api/tree-types")
      .set("Authorization", "Bearer any-token")
      .send({
        name: "Ceiba",
        description: "Arbol de gran altura",
        referenceImages: ["https://example.com/ceiba.jpg"],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 9, name: "Ceiba" });
  });

  it("prevents deleting tree type referenced by inventory trees", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    vi.mocked(TreeType.findByPk).mockResolvedValue(makeTreeTypeRow(3) as never);
    vi.mocked(TreeInventory.count).mockResolvedValue(2 as never);

    const response = await request(app)
      .delete("/api/tree-types/3")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("No se puede eliminar");
  });
});
