import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import treeRoutes from "./trees";
import { GreenSpace, TreeInventory, TreeType } from "../models";

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  GreenSpace: {
    findByPk: vi.fn(),
  },
  TreeType: {
    findByPk: vi.fn(),
  },
  TreeInventory: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  User: {},
}));

const app = express();
app.use(express.json());
app.use("/api/trees", treeRoutes);

const makeTreeRow = ({
  spaceId = 10,
  typeId = 5,
  status = "approved",
  submittedByUserId = 2,
  validatedByUserId = 1,
}: {
  spaceId?: number;
  typeId?: number | null;
  status?: "pending" | "approved" | "rejected";
  submittedByUserId?: number;
  validatedByUserId?: number | null;
} = {}) => {
  const values: Record<string, unknown> = {
    tree_id: 7,
    name: "Arbol 1",
    health_status: "healthy",
    type_id: typeId,
    space_id: spaceId,
    status,
    submitted_by_user_id: submittedByUserId,
    validated_by_user_id: validatedByUserId,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6",
    ]),
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    get: vi.fn((key: string) => {
      if (key === "TreeType" && typeId) {
        return {
          getDataValue: (nestedKey: string) => {
            if (nestedKey === "type_id") return typeId;
            if (nestedKey === "name") return "Araguaney";
            return undefined;
          },
        } as TreeType;
      }

      if (key === "GreenSpace") {
        return {
          getDataValue: (nestedKey: string) => {
            if (nestedKey === "space_id") return spaceId;
            if (nestedKey === "name") return "Jardin Central";
            return undefined;
          },
        } as GreenSpace;
      }

      if (key === "SubmittedBy") {
        return {
          getDataValue: (nestedKey: string) => {
            if (nestedKey === "user_id") return submittedByUserId;
            if (nestedKey === "username") return "regular.user";
            if (nestedKey === "name") return "Regular User";
            return undefined;
          },
        };
      }

      if (key === "ValidatedBy" && validatedByUserId) {
        return {
          getDataValue: (nestedKey: string) => {
            if (nestedKey === "user_id") return validatedByUserId;
            if (nestedKey === "username") return "admin";
            if (nestedKey === "name") return "Admin User";
            return undefined;
          },
        };
      }

      return undefined;
    }),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
    destroy: vi.fn(async () => null),
  };
};

const makeGreenSpaceRow = (treesCount = 10) => {
  const values: Record<string, unknown> = {
    trees_count: treesCount,
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
  };
};

describe("tree inventory routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);
    vi.mocked(TreeInventory.findAll).mockResolvedValue([] as never);
  });

  it("returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/trees");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Token no proporcionado" });
  });

  it("returns inventory rows for authenticated users", async () => {
    vi.mocked(TreeInventory.findAll).mockResolvedValue([
      makeTreeRow(),
    ] as never);

    const response = await request(app)
      .get("/api/trees")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 7,
      name: "Arbol 1",
      typeId: 5,
      spaceId: 10,
      status: "approved",
    });
  });

  it("allows regular users to submit trees as pending", async () => {
    const createdPendingTree = makeTreeRow({
      typeId: null,
      status: "pending",
      validatedByUserId: null,
    });

    vi.mocked(GreenSpace.findByPk).mockResolvedValue(
      makeGreenSpaceRow() as never,
    );
    vi.mocked(TreeInventory.create).mockResolvedValue(
      createdPendingTree as never,
    );
    vi.mocked(TreeInventory.findByPk).mockResolvedValue(
      createdPendingTree as never,
    );

    const response = await request(app)
      .post("/api/trees")
      .set("Authorization", "Bearer any-token")
      .send({
        name: "Arbol enviado",
        healthStatus: "healthy",
        spaceId: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body.tree).toMatchObject({
      id: 7,
      status: "pending",
      typeId: null,
    });
  });

  it("allows admin to create trees without type", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const spaceRow = makeGreenSpaceRow(20);
    const createdTree = makeTreeRow({ typeId: null, status: "approved" });

    vi.mocked(GreenSpace.findByPk)
      .mockResolvedValueOnce(spaceRow as never)
      .mockResolvedValueOnce(spaceRow as never);
    vi.mocked(TreeInventory.create).mockResolvedValue(createdTree as never);
    vi.mocked(TreeInventory.findByPk).mockResolvedValue(createdTree as never);

    const response = await request(app)
      .post("/api/trees")
      .set("Authorization", "Bearer any-token")
      .send({
        name: "Nuevo arbol",
        healthStatus: "healthy",
        spaceId: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body.tree).toMatchObject({
      id: 7,
      typeId: null,
      status: "approved",
    });
  });

  it("allows any authenticated user to upload tree images", async () => {
    const response = await request(app)
      .post("/api/trees/images")
      .set("Authorization", "Bearer any-token")
      .attach("images", Buffer.from([0xff, 0xd8, 0xff]), "tree.jpg");

    expect(response.status).toBe(201);
    expect(response.body.images).toHaveLength(1);
    expect(String(response.body.images[0])).toContain("/uploads/trees/");
  });

  it("allows admin to approve pending trees", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const pendingTree = makeTreeRow({
      status: "pending",
      validatedByUserId: null,
    });
    const approvedTree = makeTreeRow({
      status: "approved",
      validatedByUserId: 1,
    });
    const spaceRow = makeGreenSpaceRow(9);

    vi.mocked(TreeInventory.findByPk)
      .mockResolvedValueOnce(pendingTree as never)
      .mockResolvedValueOnce(approvedTree as never);
    vi.mocked(GreenSpace.findByPk).mockResolvedValue(spaceRow as never);

    const response = await request(app)
      .patch("/api/trees/7/approve")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 7, status: "approved" });
  });

  it("allows admin to reject pending trees", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const pendingTree = makeTreeRow({
      status: "pending",
      validatedByUserId: null,
    });
    const rejectedTree = makeTreeRow({
      status: "rejected",
      validatedByUserId: 1,
    });

    vi.mocked(TreeInventory.findByPk)
      .mockResolvedValueOnce(pendingTree as never)
      .mockResolvedValueOnce(rejectedTree as never);

    const response = await request(app)
      .patch("/api/trees/7/reject")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 7, status: "rejected" });
  });
});
