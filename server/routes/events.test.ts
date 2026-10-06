import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import eventRoutes from "./events";
import { Event, EventEnrollment, User } from "../models";

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../models", () => ({
  Event: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
  },
  EventEnrollment: {
    count: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
  },
  User: {},
}));

const app = express();
app.use(express.json());
app.use("/api/events", eventRoutes);

const makeEventRow = (status: "open" | "closed" = "open") => {
  const values: Record<string, unknown> = {
    event_id: 7,
    title: "Jornada de siembra",
    description: "Actividad para plantar nuevos arboles",
    status,
    closure_description: null,
    closure_images: JSON.stringify([]),
    created_by_user_id: 1,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };

  return {
    getDataValue: vi.fn((key: string) => values[key]),
    get: vi.fn((key: string) => {
      if (key !== "CreatedBy") return undefined;
      return {
        getDataValue: (nestedKey: string) => {
          if (nestedKey === "user_id") return 1;
          if (nestedKey === "username") return "admin";
          if (nestedKey === "name") return "Administrador";
          return undefined;
        },
      } as User;
    }),
    update: vi.fn(async (payload: Record<string, unknown>) => {
      Object.assign(values, payload);
      return null;
    }),
  };
};

describe("event routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Event.findAll).mockResolvedValue([] as never);
    vi.mocked(EventEnrollment.count).mockResolvedValue(0 as never);
    vi.mocked(EventEnrollment.findOne).mockResolvedValue(null as never);
    vi.mocked(EventEnrollment.findAll).mockResolvedValue([] as never);
  });

  it("returns event detail with participants for admin", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const event = makeEventRow("open");
    vi.mocked(Event.findByPk).mockResolvedValue(event as never);
    vi.mocked(EventEnrollment.count).mockResolvedValue(2 as never);
    vi.mocked(EventEnrollment.findAll).mockResolvedValue([
      {
        getDataValue: vi.fn((key: string) => {
          if (key === "created_at") return new Date("2026-01-02T10:00:00.000Z");
          return null;
        }),
        get: vi.fn((key: string) => {
          if (key !== "Participant") return undefined;
          return {
            getDataValue: (nestedKey: string) => {
              if (nestedKey === "user_id") return 2;
              if (nestedKey === "username") return "regular.user";
              if (nestedKey === "name") return "Regular User";
              return undefined;
            },
          } as User;
        }),
      },
    ] as never);

    const response = await request(app)
      .get("/api/events/7")
      .set("Authorization", "Bearer any-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 7,
      enrollmentCount: 2,
      participants: [
        {
          id: 2,
          username: "regular.user",
          name: "Regular User",
        },
      ],
    });
  });

  it("lists events without authentication", async () => {
    vi.mocked(Event.findAll).mockResolvedValue([makeEventRow()] as never);

    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 7,
      title: "Jornada de siembra",
      status: "open",
      enrollmentCount: 0,
      isEnrolled: false,
    });
  });

  it("allows admin to create event", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    vi.mocked(Event.create).mockResolvedValue(makeEventRow("open") as never);

    const response = await request(app)
      .post("/api/events")
      .set("Authorization", "Bearer any-token")
      .send({
        title: "Jornada de siembra",
        description: "Actividad para plantar nuevos arboles",
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("open");
    expect(Event.create).toHaveBeenCalled();
  });

  it("blocks regular user from creating event", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);

    const response = await request(app)
      .post("/api/events")
      .set("Authorization", "Bearer any-token")
      .send({
        title: "Jornada",
        description: "Actividad",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Solo administradores" });
  });

  it("allows regular user to enroll in open event", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);

    vi.mocked(Event.findByPk).mockResolvedValue(makeEventRow("open") as never);
    vi.mocked(EventEnrollment.count).mockResolvedValue(1 as never);

    const response = await request(app)
      .post("/api/events/7/enroll")
      .set("Authorization", "Bearer any-token")
      .send({});

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      eventId: 7,
      enrollmentCount: 1,
    });
  });

  it("rejects enrollment when event is closed", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 2,
      role: "regular",
    } as never);

    vi.mocked(Event.findByPk).mockResolvedValue(
      makeEventRow("closed") as never,
    );

    const response = await request(app)
      .post("/api/events/7/enroll")
      .set("Authorization", "Bearer any-token")
      .send({});

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("eventos abiertos");
  });

  it("allows admin to close event and publish evidence", async () => {
    vi.mocked(jwt.verify).mockReturnValue({
      user_id: 1,
      role: "admin",
    } as never);

    const event = makeEventRow("open");
    vi.mocked(Event.findByPk).mockResolvedValue(event as never);
    vi.mocked(EventEnrollment.count).mockResolvedValue(5 as never);

    const response = await request(app)
      .patch("/api/events/7/close")
      .set("Authorization", "Bearer any-token")
      .send({
        closureDescription: "Se completó la jornada con éxito",
        closureImages: ["/uploads/events/foto-1.jpg"],
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 7,
      status: "closed",
      enrollmentCount: 5,
      closureDescription: "Se completó la jornada con éxito",
      closureImages: ["/uploads/events/foto-1.jpg"],
    });
  });
});
