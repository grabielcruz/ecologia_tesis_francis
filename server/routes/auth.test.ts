import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authRoutes from "./auth";
import { User } from "../models";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  Role: {},
  User: {
    findOne: vi.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const makeUserRow = (overrides?: {
  user_id?: number;
  name?: string;
  username?: string;
  email?: string;
  password_hash?: string;
  is_active?: boolean;
  avatar_url?: string;
  role_name?: string;
}) => {
  const values = {
    user_id: 1,
    name: "Admin User",
    username: "admin",
    email: "admin@greenmetric.local",
    password_hash: "stored-hash",
    is_active: true,
    avatar_url: "",
    role_name: "admin",
    ...overrides,
  };

  return {
    getDataValue: (key: string) => values[key as keyof typeof values],
    get: (key: string) => {
      if (key !== "Role") return undefined;
      return {
        getDataValue: (roleKey: string) =>
          roleKey === "role_name" ? values.role_name : undefined,
      };
    },
  };
};

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jwt.sign).mockReturnValue("fake-jwt-token" as never);
  });

  it("returns 400 when username or password is missing", async () => {
    const response = await request(app).post("/api/auth/login").send({ username: "" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Usuario y contrasena son obligatorios" });
  });

  it("returns 401 when user is not found", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null as never);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Credenciales invalidas" });
  });

  it("returns 403 when user is inactive", async () => {
    vi.mocked(User.findOne).mockResolvedValue(
      makeUserRow({ is_active: false, password_hash: "hash" }) as never,
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Usuario inactivo" });
  });

  it("returns token and user payload for valid credentials", async () => {
    vi.mocked(User.findOne).mockResolvedValue(makeUserRow() as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "admin123" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("fake-jwt-token");
    expect(response.body.user).toMatchObject({
      id: 1,
      username: "admin",
      role: "admin",
    });
    expect(jwt.sign).toHaveBeenCalledTimes(1);
  });
});
