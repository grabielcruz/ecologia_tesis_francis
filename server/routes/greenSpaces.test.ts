import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import greenSpaceRoutes from "./greenSpaces";
import { GreenSpace } from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  GreenSpace: {
    findAll: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
  },
  GreenSpaceReview: {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
  User: {},
}));

const app = express();
app.use(express.json());
app.use("/api/green-spaces", greenSpaceRoutes);
const testAuthHeader = ["Bearer", "test-token"].join(" ");

const makeGreenSpaceRow = () => {
  const values = {
    space_id: 10,
    name: "Zona Verde",
    location: "Campus Norte",
    total_area_m2: 2500,
    trees_count: 40,
    images: JSON.stringify(["https://example.com/a.jpg"]),
    perimeter_points: JSON.stringify([
      { latitude: 10.06522, longitude: -69.32264 },
      { latitude: 10.06531, longitude: -69.3221 },
      { latitude: 10.0649, longitude: -69.3223 },
    ]),
    updated_at: "2026-01-01T00:00:00.000Z",
  };

  return {
    getDataValue: (key: string) => values[key as keyof typeof values],
  };
};

describe("greenSpaces routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(GreenSpace.findAll).mockResolvedValue([] as never);
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);
  });

  it("returns 401 when token is missing", async () => {
    const response = await request(app).post("/api/green-spaces").send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token no proporcionado" });
  });

  it("returns 403 for non-admin users", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 7,
      role: "regular",
    } as never);

    const response = await request(app)
      .post("/api/green-spaces")
      .set("Authorization", testAuthHeader)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Solo administradores" });
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/green-spaces")
      .set("Authorization", testAuthHeader)
      .send({ location: "Campus", images: ["https://example.com/a.jpg"] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Nombre y ubicación son obligatorios",
    });
  });

  it("returns 400 when perimeter has fewer than 3 points", async () => {
    const response = await request(app)
      .post("/api/green-spaces")
      .set("Authorization", testAuthHeader)
      .send({
        name: "Zona Verde",
        location: "Campus Norte",
        totalAreaM2: 2500,
        tallTreeCount: 40,
        images: ["https://example.com/a.jpg"],
        perimeterPoints: [
          { latitude: 10.06522, longitude: -69.32264 },
          { latitude: 10.06531, longitude: -69.3221 },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Debes indicar al menos 3 puntos válidos para el perímetro",
    });
  });

  it("creates a green space for valid admin payload", async () => {
    vi.mocked(GreenSpace.create).mockResolvedValue(
      makeGreenSpaceRow() as never,
    );

    const response = await request(app)
      .post("/api/green-spaces")
      .set("Authorization", testAuthHeader)
      .send({
        name: "Zona Verde",
        location: "Campus Norte",
        totalAreaM2: 2500,
        tallTreeCount: 40,
        images: ["https://example.com/a.jpg"],
        perimeterPoints: [
          { latitude: 10.06522, longitude: -69.32264 },
          { latitude: 10.06531, longitude: -69.3221 },
          { latitude: 10.0649, longitude: -69.3223 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 10,
      name: "Zona Verde",
      location: "Campus Norte",
      totalAreaM2: 2500,
      tallTreeCount: 40,
      perimeterPoints: [
        { latitude: 10.06522, longitude: -69.32264 },
        { latitude: 10.06531, longitude: -69.3221 },
        { latitude: 10.0649, longitude: -69.3223 },
      ],
    });
    expect(GreenSpace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Zona Verde",
        location: "Campus Norte",
        images: JSON.stringify(["https://example.com/a.jpg"]),
        perimeter_points: JSON.stringify([
          { latitude: 10.06522, longitude: -69.32264 },
          { latitude: 10.06531, longitude: -69.3221 },
          { latitude: 10.0649, longitude: -69.3223 },
        ]),
      }),
    );
  });
});
